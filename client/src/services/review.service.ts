import { request } from './apiClient';
import type {
  ApiResponse,
  ReviewRecord,
  ReviewSubmissionInput,
  ProviderReputationSummary,
} from '@sevasetu/shared';

export const ReviewService = {
  /**
   * Submit a verified review for a completed booking
   */
  async submitReview(bookingId: string, input: ReviewSubmissionInput): Promise<ReviewRecord> {
    const res = await request<ApiResponse<ReviewRecord>>(`/customer/bookings/${bookingId}/review`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
    if (!res.data) throw new Error(res.message || 'Failed to submit review');
    return res.data;
  },

  /**
   * Get review for a specific booking
   */
  async getBookingReview(bookingId: string): Promise<ReviewRecord | null> {
    try {
      const res = await request<ApiResponse<ReviewRecord | null>>(`/customer/bookings/${bookingId}/review`);
      return res.data ?? null;
    } catch {
      return null;
    }
  },

  /**
   * Public list of verified reviews for a provider
   */
  async getPublicProviderReviews(
    providerProfileId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ reviews: ReviewRecord[]; pagination: { total: number; page: number; limit: number; totalPages: number } }> {
    const res = await request<ApiResponse<{ reviews: ReviewRecord[]; pagination: { total: number; page: number; limit: number; totalPages: number } }>>(
      `/providers/${providerProfileId}/reviews?page=${page}&limit=${limit}`
    );
    return res.data || { reviews: [], pagination: { total: 0, page: 1, limit, totalPages: 1 } };
  },

  /**
   * Public provider reputation summary
   */
  async getProviderReputation(providerProfileId: string): Promise<ProviderReputationSummary> {
    const res = await request<ApiResponse<ProviderReputationSummary>>(`/providers/${providerProfileId}/reputation`);
    if (!res.data) throw new Error('Reputation not found');
    return res.data;
  },

  /**
   * Provider views their own reviews
   */
  async getProviderOwnReviews(
    page: number = 1,
    limit: number = 10
  ): Promise<{ reviews: ReviewRecord[]; pagination: { total: number; page: number; limit: number; totalPages: number } }> {
    const res = await request<ApiResponse<{ reviews: ReviewRecord[]; pagination: { total: number; page: number; limit: number; totalPages: number } }>>(
      `/provider/reviews?page=${page}&limit=${limit}`
    );
    return res.data || { reviews: [], pagination: { total: 0, page: 1, limit, totalPages: 1 } };
  },
};
