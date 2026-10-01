import { getPrismaClient } from '../config/database.js';
import { Prisma, type BookingStatus } from '@prisma/client';
import { BookingTransitionService } from './booking-transition.service.js';

import { AvailabilityService, timeToMinutes, validateTimeFormat } from './availability.service.js';
import type {
  CreateServiceRequestInput,
  RescheduleBookingRequest,
  BookingListQuery,
  BookingRecord,
  BookingAddressSnapshot,
  BookingUserSnapshot,
} from '@sevasetu/shared';
import crypto from 'node:crypto';

export class BookingConflictError extends Error {
  public code = 'SCHEDULE_CONFLICT';
  constructor(message: string) {
    super(message);
    this.name = 'BookingConflictError';
  }
}

export class BookingNotFoundError extends Error {
  public code = 'BOOKING_NOT_FOUND';
  constructor(message: string = 'Booking not found.') {
    super(message);
    this.name = 'BookingNotFoundError';
  }
}

export class BookingAuthorizationError extends Error {
  public code = 'FORBIDDEN';
  constructor(message: string = 'Forbidden: Access to this booking is unauthorized.') {
    super(message);
    this.name = 'BookingAuthorizationError';
  }
}

export class BookingValidationError extends Error {
  public code = 'VALIDATION_ERROR';
  constructor(message: string) {
    super(message);
    this.name = 'BookingValidationError';
  }
}

/**
 * Calculates end time string "HH:mm" from start time and duration in hours.
 */
export function calculateEndTime(startTime: string, durationHours: number): string {
  const startMin = timeToMinutes(startTime);
  const totalMin = startMin + Math.round(durationHours * 60);
  const endH = Math.floor(totalMin / 60) % 24;
  const endM = totalMin % 60;
  return `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
}

/**
 * Checks if two time intervals [startA, endA) and [startB, endB) intersect.
 * Touching boundaries (e.g. 10:00-12:00 and 12:00-14:00) DO NOT conflict.
 */
export function intervalsIntersect(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  const aStartMin = timeToMinutes(startA);
  const aEndMin = timeToMinutes(endA);
  const bStartMin = timeToMinutes(startB);
  const bEndMin = timeToMinutes(endB);

  return Math.max(aStartMin, bStartMin) < Math.min(aEndMin, bEndMin);
}

const ACTIVE_BOOKING_STATUSES: BookingStatus[] = [
  'PENDING_PROVIDER',
  'ACCEPTED',
  'SCHEDULED',
  'ON_THE_WAY',
  'ARRIVED',
  'IN_PROGRESS',
];

export class BookingService {
  /**
   * Concurrency-safe creation of a ServiceRequest and corresponding Booking.
   * Uses PostgreSQL interactive transactions with strict availability and interval conflict detection.
   */
  static async createBookingRequest(
    customerId: string,
    input: CreateServiceRequestInput
  ): Promise<BookingRecord> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    // 1. Basic validation
    if (!input.serviceId) {
      throw new BookingValidationError('serviceId is required.');
    }
    if (!input.description?.trim()) {
      throw new BookingValidationError('description of service need is required.');
    }
    if (!input.requestedDate || isNaN(Date.parse(input.requestedDate))) {
      throw new BookingValidationError('Valid requestedDate in YYYY-MM-DD format is required.');
    }
    if (!input.requestedStartTime) {
      throw new BookingValidationError('requestedStartTime is required.');
    }
    validateTimeFormat(input.requestedStartTime, 'requestedStartTime');

    const durationHours = Number(input.requestedDurationHours || 1.0);
    if (isNaN(durationHours) || durationHours < 0.5 || durationHours > 12) {
      throw new BookingValidationError('requestedDurationHours must be between 0.5 and 12.');
    }

    const scheduledEndTime = calculateEndTime(input.requestedStartTime, durationHours);
    const targetDate = new Date(`${input.requestedDate}T00:00:00.000Z`);

    // Execute atomic creation inside a PostgreSQL transaction
    const booking = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      if (!input.providerProfileId) {
        throw new BookingValidationError('providerProfileId is required to create a booking.');
      }

      // Concurrency control: Acquire PostgreSQL row-level exclusive lock on the provider profile
      // This serializes concurrent booking attempts for the same provider and guarantees conflict detection
      await tx.$executeRaw`SELECT id FROM "ServiceProviderProfile" WHERE id = ${input.providerProfileId} FOR UPDATE`;

      // A. Verify Customer
      const customer = await tx.user.findUnique({
        where: { id: customerId },
      });
      if (!customer || customer.status !== 'ACTIVE') {
        throw new BookingAuthorizationError('Customer account not found or is inactive.');
      }


      // B. Resolve Address & Snapshot
      let addressSnapshot: BookingAddressSnapshot;
      let addressId: string | null = null;

      if (input.addressId) {
        const addr = await tx.address.findUnique({
          where: { id: input.addressId },
        });
        if (!addr) {
          throw new BookingValidationError('Selected address was not found.');
        }
        if (addr.userId !== customerId) {
          throw new BookingAuthorizationError('Unauthorized: Customer does not own selected address.');
        }
        addressId = addr.id;
        addressSnapshot = {
          flatNumber: addr.flatNumber,
          streetArea: addr.streetArea,
          city: addr.city,
          state: addr.state || 'Uttar Pradesh',
          postalCode: addr.postalCode,
          landmark: addr.landmark,
        };
      } else if (input.address) {
        if (!input.address.flatNumber || !input.address.streetArea || !input.address.city || !input.address.postalCode) {
          throw new BookingValidationError('Full address (flatNumber, streetArea, city, postalCode) is required.');
        }
        addressSnapshot = {
          flatNumber: input.address.flatNumber.trim(),
          streetArea: input.address.streetArea.trim(),
          city: input.address.city.trim(),
          state: input.address.state?.trim() || 'Uttar Pradesh',
          postalCode: input.address.postalCode.trim(),
          landmark: input.address.landmark?.trim() || null,
        };
      } else {
        throw new BookingValidationError('Either addressId or address payload must be provided.');
      }

      // C. Verify Service exists and is active
      const service = await tx.service.findUnique({
        where: { id: input.serviceId },
        include: { category: true },
      });
      if (!service || !service.isActive) {
        throw new BookingValidationError('Requested service is invalid or currently inactive.');
      }

      // D. Verify Provider if provided
      if (!input.providerProfileId) {
        throw new BookingValidationError('providerProfileId is required to create a booking.');
      }

      const providerProfile = await tx.serviceProviderProfile.findUnique({
        where: { id: input.providerProfileId },
        include: {
          user: true,
          services: { where: { serviceId: input.serviceId } },
          serviceAreas: true,
        },
      });

      if (!providerProfile) {
        throw new BookingValidationError('Selected service provider was not found.');
      }
      if (providerProfile.user.status !== 'ACTIVE') {
        throw new BookingValidationError('Selected service provider account is inactive.');
      }
      if (providerProfile.onboardingStatus !== 'COMPLETED') {
        throw new BookingValidationError('Selected service provider onboarding is incomplete.');
      }
      if (!providerProfile.isPubliclyListed) {
        throw new BookingValidationError('Selected service provider is not publicly listed.');
      }
      if (providerProfile.vacationMode) {
        throw new BookingValidationError('Selected provider is currently unavailable (vacation mode).');
      }

      // Verify Provider offers this service
      const providerService = providerProfile.services[0];
      if (!providerService || !providerService.isActive) {
        throw new BookingValidationError('Selected provider does not offer the requested service.');
      }

      // Verify Provider covers location postal code / city
      const coversLocation = providerProfile.serviceAreas.some(
        (area) =>
          area.postalCode === addressSnapshot.postalCode ||
          area.city.toLowerCase() === addressSnapshot.city.toLowerCase()
      );
      if (providerProfile.serviceAreas.length > 0 && !coversLocation) {
        throw new BookingValidationError(
          `Provider does not service your location (${addressSnapshot.city}, ${addressSnapshot.postalCode}).`
        );
      }

      // E. Availability Re-validation
      const availabilityCheck = await AvailabilityService.checkProviderAvailability(
        providerProfile.id,
        input.requestedDate,
        input.requestedStartTime,
        durationHours
      );
      if (!availabilityCheck.isAvailable) {
        throw new BookingValidationError(
          availabilityCheck.reason || 'Provider is unavailable at the requested schedule.'
        );
      }

      // F. Conflict Detection: Check overlapping active bookings
      const existingBookings = await tx.booking.findMany({
        where: {
          providerProfileId: providerProfile.id,
          scheduledDate: targetDate,
          status: { in: ACTIVE_BOOKING_STATUSES },
        },
        select: {
          id: true,
          scheduledStartTime: true,
          scheduledEndTime: true,
        },
      });

      for (const existing of existingBookings) {
        if (
          intervalsIntersect(
            input.requestedStartTime,
            scheduledEndTime,
            existing.scheduledStartTime,
            existing.scheduledEndTime
          )
        ) {
          throw new BookingConflictError(
            `Schedule conflict: Provider already has an active booking between ${existing.scheduledStartTime} and ${existing.scheduledEndTime} on ${input.requestedDate}.`
          );
        }
      }

      // G. Create ServiceRequest
      const serviceRequest = await tx.serviceRequest.create({
        data: {
          customerId,
          serviceId: service.id,
          selectedProviderId: providerProfile.id,
          description: input.description.trim(),
          requestedDate: targetDate,
          requestedStartTime: input.requestedStartTime,
          requestedDurationHours: durationHours,
          addressId,
          addressSnapshot: addressSnapshot as unknown as Prisma.InputJsonValue,
          preferences: (input.preferences as unknown as Prisma.InputJsonValue) || Prisma.JsonNull,
          status: 'PENDING_PROVIDER',
        },
      });

      // H. Create Snapshots
      const serviceTitleSnapshot = providerService.customTitle || service.title;
      const pricingModelSnapshot = providerService.pricingModel || service.pricingModel;
      const priceSnapshot = providerService.customPrice ?? service.basePrice ?? null;

      const customerSnapshot: BookingUserSnapshot = {
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone,
      };

      const providerSnapshot: BookingUserSnapshot = {
        fullName: providerProfile.user.fullName,
        email: providerProfile.user.email,
        phone: providerProfile.user.phone,
        businessName: providerProfile.businessName,
      };

      // Generate unique reference code: BK-YYYYMMDD-XXXX
      const dateCode = input.requestedDate.replace(/-/g, '');
      const randomHex = crypto.randomBytes(2).toString('hex').toUpperCase();
      const referenceCode = `BK-${dateCode}-${randomHex}`;

      // I. Create Booking
      const newBooking = await tx.booking.create({
        data: {
          referenceCode,
          serviceRequestId: serviceRequest.id,
          customerId,
          providerProfileId: providerProfile.id,
          serviceId: service.id,
          scheduledDate: targetDate,
          scheduledStartTime: input.requestedStartTime,
          scheduledEndTime,
          durationHours,
          status: 'PENDING_PROVIDER',
          serviceTitleSnapshot,
          pricingModelSnapshot,
          priceSnapshot,
          locationSnapshot: addressSnapshot as unknown as Prisma.InputJsonValue,
          customerSnapshot: customerSnapshot as unknown as Prisma.InputJsonValue,
          providerSnapshot: providerSnapshot as unknown as Prisma.InputJsonValue,
          notes: input.preferences?.additionalInstructions || null,
        },
      });

      // J. Create Initial Status History
      await tx.bookingStatusHistory.create({
        data: {
          bookingId: newBooking.id,
          previousStatus: null,
          newStatus: 'PENDING_PROVIDER',
          actorType: 'CUSTOMER',
          actorUserId: customerId,
          reason: 'Booking request created by customer.',
        },
      });

      return newBooking;
    });

    // Return complete booking with populated relations
    return (await this.getBookingByIdInternal(booking.id)) as BookingRecord;
  }

  /**
   * Internal helper to fetch a booking by ID with standard relations and serialized dates.
   */
  private static async getBookingByIdInternal(bookingId: string) {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        serviceRequest: true,
        statusHistory: {
          orderBy: { createdAt: 'asc' },
        },
        service: {
          include: { category: true },
        },
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
        providerProfile: {
          select: {
            id: true,
            businessName: true,
            avatarUrl: true,
            user: {
              select: {
                fullName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!booking) return null;

    return {
      ...booking,
      scheduledDate: booking.scheduledDate.toISOString().split('T')[0] as string,
      createdAt: booking.createdAt.toISOString(),
      updatedAt: booking.updatedAt.toISOString(),
      locationSnapshot: booking.locationSnapshot as unknown as BookingAddressSnapshot,
      customerSnapshot: booking.customerSnapshot as unknown as BookingUserSnapshot,
      providerSnapshot: booking.providerSnapshot as unknown as BookingUserSnapshot,
      serviceRequest: booking.serviceRequest
        ? {
            ...booking.serviceRequest,
            requestedDate: booking.serviceRequest.requestedDate.toISOString().split('T')[0] as string,
            addressSnapshot: booking.serviceRequest.addressSnapshot as unknown as BookingAddressSnapshot,
            createdAt: booking.serviceRequest.createdAt.toISOString(),
            updatedAt: booking.serviceRequest.updatedAt.toISOString(),
          }
        : undefined,
      statusHistory: booking.statusHistory.map((h) => ({
        ...h,
        createdAt: h.createdAt.toISOString(),
      })),
    } as unknown as BookingRecord;
  }


  /**
   * Provider Accepts a booking request transactionally.
   */
  static async acceptBooking(
    userId: string,
    bookingId: string,
    notes?: string
  ): Promise<BookingRecord> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const profile = await prisma.serviceProviderProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new BookingAuthorizationError('Provider profile not found for this user account.');
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Row-level lock on provider profile to serialize accept / schedule operations
      await tx.$executeRaw`SELECT id FROM "ServiceProviderProfile" WHERE id = ${profile.id} FOR UPDATE`;

      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
      });
      if (!booking) {
        throw new BookingNotFoundError('Booking not found.');
      }
      if (booking.providerProfileId !== profile.id) {
        throw new BookingAuthorizationError('Forbidden: You can only accept bookings assigned to you.');
      }


      // Validate status transition
      BookingTransitionService.validateTransition(booking.status, 'ACCEPTED', 'PROVIDER');

      const dateStr = booking.scheduledDate.toISOString().split('T')[0] as string;

      // Re-check provider availability
      const availabilityCheck = await AvailabilityService.checkProviderAvailability(
        profile.id,
        dateStr,
        booking.scheduledStartTime,
        booking.durationHours
      );
      if (!availabilityCheck.isAvailable) {
        throw new BookingValidationError(
          availabilityCheck.reason || 'Cannot accept: Provider schedule is no longer available for this slot.'
        );
      }

      // Re-check conflicting bookings (excluding this booking)
      const conflicts = await tx.booking.findMany({
        where: {
          providerProfileId: profile.id,
          scheduledDate: booking.scheduledDate,
          id: { not: booking.id },
          status: { in: ACTIVE_BOOKING_STATUSES },
        },
      });

      for (const existing of conflicts) {
        if (
          intervalsIntersect(
            booking.scheduledStartTime,
            booking.scheduledEndTime,
            existing.scheduledStartTime,
            existing.scheduledEndTime
          )
        ) {
          throw new BookingConflictError(
            `Schedule conflict: Overlapping booking (${existing.referenceCode}) already confirmed for this time window.`
          );
        }
      }

      // Transition to ACCEPTED (then auto-confirm schedule to SCHEDULED)
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: 'SCHEDULED',
          notes: notes?.trim() || booking.notes,
        },
      });

      // Record ACCEPTED transition
      await tx.bookingStatusHistory.create({
        data: {
          bookingId: booking.id,
          previousStatus: booking.status,
          newStatus: 'ACCEPTED',
          actorType: 'PROVIDER',
          actorUserId: userId,
          reason: notes?.trim() || 'Provider accepted service request.',
        },
      });

      // Record SCHEDULED transition
      await tx.bookingStatusHistory.create({
        data: {
          bookingId: booking.id,
          previousStatus: 'ACCEPTED',
          newStatus: 'SCHEDULED',
          actorType: 'PROVIDER',
          actorUserId: userId,
          reason: 'Schedule confirmed and locked.',
        },
      });

      // Update ServiceRequest status
      await tx.serviceRequest.update({
        where: { id: booking.serviceRequestId },
        data: { status: 'ACCEPTED' },
      });
    });

    return (await this.getBookingByIdInternal(bookingId)) as BookingRecord;
  }

  /**
   * Provider Declines a booking request.
   */
  static async declineBooking(
    userId: string,
    bookingId: string,
    reason: string
  ): Promise<BookingRecord> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    if (!reason?.trim()) {
      throw new BookingValidationError('A reason must be provided when declining a request.');
    }

    const profile = await prisma.serviceProviderProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new BookingAuthorizationError('Provider profile not found for this user account.');
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
      });
      if (!booking) {
        throw new BookingNotFoundError('Booking not found.');
      }
      if (booking.providerProfileId !== profile.id) {
        throw new BookingAuthorizationError('Forbidden: You can only decline bookings assigned to you.');
      }

      BookingTransitionService.validateTransition(booking.status, 'DECLINED', 'PROVIDER');

      await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: 'DECLINED',
          cancellationReason: reason.trim(),
          cancelledBy: 'PROVIDER',
        },
      });

      await tx.bookingStatusHistory.create({
        data: {
          bookingId: booking.id,
          previousStatus: booking.status,
          newStatus: 'DECLINED',
          actorType: 'PROVIDER',
          actorUserId: userId,
          reason: reason.trim(),
        },
      });

      await tx.serviceRequest.update({
        where: { id: booking.serviceRequestId },
        data: { status: 'DECLINED' },
      });
    });

    return (await this.getBookingByIdInternal(bookingId)) as BookingRecord;
  }

  /**
   * Provider advances service execution states:
   * SCHEDULED -> ON_THE_WAY -> ARRIVED -> IN_PROGRESS -> COMPLETED
   */
  static async updateExecutionStatus(
    userId: string,
    bookingId: string,
    nextStatus: BookingStatus,
    notes?: string
  ): Promise<BookingRecord> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const profile = await prisma.serviceProviderProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new BookingAuthorizationError('Provider profile not found for this user account.');
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
      });
      if (!booking) {
        throw new BookingNotFoundError('Booking not found.');
      }
      if (booking.providerProfileId !== profile.id) {
        throw new BookingAuthorizationError('Forbidden: You can only manage execution of your own assigned jobs.');
      }

      BookingTransitionService.validateTransition(booking.status, nextStatus, 'PROVIDER');

      await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: nextStatus,
          notes: notes?.trim() ? `${booking.notes ? booking.notes + ' | ' : ''}${notes.trim()}` : booking.notes,
        },
      });

      await tx.bookingStatusHistory.create({
        data: {
          bookingId: booking.id,
          previousStatus: booking.status,
          newStatus: nextStatus,
          actorType: 'PROVIDER',
          actorUserId: userId,
          reason: notes?.trim() || `Provider transitioned job to ${nextStatus}.`,
        },
      });
    });

    return (await this.getBookingByIdInternal(bookingId)) as BookingRecord;
  }

  /**
   * Cancel booking (Customer or Provider).
   */
  static async cancelBooking(
    userId: string,
    actorType: 'CUSTOMER' | 'PROVIDER',
    bookingId: string,
    reason: string
  ): Promise<BookingRecord> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    if (!reason?.trim()) {
      throw new BookingValidationError('A cancellation reason is required.');
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
      });
      if (!booking) {
        throw new BookingNotFoundError('Booking not found.');
      }

      // Verify ownership
      if (actorType === 'CUSTOMER') {
        if (booking.customerId !== userId) {
          throw new BookingAuthorizationError('Forbidden: You can only cancel your own bookings.');
        }
      } else if (actorType === 'PROVIDER') {
        const profile = await tx.serviceProviderProfile.findUnique({
          where: { userId },
        });
        if (!profile || booking.providerProfileId !== profile.id) {
          throw new BookingAuthorizationError('Forbidden: You can only cancel jobs assigned to you.');
        }
      }

      // Validate transition
      BookingTransitionService.validateTransition(booking.status, 'CANCELLED', actorType);

      await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: 'CANCELLED',
          cancellationReason: reason.trim(),
          cancelledBy: actorType,
        },
      });

      await tx.bookingStatusHistory.create({
        data: {
          bookingId: booking.id,
          previousStatus: booking.status,
          newStatus: 'CANCELLED',
          actorType,
          actorUserId: userId,
          reason: reason.trim(),
        },
      });

      // Update ServiceRequest status
      await tx.serviceRequest.update({
        where: { id: booking.serviceRequestId },
        data: { status: 'CANCELLED' },
      });
    });

    return (await this.getBookingByIdInternal(bookingId)) as BookingRecord;
  }

  /**
   * Reschedule a booking (Customer).
   * Validates schedule, re-checks availability and conflict, updates timing, records history.
   */
  static async rescheduleBooking(
    customerId: string,
    bookingId: string,
    input: RescheduleBookingRequest
  ): Promise<BookingRecord> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    if (!input.newDate || isNaN(Date.parse(input.newDate))) {
      throw new BookingValidationError('Valid newDate in YYYY-MM-DD format is required.');
    }
    if (!input.newStartTime) {
      throw new BookingValidationError('newStartTime is required.');
    }
    validateTimeFormat(input.newStartTime, 'newStartTime');

    const newTargetDate = new Date(`${input.newDate}T00:00:00.000Z`);

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
      });
      if (!booking) {
        throw new BookingNotFoundError('Booking not found.');
      }
      if (booking.customerId !== customerId) {
        throw new BookingAuthorizationError('Forbidden: You can only reschedule your own bookings.');
      }

      // Row-level lock on provider profile to serialize reschedule operations
      await tx.$executeRaw`SELECT id FROM "ServiceProviderProfile" WHERE id = ${booking.providerProfileId} FOR UPDATE`;


      // Reschedule only allowed for PENDING_PROVIDER, ACCEPTED, SCHEDULED
      const reschedulableStatuses: BookingStatus[] = ['PENDING_PROVIDER', 'ACCEPTED', 'SCHEDULED'];
      if (!reschedulableStatuses.includes(booking.status)) {
        throw new BookingValidationError(
          `Cannot reschedule booking in status '${booking.status}'. Rescheduling is only permitted for requested or scheduled bookings.`
        );
      }

      const durationHours = input.durationHours || booking.durationHours;
      const newEndTime = calculateEndTime(input.newStartTime, durationHours);

      // Re-check provider availability on new date/time
      const availabilityCheck = await AvailabilityService.checkProviderAvailability(
        booking.providerProfileId,
        input.newDate,
        input.newStartTime,
        durationHours
      );
      if (!availabilityCheck.isAvailable) {
        throw new BookingValidationError(
          availabilityCheck.reason || 'Provider is unavailable at the requested new schedule.'
        );
      }

      // Re-check conflicts (excluding this booking)
      const conflicts = await tx.booking.findMany({
        where: {
          providerProfileId: booking.providerProfileId,
          scheduledDate: newTargetDate,
          id: { not: booking.id },
          status: { in: ACTIVE_BOOKING_STATUSES },
        },
      });

      for (const existing of conflicts) {
        if (
          intervalsIntersect(
            input.newStartTime,
            newEndTime,
            existing.scheduledStartTime,
            existing.scheduledEndTime
          )
        ) {
          throw new BookingConflictError(
            `Schedule conflict: Provider already has a confirmed booking (${existing.referenceCode}) at the requested time on ${input.newDate}.`
          );
        }
      }

      const oldDateStr = booking.scheduledDate.toISOString().split('T')[0];
      const oldTimeStr = booking.scheduledStartTime;

      // Update timing on Booking
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          scheduledDate: newTargetDate,
          scheduledStartTime: input.newStartTime,
          scheduledEndTime: newEndTime,
          durationHours,
        },
      });

      // Update timing on ServiceRequest
      await tx.serviceRequest.update({
        where: { id: booking.serviceRequestId },
        data: {
          requestedDate: newTargetDate,
          requestedStartTime: input.newStartTime,
          requestedDurationHours: durationHours,
        },
      });

      // Record in status history
      await tx.bookingStatusHistory.create({
        data: {
          bookingId: booking.id,
          previousStatus: booking.status,
          newStatus: booking.status,
          actorType: 'CUSTOMER',
          actorUserId: customerId,
          reason: `Rescheduled from ${oldDateStr} ${oldTimeStr} to ${input.newDate} ${input.newStartTime}`,
          metadata: {
            oldDate: oldDateStr,
            oldStartTime: oldTimeStr,
            newDate: input.newDate,
            newStartTime: input.newStartTime,
          },
        },
      });
    });

    return (await this.getBookingByIdInternal(bookingId)) as BookingRecord;
  }

  /**
   * Customer lists their own bookings.
   */
  static async getCustomerBookings(
    customerId: string,
    query: BookingListQuery = {}
  ): Promise<{ bookings: BookingRecord[]; total: number; page: number; limit: number; totalPages: number }> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(50, Math.max(1, Number(query.limit || 10)));
    const skip = (page - 1) * limit;

    const where: Prisma.BookingWhereInput = {
      customerId,
    };

    if (query.status) {
      if (Array.isArray(query.status)) {
        where.status = { in: query.status };
      } else {
        where.status = query.status;
      }
    }

    const [total, items] = await Promise.all([
      prisma.booking.count({ where }),
      prisma.booking.findMany({
        where,
        orderBy: { scheduledDate: 'desc' },
        skip,
        take: limit,
        include: {
          service: {
            include: { category: true },
          },
          providerProfile: {
            select: {
              id: true,
              businessName: true,
              avatarUrl: true,
              user: {
                select: {
                  fullName: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
          statusHistory: {
            orderBy: { createdAt: 'asc' },
          },
        },
      }),
    ]);

    const bookings = items.map((b) => ({
      ...b,
      scheduledDate: b.scheduledDate.toISOString().split('T')[0],
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
      locationSnapshot: b.locationSnapshot as unknown as BookingAddressSnapshot,
      customerSnapshot: b.customerSnapshot as unknown as BookingUserSnapshot,
      providerSnapshot: b.providerSnapshot as unknown as BookingUserSnapshot,
      statusHistory: b.statusHistory.map((h) => ({
        ...h,
        createdAt: h.createdAt.toISOString(),
      })),
    })) as unknown as BookingRecord[];

    return {
      bookings,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Customer gets a single booking details with ownership check.
   */
  static async getCustomerBookingById(
    customerId: string,
    bookingId: string
  ): Promise<BookingRecord> {
    const booking = await this.getBookingByIdInternal(bookingId);
    if (!booking) {
      throw new BookingNotFoundError('Booking not found.');
    }
    if (booking.customerId !== customerId) {
      throw new BookingAuthorizationError('Forbidden: You can only view your own bookings.');
    }
    return booking as BookingRecord;
  }

  /**
   * Provider lists their assigned bookings/jobs.
   */
  static async getProviderBookings(
    userId: string,
    query: BookingListQuery = {}
  ): Promise<{ bookings: BookingRecord[]; total: number; page: number; limit: number; totalPages: number }> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const profile = await prisma.serviceProviderProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new BookingAuthorizationError('Provider profile not found for this user account.');
    }

    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(50, Math.max(1, Number(query.limit || 10)));
    const skip = (page - 1) * limit;

    const where: Prisma.BookingWhereInput = {
      providerProfileId: profile.id,
    };

    if (query.status) {
      if (Array.isArray(query.status)) {
        where.status = { in: query.status };
      } else {
        where.status = query.status;
      }
    }

    const [total, items] = await Promise.all([
      prisma.booking.count({ where }),
      prisma.booking.findMany({
        where,
        orderBy: { scheduledDate: 'desc' },
        skip,
        take: limit,
        include: {
          service: {
            include: { category: true },
          },
          customer: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
            },
          },
          statusHistory: {
            orderBy: { createdAt: 'asc' },
          },
        },
      }),
    ]);

    const bookings = items.map((b) => ({
      ...b,
      scheduledDate: b.scheduledDate.toISOString().split('T')[0],
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
      locationSnapshot: b.locationSnapshot as unknown as BookingAddressSnapshot,
      customerSnapshot: b.customerSnapshot as unknown as BookingUserSnapshot,
      providerSnapshot: b.providerSnapshot as unknown as BookingUserSnapshot,
      statusHistory: b.statusHistory.map((h) => ({
        ...h,
        createdAt: h.createdAt.toISOString(),
      })),
    })) as unknown as BookingRecord[];

    return {
      bookings,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }


  /**
   * Provider lists incoming requests (PENDING_PROVIDER).
   */
  static async getProviderBookingRequests(
    userId: string,
    query: BookingListQuery = {}
  ) {
    return this.getProviderBookings(userId, {
      ...query,
      status: 'PENDING_PROVIDER',
    });
  }

  /**
   * Provider gets a single assigned booking details with ownership check.
   */
  static async getProviderBookingById(
    userId: string,
    bookingId: string
  ): Promise<BookingRecord> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const profile = await prisma.serviceProviderProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new BookingAuthorizationError('Provider profile not found for this user account.');
    }

    const booking = await this.getBookingByIdInternal(bookingId);
    if (!booking) {
      throw new BookingNotFoundError('Booking not found.');
    }
    if (booking.providerProfileId !== profile.id) {
      throw new BookingAuthorizationError('Forbidden: You can only view bookings assigned to you.');
    }

    return booking as BookingRecord;
  }
}
