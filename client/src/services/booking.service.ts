import { apiClient } from './apiClient';
import type {
  ApiResponse,
  BookingRecord,
  CreateServiceRequestInput,
  RescheduleBookingRequest,
  BookingListQuery,
  BookingListResponse,
} from '@sevasetu/shared';

export const bookingService = {
  /**
   * Create a new service request and booking.
   */
  createServiceRequest: async (input: CreateServiceRequestInput): Promise<BookingRecord> => {
    const res = await apiClient.post<ApiResponse<BookingRecord>>('/service-requests', input);
    if (!res.data) throw new Error(res.message || 'Failed to create service request');
    return res.data;
  },

  /**
   * Customer: list own bookings.
   */
  getCustomerBookings: async (query: BookingListQuery = {}): Promise<BookingListResponse> => {
    const params = new URLSearchParams();
    if (query.status) {
      if (Array.isArray(query.status)) {
        params.set('status', query.status.join(','));
      } else {
        params.set('status', query.status);
      }
    }
    if (query.page) params.set('page', String(query.page));
    if (query.limit) params.set('limit', String(query.limit));

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient.get<ApiResponse<BookingListResponse>>(`/customer/bookings${qs}`);
    return res.data || { bookings: [], total: 0, page: 1, limit: 10, totalPages: 1 };
  },

  /**
   * Customer: get single booking detail.
   */
  getCustomerBookingById: async (id: string): Promise<BookingRecord> => {
    const res = await apiClient.get<ApiResponse<BookingRecord>>(`/customer/bookings/${id}`);
    if (!res.data) throw new Error('Booking not found');
    return res.data;
  },

  /**
   * Customer: cancel booking.
   */
  cancelCustomerBooking: async (id: string, reason: string): Promise<BookingRecord> => {
    const res = await apiClient.post<ApiResponse<BookingRecord>>(`/customer/bookings/${id}/cancel`, {
      reason,
    });
    if (!res.data) throw new Error(res.message || 'Failed to cancel booking');
    return res.data;
  },

  /**
   * Customer: reschedule booking.
   */
  rescheduleCustomerBooking: async (
    id: string,
    data: RescheduleBookingRequest
  ): Promise<BookingRecord> => {
    const res = await apiClient.post<ApiResponse<BookingRecord>>(
      `/customer/bookings/${id}/reschedule`,
      data
    );
    if (!res.data) throw new Error(res.message || 'Failed to reschedule booking');
    return res.data;
  },

  /**
   * Provider: list incoming requests.
   */
  getProviderBookingRequests: async (query: BookingListQuery = {}): Promise<BookingListResponse> => {
    const params = new URLSearchParams();
    if (query.page) params.set('page', String(query.page));
    if (query.limit) params.set('limit', String(query.limit));

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient.get<ApiResponse<BookingListResponse>>(
      `/provider/bookings/requests${qs}`
    );
    return res.data || { bookings: [], total: 0, page: 1, limit: 10, totalPages: 1 };
  },

  /**
   * Provider: list assigned bookings/jobs.
   */
  getProviderBookings: async (query: BookingListQuery = {}): Promise<BookingListResponse> => {
    const params = new URLSearchParams();
    if (query.status) {
      if (Array.isArray(query.status)) {
        params.set('status', query.status.join(','));
      } else {
        params.set('status', query.status);
      }
    }
    if (query.page) params.set('page', String(query.page));
    if (query.limit) params.set('limit', String(query.limit));

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient.get<ApiResponse<BookingListResponse>>(`/provider/bookings${qs}`);
    return res.data || { bookings: [], total: 0, page: 1, limit: 10, totalPages: 1 };
  },

  /**
   * Provider: get single booking detail.
   */
  getProviderBookingById: async (id: string): Promise<BookingRecord> => {
    const res = await apiClient.get<ApiResponse<BookingRecord>>(`/provider/bookings/${id}`);
    if (!res.data) throw new Error('Booking not found');
    return res.data;
  },

  /**
   * Provider: accept booking request.
   */
  acceptBooking: async (id: string, notes?: string): Promise<BookingRecord> => {
    const res = await apiClient.post<ApiResponse<BookingRecord>>(`/provider/bookings/${id}/accept`, {
      notes,
    });
    if (!res.data) throw new Error(res.message || 'Failed to accept booking');
    return res.data;
  },

  /**
   * Provider: decline booking request.
   */
  declineBooking: async (id: string, reason: string): Promise<BookingRecord> => {
    const res = await apiClient.post<ApiResponse<BookingRecord>>(`/provider/bookings/${id}/decline`, {
      reason,
    });
    if (!res.data) throw new Error(res.message || 'Failed to decline booking');
    return res.data;
  },

  /**
   * Provider: advance service execution status.
   */
  updateExecutionStatus: async (
    id: string,
    status: 'ON_THE_WAY' | 'ARRIVED' | 'IN_PROGRESS' | 'COMPLETED',
    notes?: string
  ): Promise<BookingRecord> => {
    const res = await apiClient.post<ApiResponse<BookingRecord>>(`/provider/bookings/${id}/status`, {
      status,
      notes,
    });
    if (!res.data) throw new Error(res.message || 'Failed to update job status');
    return res.data;
  },

  /**
   * Provider: cancel active job.
   */
  cancelProviderBooking: async (id: string, reason: string): Promise<BookingRecord> => {
    const res = await apiClient.post<ApiResponse<BookingRecord>>(`/provider/bookings/${id}/cancel`, {
      reason,
    });
    if (!res.data) throw new Error(res.message || 'Failed to cancel job');
    return res.data;
  },
};
