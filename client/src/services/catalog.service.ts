import { apiClient } from './apiClient';
import type { ServiceCategory, Service, ApiResponse } from '@sevasetu/shared';

export const catalogService = {
  async getCategories(): Promise<ServiceCategory[]> {
    const res = await apiClient.get<ApiResponse<ServiceCategory[]>>('/service-categories');
    if (!res.success || !res.data) {
      throw new Error(res.message || 'Failed to fetch categories');
    }
    return res.data;
  },

  async getCategory(idOrSlug: string): Promise<ServiceCategory> {
    const res = await apiClient.get<ApiResponse<ServiceCategory>>(`/service-categories/${idOrSlug}`);
    if (!res.success || !res.data) {
      throw new Error(res.message || 'Failed to fetch category');
    }
    return res.data;
  },

  async getServices(filter?: { categoryId?: string; categorySlug?: string }): Promise<Service[]> {
    const params = new URLSearchParams();
    if (filter?.categoryId) params.append('categoryId', filter.categoryId);
    if (filter?.categorySlug) params.append('categorySlug', filter.categorySlug);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient.get<ApiResponse<Service[]>>(`/services${qs}`);
    if (!res.success || !res.data) {
      throw new Error(res.message || 'Failed to fetch services');
    }
    return res.data;
  },

  async getService(idOrSlug: string): Promise<Service> {
    const res = await apiClient.get<ApiResponse<Service>>(`/services/${idOrSlug}`);
    if (!res.success || !res.data) {
      throw new Error(res.message || 'Failed to fetch service detail');
    }
    return res.data;
  },
};
