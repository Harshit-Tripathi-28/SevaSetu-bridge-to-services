import { apiClient } from './apiClient';
import type {
  ParseServiceRequestResponse,
  AiServiceRequestIntent,
  RankProvidersResponse,
  AiReviewSummaryRecord,
  AiSupportResponse,
  AiHealthStatus,
  AiTelemetrySummary,
  AiRepeatServiceRecommendation,
  AiPredictiveReminder,
  PlatformSettingRecord,
} from '@sevasetu/shared';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export class AiClientService {
  /**
   * 1. NATURAL LANGUAGE SERVICE REQUEST
   */
  static async parseServiceRequest(
    text: string,
    context?: { currentDate?: string; preferredCity?: string }
  ): Promise<ParseServiceRequestResponse> {
    const res = await apiClient.post<ApiResponse<ParseServiceRequestResponse>>('/ai/service-request/parse', {
      text,
      context,
    });
    return res.data;
  }

  static async confirmServiceRequest(
    finalIntent: AiServiceRequestIntent,
    interpretationId?: string
  ): Promise<{ confirmed: boolean; intent: AiServiceRequestIntent }> {
    const res = await apiClient.post<ApiResponse<{ confirmed: boolean; intent: AiServiceRequestIntent }>>(
      '/ai/service-request/confirm',
      {
        interpretationId,
        finalIntent,
      }
    );
    return res.data;
  }

  /**
   * 2. AI-ASSISTED MATCHING & RANKING
   */
  static async rankProviders(
    providerIds: string[],
    intent?: Partial<AiServiceRequestIntent>
  ): Promise<RankProvidersResponse> {
    const res = await apiClient.post<ApiResponse<RankProvidersResponse>>('/ai/matching/rank', {
      providerIds,
      intent,
    });
    return res.data;
  }

  /**
   * 3. VERIFIED REVIEW SUMMARIES
   */
  static async getReviewSummary(providerProfileId: string): Promise<AiReviewSummaryRecord> {
    const res = await apiClient.get<ApiResponse<AiReviewSummaryRecord>>(
      `/ai/reviews/${providerProfileId}/summary`
    );
    return res.data;
  }

  /**
   * 4. SUPPORT ASSISTANT
   */
  static async askSupport(question: string, bookingId?: string): Promise<AiSupportResponse> {
    const res = await apiClient.post<ApiResponse<AiSupportResponse>>('/ai/support/ask', {
      question,
      bookingId,
    });
    return res.data;
  }

  /**
   * 5. PERSONALIZED RECOMMENDATIONS & REMINDERS
   */
  static async getRepeatServices(): Promise<AiRepeatServiceRecommendation[]> {
    const res = await apiClient.get<ApiResponse<AiRepeatServiceRecommendation[]>>(
      '/ai/recommendations/repeat-services'
    );
    return res.data;
  }

  static async getPredictiveReminders(): Promise<AiPredictiveReminder[]> {
    const res = await apiClient.get<ApiResponse<AiPredictiveReminder[]>>(
      '/ai/recommendations/predictive-reminders'
    );
    return res.data;
  }

  /**
   * 6. HEALTH
   */
  static async getHealth(): Promise<AiHealthStatus> {
    const res = await apiClient.get<ApiResponse<AiHealthStatus>>('/ai/health');
    return res.data;
  }

  /**
   * 7. ADMIN TELEMETRY & SETTINGS
   */
  static async getTelemetry(): Promise<AiTelemetrySummary> {
    const res = await apiClient.get<ApiResponse<AiTelemetrySummary>>('/admin/ai/telemetry');
    return res.data;
  }

  static async getAdminSettings(): Promise<{
    settings: PlatformSettingRecord[];
    activeProvider: string;
    isConfigured: boolean;
  }> {
    const res = await apiClient.get<ApiResponse<{
      settings: PlatformSettingRecord[];
      activeProvider: string;
      isConfigured: boolean;
    }>>('/admin/ai/settings');
    return res.data;
  }

  static async updateAdminSetting(key: string, value: unknown, description?: string): Promise<PlatformSettingRecord> {
    const res = await apiClient.patch<ApiResponse<PlatformSettingRecord>>('/admin/ai/settings', {
      key,
      value,
      description,
    });
    return res.data;
  }
}
