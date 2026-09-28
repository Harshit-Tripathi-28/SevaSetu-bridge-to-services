import { apiClient } from './apiClient';
import type {
  CustomerProfile,
  UpdateCustomerProfileRequest,
  Address,
  CreateAddressRequest,
  UpdateAddressRequest,
  ApiResponse,
} from '@sevasetu/shared';

export const customerService = {
  async getProfile(): Promise<CustomerProfile> {
    const res = await apiClient.get<ApiResponse<CustomerProfile>>('/profile');
    if (!res.success || !res.data) {
      throw new Error(res.message || 'Failed to fetch customer profile');
    }
    return res.data;
  },

  async updateProfile(data: UpdateCustomerProfileRequest): Promise<CustomerProfile> {
    const res = await apiClient.patch<ApiResponse<CustomerProfile>>('/profile', data);
    if (!res.success || !res.data) {
      throw new Error(res.message || 'Failed to update profile');
    }
    return res.data;
  },

  async getAddresses(): Promise<Address[]> {
    const res = await apiClient.get<ApiResponse<Address[]>>('/addresses');
    if (!res.success || !res.data) {
      throw new Error(res.message || 'Failed to fetch saved addresses');
    }
    return res.data;
  },

  async createAddress(data: CreateAddressRequest): Promise<Address> {
    const res = await apiClient.post<ApiResponse<Address>>('/addresses', data);
    if (!res.success || !res.data) {
      throw new Error(res.message || 'Failed to create address');
    }
    return res.data;
  },

  async updateAddress(id: string, data: UpdateAddressRequest): Promise<Address> {
    const res = await apiClient.patch<ApiResponse<Address>>(`/addresses/${id}`, data);
    if (!res.success || !res.data) {
      throw new Error(res.message || 'Failed to update address');
    }
    return res.data;
  },

  async setDefaultAddress(id: string): Promise<Address> {
    const res = await apiClient.patch<ApiResponse<Address>>(`/addresses/${id}/primary`, {});
    if (!res.success || !res.data) {
      throw new Error(res.message || 'Failed to set primary address');
    }
    return res.data;
  },

  async deleteAddress(id: string): Promise<void> {
    const res = await apiClient.delete<ApiResponse<void>>(`/addresses/${id}`);
    if (!res.success) {
      throw new Error(res.message || 'Failed to delete address');
    }
  },
};
