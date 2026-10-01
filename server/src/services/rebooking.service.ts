import { getPrismaClient } from '../config/database.js';
import { BookingService, BookingValidationError, BookingAuthorizationError } from './booking.service.js';
import type {
  RebookEligibilityCheck,
  CreateRebookRequestInput,
  BookingRecord,
  CatalogPricingModel,
} from '@sevasetu/shared';

export class RebookingService {
  /**
   * Checks whether a booking is eligible for rebooking and returns reusable data.
   */
  static async checkRebookEligibility(
    customerId: string,
    bookingId: string
  ): Promise<RebookEligibilityCheck> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        service: true,
        providerProfile: {
          include: {
            user: true,
            services: { where: { serviceId: { not: undefined } } },
          },
        },
        serviceRequest: true,
      },
    });

    if (!booking) {
      throw new BookingValidationError(`Booking ${bookingId} not found.`);
    }

    if (booking.customerId !== customerId) {
      throw new BookingAuthorizationError('Unauthorized: You can only rebook your own bookings.');
    }

    if (booking.status !== 'COMPLETED') {
      return {
        eligible: false,
        reason: `Rebooking is only permitted from completed bookings. Current status is ${booking.status}.`,
        serviceId: booking.serviceId,
        serviceTitle: booking.serviceTitleSnapshot,
        providerId: booking.providerProfileId,
        providerName: booking.providerProfile.user.fullName || 'Provider',
        providerAvailable: false,
        pricingModel: booking.pricingModelSnapshot as CatalogPricingModel,
        basePrice: booking.priceSnapshot,
        suggestedLocation: booking.locationSnapshot as Record<string, unknown>,
        previousPreferences: booking.serviceRequest.preferences as Record<string, unknown> | null,
      };
    }

    // Check provider status and service offering
    const provider = booking.providerProfile;
    const isProviderActive = provider.user.status === 'ACTIVE';
    const isOnboarded = provider.onboardingStatus === 'COMPLETED';
    const notOnVacation = !provider.vacationMode;
    const providerService = provider.services.find((s) => s.serviceId === booking.serviceId && s.isActive);

    const providerAvailable = isProviderActive && isOnboarded && notOnVacation && !!providerService;
    let reason: string | undefined;

    if (!providerAvailable) {
      if (!isProviderActive) reason = 'The provider account is currently inactive.';
      else if (!isOnboarded) reason = 'The provider onboarding is incomplete.';
      else if (!notOnVacation) reason = 'The provider is currently on vacation mode.';
      else if (!providerService) reason = 'The provider no longer offers this service.';
    }

    return {
      eligible: true, // Eligible to rebook (customer can proceed with this provider or rediscovery)
      reason,
      serviceId: booking.serviceId,
      serviceTitle: booking.serviceTitleSnapshot,
      providerId: booking.providerProfileId,
      providerName: provider.user.fullName || 'Provider',
      providerAvailable,
      pricingModel: (providerService?.pricingModel || booking.pricingModelSnapshot) as CatalogPricingModel,
      basePrice: providerService?.customPrice ?? booking.priceSnapshot,
      suggestedLocation: booking.locationSnapshot as Record<string, unknown>,
      previousPreferences: booking.serviceRequest.preferences as Record<string, unknown> | null,
    };
  }

  /**
   * Creates a NEW ServiceRequest and Booking linked to the historical booking via rebookedFromBookingId.
   * Preserves historical booking, financial, and payment integrity completely untouched.
   */
  static async rebookCompletedBooking(
    customerId: string,
    sourceBookingId: string,
    input: CreateRebookRequestInput
  ): Promise<BookingRecord> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    // 1. Verify eligibility
    const eligibility = await this.checkRebookEligibility(customerId, sourceBookingId);
    if (!eligibility.eligible) {
      throw new BookingValidationError(eligibility.reason || 'Source booking is not eligible for rebooking.');
    }

    if (!eligibility.providerAvailable) {
      throw new BookingValidationError(
        `Original provider is currently unavailable: ${eligibility.reason || 'Not offering service'}`
      );
    }

    // 2. Load historical booking for fallback details
    const sourceBooking = await prisma.booking.findUnique({
      where: { id: sourceBookingId },
      include: { serviceRequest: true },
    });
    if (!sourceBooking) {
      throw new BookingValidationError('Source booking not found.');
    }

    // 3. Create the new booking using BookingService with rebookedFromBookingId metadata
    const newBooking = await BookingService.createBookingRequest(customerId, {
      serviceId: sourceBooking.serviceId,
      providerProfileId: sourceBooking.providerProfileId,
      requestedDate: input.requestedDate,
      requestedStartTime: input.requestedStartTime,
      requestedDurationHours: input.requestedDurationHours || sourceBooking.durationHours,
      description: input.description || `Rebooked service for ${sourceBooking.serviceTitleSnapshot}`,
      addressId: input.addressId,
      preferences: input.preferences || (sourceBooking.serviceRequest.preferences as Record<string, unknown>) || undefined,
    });

    // 4. Update the newly created ServiceRequest to store rebookedFromBookingId reference
    await prisma.serviceRequest.update({
      where: { id: newBooking.serviceRequestId },
      data: {
        rebookedFromBookingId: sourceBooking.id,
      },
    });

    return newBooking;
  }
}
