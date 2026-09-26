import type { ApiResponse, HealthStatus } from '@sevasetu/shared';
import { apiClient } from './apiClient';

/**
 * Health service fetching real runtime status from backend GET /api/health.
 */
export async function getBackendHealth(): Promise<ApiResponse<HealthStatus>> {
  return apiClient.get<ApiResponse<HealthStatus>>('/health');
}
