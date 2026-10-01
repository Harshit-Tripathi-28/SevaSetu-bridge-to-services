import { request } from './apiClient';
import type {
  ApiResponse,
  RebookEligibilityCheck,
  CreateRebookRequestInput,
  BookingRecord,
} from '@sevasetu/shared';

export const RebookingService = {
  /**
   * Checks rebooking eligibility and returns reusable details
   */
  async checkEligibility(bookingId: string): Promise<RebookEligibilityCheck> {
    const res = await request<ApiResponse<RebookEligibilityCheck>>(
      `/customer/bookings/${bookingId}/rebook-eligibility`
    );
    if (!res.data) throw new Error(res.message || 'Failed to check rebooking eligibility');
    return res.data;
  },

  /**
   * Submits a rebooking request from a completed booking
   */
  async rebook(bookingId: string, input: CreateRebookRequestInput): Promise<BookingRecord> {
    const res = await request<ApiResponse<BookingRecord>>(`/customer/bookings/${bookingId}/rebook`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
    if (!res.data) throw new Error(res.message || 'Failed to create rebooking');
    return res.data;
  },
};
