import { apiClient } from './apiClient';
import type {
  ProviderProfileData,
  UpdateProviderProfileRequest,
  ProviderSkillItem,
  CreateProviderSkillRequest,
  ProviderServiceRecord,
  CreateProviderServiceRequest,
  UpdateProviderServiceRequest,
  ProviderServiceAreaRecord,
  SetProviderServiceAreaRequest,
  ProviderOnboardingState,
  PublicProviderProfile,
  ApiResponse,
  ProviderSearchQuery,
  ProviderSearchResponse,
  ProviderAvailabilitySchedule,
  SetAvailabilityRequest,
  CreateOverrideRequest,
  AvailabilityCheckQuery,
  AvailabilityCheckResponse,
} from '@sevasetu/shared';

export const providerService = {
  async getProfile(): Promise<ProviderProfileData> {
    const res = await apiClient.get<ApiResponse<ProviderProfileData>>('/provider/profile');
    if (!res.success || !res.data) {
      throw new Error(res.message || 'Failed to fetch provider profile');
    }
    return res.data;
  },

  async updateProfile(data: UpdateProviderProfileRequest): Promise<ProviderProfileData> {
    const res = await apiClient.patch<ApiResponse<ProviderProfileData>>('/provider/profile', data);
    if (!res.success || !res.data) {
      throw new Error(res.message || 'Failed to update provider profile');
    }
    return res.data;
  },

  async getSkills(): Promise<ProviderSkillItem[]> {
    const res = await apiClient.get<ApiResponse<ProviderSkillItem[]>>('/provider/skills');
    if (!res.success || !res.data) {
      throw new Error(res.message || 'Failed to fetch skills');
    }
    return res.data;
  },

  async addSkill(data: CreateProviderSkillRequest): Promise<ProviderSkillItem> {
    const res = await apiClient.post<ApiResponse<ProviderSkillItem>>('/provider/skills', data);
    if (!res.success || !res.data) {
      throw new Error(res.message || 'Failed to add skill');
    }
    return res.data;
  },

  async removeSkill(id: string): Promise<void> {
    const res = await apiClient.delete<ApiResponse<void>>(`/provider/skills/${id}`);
    if (!res.success) {
      throw new Error(res.message || 'Failed to remove skill');
    }
  },

  async getServices(): Promise<ProviderServiceRecord[]> {
    const res = await apiClient.get<ApiResponse<ProviderServiceRecord[]>>('/provider/services');
    if (!res.success || !res.data) {
      throw new Error(res.message || 'Failed to fetch offered services');
    }
    return res.data;
  },

  async addService(data: CreateProviderServiceRequest): Promise<ProviderServiceRecord> {
    const res = await apiClient.post<ApiResponse<ProviderServiceRecord>>('/provider/services', data);
    if (!res.success || !res.data) {
      throw new Error(res.message || 'Failed to add offered service');
    }
    return res.data;
  },

  async updateService(id: string, data: UpdateProviderServiceRequest): Promise<ProviderServiceRecord> {
    const res = await apiClient.patch<ApiResponse<ProviderServiceRecord>>(`/provider/services/${id}`, data);
    if (!res.success || !res.data) {
      throw new Error(res.message || 'Failed to update service');
    }
    return res.data;
  },

  async removeService(id: string): Promise<void> {
    const res = await apiClient.delete<ApiResponse<void>>(`/provider/services/${id}`);
    if (!res.success) {
      throw new Error(res.message || 'Failed to remove service');
    }
  },

  async getServiceAreas(): Promise<ProviderServiceAreaRecord[]> {
    const res = await apiClient.get<ApiResponse<ProviderServiceAreaRecord[]>>('/provider/service-area');
    if (!res.success || !res.data) {
      throw new Error(res.message || 'Failed to fetch service areas');
    }
    return res.data;
  },

  async setServiceArea(data: SetProviderServiceAreaRequest): Promise<ProviderServiceAreaRecord> {
    const res = await apiClient.put<ApiResponse<ProviderServiceAreaRecord>>('/provider/service-area', data);
    if (!res.success || !res.data) {
      throw new Error(res.message || 'Failed to configure service area');
    }
    return res.data;
  },

  async getOnboardingState(): Promise<ProviderOnboardingState> {
    const res = await apiClient.get<ApiResponse<ProviderOnboardingState>>('/provider/onboarding');
    if (!res.success || !res.data) {
      throw new Error(res.message || 'Failed to fetch onboarding state');
    }
    return res.data;
  },

  async completeOnboarding(): Promise<ProviderOnboardingState> {
    const res = await apiClient.post<ApiResponse<ProviderOnboardingState>>('/provider/onboarding/complete', {});
    if (!res.success || !res.data) {
      throw new Error(res.message || 'Failed to complete onboarding');
    }
    return res.data;
  },

  async getPublicProfile(id: string): Promise<PublicProviderProfile> {
    const res = await apiClient.get<ApiResponse<PublicProviderProfile>>(`/providers/${id}`);
    if (!res.success || !res.data) {
      throw new Error(res.message || 'Provider not found or not currently available');
    }
    return res.data;
  },

  async searchProviders(params?: ProviderSearchQuery): Promise<ProviderSearchResponse> {
    const searchParams = new URLSearchParams();
    if (params) {
      if (params.keyword) searchParams.set('keyword', params.keyword);
      if (params.serviceId) searchParams.set('serviceId', params.serviceId);
      if (params.categorySlug) searchParams.set('categorySlug', params.categorySlug);
      if (params.categoryId) searchParams.set('categoryId', params.categoryId);
      if (params.city) searchParams.set('city', params.city);
      if (params.locality) searchParams.set('locality', params.locality);
      if (params.postalCode) searchParams.set('postalCode', params.postalCode);
      if (params.date) searchParams.set('date', params.date);
      if (params.startTime) searchParams.set('startTime', params.startTime);
      if (params.durationHours) searchParams.set('durationHours', String(params.durationHours));
      if (params.sortBy) searchParams.set('sortBy', params.sortBy);
      if (params.page) searchParams.set('page', String(params.page));
      if (params.limit) searchParams.set('limit', String(params.limit));
    }
    const qs = searchParams.toString();
    const url = qs ? `/providers/search?${qs}` : '/providers/search';
    const res = await apiClient.get<ApiResponse<ProviderSearchResponse>>(url);
    if (!res.success || !res.data) {
      throw new Error(res.message || 'Failed to search providers');
    }
    return res.data;
  },

  async getAvailability(): Promise<ProviderAvailabilitySchedule> {
    const res = await apiClient.get<ApiResponse<ProviderAvailabilitySchedule>>('/provider/availability');
    if (!res.success || !res.data) {
      throw new Error(res.message || 'Failed to fetch provider availability');
    }
    return res.data;
  },

  async setAvailability(data: SetAvailabilityRequest): Promise<ProviderAvailabilitySchedule> {
    const res = await apiClient.put<ApiResponse<ProviderAvailabilitySchedule>>('/provider/availability', data);
    if (!res.success || !res.data) {
      throw new Error(res.message || 'Failed to save availability schedule');
    }
    return res.data;
  },

  async createOverride(data: CreateOverrideRequest): Promise<ProviderAvailabilitySchedule> {
    const res = await apiClient.post<ApiResponse<ProviderAvailabilitySchedule>>('/provider/availability/overrides', data);
    if (!res.success || !res.data) {
      throw new Error(res.message || 'Failed to save date override');
    }
    return res.data;
  },

  async deleteOverride(id: string): Promise<void> {
    const res = await apiClient.delete<ApiResponse<void>>(`/provider/availability/overrides/${id}`);
    if (!res.success) {
      throw new Error(res.message || 'Failed to delete availability override');
    }
  },

  async checkAvailability(providerId: string, query: AvailabilityCheckQuery): Promise<AvailabilityCheckResponse> {
    const searchParams = new URLSearchParams();
    searchParams.set('date', query.date);
    if (query.startTime) searchParams.set('startTime', query.startTime);
    if (query.durationHours) searchParams.set('durationHours', String(query.durationHours));
    const res = await apiClient.get<ApiResponse<AvailabilityCheckResponse>>(
      `/providers/${providerId}/availability?${searchParams.toString()}`
    );
    if (!res.success || !res.data) {
      throw new Error(res.message || 'Failed to check availability');
    }
    return res.data;
  },
};
