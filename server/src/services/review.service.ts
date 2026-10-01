import { getPrismaClient } from '../config/database.js';
import { EventService } from './event.service.js';
import type {
  ReviewRecord,
  ReviewSubmissionInput,
  ProviderReputationSummary,
  UserRole,
} from '@sevasetu/shared';

export class ReviewValidationError extends Error {
  public code = 'VALIDATION_ERROR';
  constructor(message: string) {
    super(message);
    this.name = 'ReviewValidationError';
  }
}

export class ReviewAuthorizationError extends Error {
  public code = 'FORBIDDEN';
  constructor(message: string = 'Forbidden: You are not authorized to perform this review action.') {
    super(message);
    this.name = 'ReviewAuthorizationError';
  }
}

export class ReviewNotFoundError extends Error {
  public code = 'NOT_FOUND';
  constructor(message: string = 'Review or eligible booking not found.') {
    super(message);
    this.name = 'ReviewNotFoundError';
  }
}

export class ReviewDuplicateError extends Error {
  public code = 'DUPLICATE_REVIEW';
  constructor(message: string = 'A review has already been submitted for this booking.') {
    super(message);
    this.name = 'ReviewDuplicateError';
  }
}

export class ReviewService {
  /**
   * Submits a verified review for a completed booking.
   * Transactionally saves the review and updates provider reputation aggregates.
   */
  static async submitReview(
    customerId: string,
    bookingId: string,
    input: ReviewSubmissionInput
  ): Promise<ReviewRecord> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    // 1. Validate rating values (integer 1-5)
    this.validateRating(input.overallRating, 'overallRating', true);
    if (input.punctuality !== undefined && input.punctuality !== null) {
      this.validateRating(input.punctuality, 'punctuality', false);
    }
    if (input.workmanship !== undefined && input.workmanship !== null) {
      this.validateRating(input.workmanship, 'workmanship', false);
    }
    if (input.cleanliness !== undefined && input.cleanliness !== null) {
      this.validateRating(input.cleanliness, 'cleanliness', false);
    }
    if (input.communication !== undefined && input.communication !== null) {
      this.validateRating(input.communication, 'communication', false);
    }

    if (input.reviewText && input.reviewText.length > 2000) {
      throw new ReviewValidationError('Review text cannot exceed 2000 characters.');
    }

    // 2. Fetch booking and verify ownership & completion status
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: { select: { id: true, fullName: true } },
        service: { select: { title: true } },
        review: { select: { id: true } },
      },
    });

    if (!booking) {
      throw new ReviewNotFoundError(`Booking ${bookingId} not found.`);
    }

    if (booking.customerId !== customerId) {
      throw new ReviewAuthorizationError('Unauthorized: You can only review your own bookings.');
    }

    if (booking.status !== 'COMPLETED') {
      throw new ReviewValidationError(
        `Reviews can only be submitted for completed bookings. Current status is ${booking.status}.`
      );
    }

    if (booking.review) {
      throw new ReviewDuplicateError('A review has already been submitted for this booking.');
    }

    // 3. Transactionally create Review and re-aggregate provider reputation
    const result = await prisma.$transaction(async (tx) => {
      const newReview = await tx.review.create({
        data: {
          bookingId: booking.id,
          customerId,
          providerProfileId: booking.providerProfileId,
          overallRating: Math.round(input.overallRating),
          punctuality: input.punctuality != null ? Math.round(input.punctuality) : null,
          workmanship: input.workmanship != null ? Math.round(input.workmanship) : null,
          cleanliness: input.cleanliness != null ? Math.round(input.cleanliness) : null,
          communication: input.communication != null ? Math.round(input.communication) : null,
          reviewText: input.reviewText?.trim() || null,
        },
      });

      // Recalculate provider aggregate rating and total reviews strictly from PostgreSQL
      const aggregate = await tx.review.aggregate({
        where: { providerProfileId: booking.providerProfileId },
        _avg: { overallRating: true },
        _count: { id: true },
      });

      const avgRating = aggregate._avg.overallRating ? Number(aggregate._avg.overallRating.toFixed(2)) : 0;
      const count = aggregate._count.id;

      await tx.serviceProviderProfile.update({
        where: { id: booking.providerProfileId },
        data: {
          rating: avgRating,
          reviewCount: count,
        },
      });

      return newReview;
    });

    // 4. Trigger domain event
    await EventService.onReviewSubmitted(result, booking);

    return {
      id: result.id,
      bookingId: result.bookingId,
      customerId: result.customerId,
      providerProfileId: result.providerProfileId,
      overallRating: result.overallRating,
      punctuality: result.punctuality,
      workmanship: result.workmanship,
      cleanliness: result.cleanliness,
      communication: result.communication,
      reviewText: result.reviewText,
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
      customerName: booking.customer.fullName || 'Customer',
      serviceTitle: booking.service.title,
      bookingReferenceCode: booking.referenceCode,
    };
  }

  /**
   * Retrieves review for a specific booking.
   */
  static async getBookingReview(
    bookingId: string,
    requestingUserId: string,
    userRole?: UserRole
  ): Promise<ReviewRecord | null> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        providerProfile: { select: { userId: true } },
      },
    });

    if (!booking) {
      throw new ReviewNotFoundError(`Booking ${bookingId} not found.`);
    }

    const isCustomer = booking.customerId === requestingUserId;
    const isProvider = booking.providerProfile.userId === requestingUserId;
    const isAdmin = userRole === 'ADMIN';

    if (!isCustomer && !isProvider && !isAdmin) {
      throw new ReviewAuthorizationError('Unauthorized to view this booking review.');
    }

    const review = await prisma.review.findUnique({
      where: { bookingId },
      include: {
        customer: { select: { fullName: true } },
        booking: { select: { referenceCode: true, serviceTitleSnapshot: true } },
      },
    });

    if (!review) return null;

    return {
      id: review.id,
      bookingId: review.bookingId,
      customerId: review.customerId,
      providerProfileId: review.providerProfileId,
      overallRating: review.overallRating,
      punctuality: review.punctuality,
      workmanship: review.workmanship,
      cleanliness: review.cleanliness,
      communication: review.communication,
      reviewText: review.reviewText,
      createdAt: review.createdAt.toISOString(),
      updatedAt: review.updatedAt.toISOString(),
      customerName: review.customer.fullName || 'Customer',
      serviceTitle: review.booking.serviceTitleSnapshot,
      bookingReferenceCode: review.booking.referenceCode,
    };
  }

  /**
   * Public provider reviews API with privacy protection.
   * Customer names are sanitized (e.g. "Rituraj A." or first name).
   * Email, phone, and private addresses are NEVER exposed.
   */
  static async getPublicProviderReviews(
    providerProfileId: string,
    query?: { page?: number; limit?: number }
  ): Promise<{
    reviews: ReviewRecord[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const page = Math.max(1, query?.page || 1);
    const limit = Math.min(50, Math.max(1, query?.limit || 10));
    const skip = (page - 1) * limit;

    const [total, rows] = await Promise.all([
      prisma.review.count({ where: { providerProfileId } }),
      prisma.review.findMany({
        where: { providerProfileId },
        include: {
          customer: { select: { fullName: true } },
          booking: { select: { referenceCode: true, serviceTitleSnapshot: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const reviews: ReviewRecord[] = rows.map((r) => ({
      id: r.id,
      bookingId: r.bookingId,
      customerId: r.customerId,
      providerProfileId: r.providerProfileId,
      overallRating: r.overallRating,
      punctuality: r.punctuality,
      workmanship: r.workmanship,
      cleanliness: r.cleanliness,
      communication: r.communication,
      reviewText: r.reviewText,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      customerName: sanitizeCustomerName(r.customer.fullName),
      serviceTitle: r.booking.serviceTitleSnapshot,
      bookingReferenceCode: r.booking.referenceCode,
    }));

    return {
      reviews,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Retrieves provider reputation summary calculated strictly from real PostgreSQL reviews.
   */
  static async getProviderReputationSummary(
    providerProfileId: string
  ): Promise<ProviderReputationSummary> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const [totalReviews, aggregate, allRatings, aspectAggregates] = await Promise.all([
      prisma.review.count({ where: { providerProfileId } }),
      prisma.review.aggregate({
        where: { providerProfileId },
        _avg: { overallRating: true },
      }),
      prisma.review.findMany({
        where: { providerProfileId },
        select: { overallRating: true },
      }),
      prisma.review.aggregate({
        where: { providerProfileId },
        _avg: {
          punctuality: true,
          workmanship: true,
          cleanliness: true,
          communication: true,
        },
      }),
    ]);

    const ratingDistribution: Record<1 | 2 | 3 | 4 | 5, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    for (const r of allRatings) {
      if (r.overallRating >= 1 && r.overallRating <= 5) {
        ratingDistribution[r.overallRating as 1 | 2 | 3 | 4 | 5]++;
      }
    }

    return {
      providerProfileId,
      averageRating: aggregate._avg.overallRating ? Number(aggregate._avg.overallRating.toFixed(2)) : 0,
      totalReviews,
      ratingDistribution,
      aspectAverages: {
        punctuality: aspectAggregates._avg.punctuality
          ? Number(aspectAggregates._avg.punctuality.toFixed(2))
          : null,
        workmanship: aspectAggregates._avg.workmanship
          ? Number(aspectAggregates._avg.workmanship.toFixed(2))
          : null,
        cleanliness: aspectAggregates._avg.cleanliness
          ? Number(aspectAggregates._avg.cleanliness.toFixed(2))
          : null,
        communication: aspectAggregates._avg.communication
          ? Number(aspectAggregates._avg.communication.toFixed(2))
          : null,
      },
    };
  }

  /**
   * Authenticated provider views all reviews received.
   */
  static async getProviderReviews(
    providerUserId: string,
    query?: { page?: number; limit?: number }
  ): Promise<{
    reviews: ReviewRecord[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const providerProfile = await prisma.serviceProviderProfile.findUnique({
      where: { userId: providerUserId },
    });

    if (!providerProfile) {
      throw new ReviewNotFoundError('Provider profile not found');
    }

    return this.getPublicProviderReviews(providerProfile.id, query);
  }

  private static validateRating(value: unknown, fieldName: string, required: boolean): void {
    if (value === undefined || value === null) {
      if (required) {
        throw new ReviewValidationError(`${fieldName} is required.`);
      }
      return;
    }

    if (typeof value !== 'number' || !Number.isInteger(value)) {
      throw new ReviewValidationError(`${fieldName} must be an integer between 1 and 5.`);
    }

    if (value < 1 || value > 5) {
      throw new ReviewValidationError(`${fieldName} must be between 1 and 5.`);
    }
  }
}

/**
 * Sanitizes full name to protect customer privacy (e.g., "Rituraj Anand" -> "Rituraj A.")
 */
function sanitizeCustomerName(fullName: string | null): string {
  if (!fullName || !fullName.trim()) return 'Verified Customer';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0] || 'Customer';
  const first = parts[0];
  const lastInitial = parts[parts.length - 1]?.[0]?.toUpperCase() || '';
  return `${first} ${lastInitial}.`;
}
