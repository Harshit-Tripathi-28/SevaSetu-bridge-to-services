import { apiClient } from './apiClient';
import type {
  AdminDashboardMetrics,
  PlatformSettingRecord,
  VerificationRecord,
  ReviewVerificationInput,
  DisputeRecord,
  TransitionDisputeInput,
  SupportTicketRecord,
  UpdateSupportTicketInput,
  TrustSafetyCaseRecord,
  CreateTrustSafetyCaseInput,
  UpdateTrustSafetyCaseInput,
  ReportRecord,
  AuditLogRecord,
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

export class AdminService {
  // ==========================================
  // DASHBOARD METRICS
  // ==========================================
  static async getDashboardMetrics(): Promise<AdminDashboardMetrics> {
    const res = await apiClient.get<ApiResponse<AdminDashboardMetrics>>('/admin/metrics');
    return res.data;
  }

  // ==========================================
  // USER MANAGEMENT
  // ==========================================
  static async listUsers(params?: {
    page?: number;
    limit?: number;
    role?: string;
    status?: string;
    search?: string;
  }): Promise<{ users: any[]; total: number; page: number; totalPages: number }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.role) searchParams.set('role', params.role);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.search) searchParams.set('search', params.search);

    const query = searchParams.toString();
    const endpoint = `/admin/users${query ? `?${query}` : ''}`;
    const res = await apiClient.get<ApiResponse<{ users: any[]; total: number; page: number; totalPages: number }>>(endpoint);
    return res.data;
  }

  static async getUserDetail(userId: string): Promise<any> {
    const res = await apiClient.get<ApiResponse<any>>(`/admin/users/${userId}`);
    return res.data;
  }

  static async updateUserStatus(userId: string, status: string, reason?: string): Promise<any> {
    const res = await apiClient.patch<ApiResponse<any>>(`/admin/users/${userId}/status`, { status, reason });
    return res.data;
  }

  static async updateUserRole(userId: string, role: string, reason?: string): Promise<any> {
    const res = await apiClient.patch<ApiResponse<any>>(`/admin/users/${userId}/role`, { role, reason });
    return res.data;
  }

  // ==========================================
  // PROVIDER OPERATIONS
  // ==========================================
  static async listProviders(params?: {
    page?: number;
    limit?: number;
    isRestricted?: boolean;
    isVerified?: boolean;
    search?: string;
  }): Promise<{ providers: any[]; total: number; page: number; totalPages: number }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.isRestricted !== undefined) searchParams.set('isRestricted', String(params.isRestricted));
    if (params?.isVerified !== undefined) searchParams.set('isVerified', String(params.isVerified));
    if (params?.search) searchParams.set('search', params.search);

    const query = searchParams.toString();
    const endpoint = `/admin/providers${query ? `?${query}` : ''}`;
    const res = await apiClient.get<ApiResponse<{ providers: any[]; total: number; page: number; totalPages: number }>>(endpoint);
    return res.data;
  }

  static async getProviderDetail(providerId: string): Promise<any> {
    const res = await apiClient.get<ApiResponse<any>>(`/admin/providers/${providerId}`);
    return res.data;
  }

  static async restrictProvider(providerId: string, isRestricted: boolean, reason?: string): Promise<any> {
    const res = await apiClient.post<ApiResponse<any>>(`/admin/providers/${providerId}/restrict`, {
      isRestricted,
      reason,
    });
    return res.data;
  }

  // ==========================================
  // CATALOG ADMINISTRATION
  // ==========================================
  static async listCategories(): Promise<any[]> {
    const res = await apiClient.get<ApiResponse<any[]>>('/admin/categories');
    return res.data;
  }

  static async createCategory(data: { name: string; slug: string; description?: string; icon?: string }): Promise<any> {
    const res = await apiClient.post<ApiResponse<any>>('/admin/categories', data);
    return res.data;
  }

  static async listServices(params?: {
    page?: number;
    limit?: number;
    categoryId?: string;
    isActive?: boolean;
    search?: string;
  }): Promise<{ services: any[]; total: number; page: number; totalPages: number }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.categoryId) searchParams.set('categoryId', params.categoryId);
    if (params?.isActive !== undefined) searchParams.set('isActive', String(params.isActive));
    if (params?.search) searchParams.set('search', params.search);

    const query = searchParams.toString();
    const endpoint = `/admin/services${query ? `?${query}` : ''}`;
    const res = await apiClient.get<ApiResponse<{ services: any[]; total: number; page: number; totalPages: number }>>(endpoint);
    return res.data;
  }

  static async createService(data: {
    categoryId: string;
    title: string;
    slug: string;
    description?: string;
    pricingModel: string;
    basePrice: number;
  }): Promise<any> {
    const res = await apiClient.post<ApiResponse<any>>('/admin/services', data);
    return res.data;
  }

  static async updateService(serviceId: string, data: any): Promise<any> {
    const res = await apiClient.patch<ApiResponse<any>>(`/admin/services/${serviceId}`, data);
    return res.data;
  }

  static async setServiceActiveStatus(serviceId: string, isActive: boolean, reason?: string): Promise<any> {
    const res = await apiClient.patch<ApiResponse<any>>(`/admin/services/${serviceId}/status`, { isActive, reason });
    return res.data;
  }

  // ==========================================
  // BOOKINGS MONITORING & OPERATIONS
  // ==========================================
  static async listBookings(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<{ bookings: any[]; total: number; page: number; totalPages: number }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.status) searchParams.set('status', params.status);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.fromDate) searchParams.set('fromDate', params.fromDate);
    if (params?.toDate) searchParams.set('toDate', params.toDate);

    const query = searchParams.toString();
    const endpoint = `/admin/bookings${query ? `?${query}` : ''}`;
    const res = await apiClient.get<ApiResponse<{ bookings: any[]; total: number; page: number; totalPages: number }>>(endpoint);
    return res.data;
  }

  static async getBookingDetail(bookingId: string): Promise<any> {
    const res = await apiClient.get<ApiResponse<any>>(`/admin/bookings/${bookingId}`);
    return res.data;
  }

  static async operationalCancelBooking(bookingId: string, reason: string): Promise<any> {
    const res = await apiClient.post<ApiResponse<any>>(`/admin/bookings/${bookingId}/cancel`, { reason });
    return res.data;
  }

  // ==========================================
  // PAYMENTS & REFUNDS
  // ==========================================
  static async listPayments(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<{ payments: any[]; total: number; page: number; totalPages: number }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.status) searchParams.set('status', params.status);
    if (params?.search) searchParams.set('search', params.search);

    const query = searchParams.toString();
    const endpoint = `/admin/payments${query ? `?${query}` : ''}`;
    const res = await apiClient.get<ApiResponse<{ payments: any[]; total: number; page: number; totalPages: number }>>(endpoint);
    return res.data;
  }

  static async listRefunds(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<{ refunds: any[]; total: number; page: number; totalPages: number }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.status) searchParams.set('status', params.status);
    if (params?.search) searchParams.set('search', params.search);

    const query = searchParams.toString();
    const endpoint = `/admin/refunds${query ? `?${query}` : ''}`;
    const res = await apiClient.get<ApiResponse<{ refunds: any[]; total: number; page: number; totalPages: number }>>(endpoint);
    return res.data;
  }

  static async processManualRefund(paymentId: string, amountPaise: number, reason: string): Promise<any> {
    const res = await apiClient.post<ApiResponse<any>>(`/admin/payments/${paymentId}/refund`, { amountPaise, reason });
    return res.data;
  }

  // ==========================================
  // VERIFICATION WORKFLOW
  // ==========================================
  static async listVerifications(params?: {
    page?: number;
    limit?: number;
    status?: string;
    verificationType?: string;
  }): Promise<{ verifications: VerificationRecord[]; total: number; page: number; totalPages: number }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.status) searchParams.set('status', params.status);
    if (params?.verificationType) searchParams.set('verificationType', params.verificationType);

    const query = searchParams.toString();
    const endpoint = `/admin/verifications${query ? `?${query}` : ''}`;
    const res = await apiClient.get<ApiResponse<{ verifications: VerificationRecord[]; total: number; page: number; totalPages: number }>>(endpoint);
    return res.data;
  }

  static async getVerificationDetail(id: string): Promise<VerificationRecord> {
    const res = await apiClient.get<ApiResponse<VerificationRecord>>(`/admin/verifications/${id}`);
    return res.data;
  }

  static async reviewVerification(id: string, input: ReviewVerificationInput): Promise<VerificationRecord> {
    const res = await apiClient.post<ApiResponse<VerificationRecord>>(`/admin/verifications/${id}/review`, input);
    return res.data;
  }

  // ==========================================
  // REPORTS
  // ==========================================
  static async listReports(params?: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
  }): Promise<{ reports: ReportRecord[]; total: number; page: number; totalPages: number }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.status) searchParams.set('status', params.status);
    if (params?.priority) searchParams.set('priority', params.priority);

    const query = searchParams.toString();
    const endpoint = `/admin/reports${query ? `?${query}` : ''}`;
    const res = await apiClient.get<ApiResponse<{ reports: ReportRecord[]; total: number; page: number; totalPages: number }>>(endpoint);
    return res.data;
  }

  static async getReportDetail(id: string): Promise<ReportRecord> {
    const res = await apiClient.get<ApiResponse<ReportRecord>>(`/admin/reports/${id}`);
    return res.data;
  }

  static async updateReport(id: string, data: any): Promise<ReportRecord> {
    const res = await apiClient.patch<ApiResponse<ReportRecord>>(`/admin/reports/${id}`, data);
    return res.data;
  }

  // ==========================================
  // DISPUTES
  // ==========================================
  static async listDisputes(params?: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    bookingId?: string;
  }): Promise<{ disputes: DisputeRecord[]; total: number; page: number; totalPages: number }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.status) searchParams.set('status', params.status);
    if (params?.priority) searchParams.set('priority', params.priority);
    if (params?.bookingId) searchParams.set('bookingId', params.bookingId);

    const query = searchParams.toString();
    const endpoint = `/admin/disputes${query ? `?${query}` : ''}`;
    const res = await apiClient.get<ApiResponse<{ disputes: DisputeRecord[]; total: number; page: number; totalPages: number }>>(endpoint);
    return res.data;
  }

  static async getDisputeDetail(id: string): Promise<DisputeRecord> {
    const res = await apiClient.get<ApiResponse<DisputeRecord>>(`/admin/disputes/${id}`);
    return res.data;
  }

  static async transitionDispute(id: string, input: TransitionDisputeInput): Promise<DisputeRecord> {
    const res = await apiClient.post<ApiResponse<DisputeRecord>>(`/admin/disputes/${id}/transition`, input);
    return res.data;
  }

  static async assignDispute(id: string, assignedAdminId: string): Promise<DisputeRecord> {
    const res = await apiClient.post<ApiResponse<DisputeRecord>>(`/admin/disputes/${id}/assign`, { assignedAdminId });
    return res.data;
  }

  // ==========================================
  // SUPPORT TICKETS
  // ==========================================
  static async listSupportTickets(params?: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    category?: string;
  }): Promise<{ tickets: SupportTicketRecord[]; total: number; page: number; totalPages: number }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.status) searchParams.set('status', params.status);
    if (params?.priority) searchParams.set('priority', params.priority);
    if (params?.category) searchParams.set('category', params.category);

    const query = searchParams.toString();
    const endpoint = `/admin/support/tickets${query ? `?${query}` : ''}`;
    const res = await apiClient.get<ApiResponse<{ tickets: SupportTicketRecord[]; total: number; page: number; totalPages: number }>>(endpoint);
    return res.data;
  }

  static async getSupportTicketDetail(id: string): Promise<SupportTicketRecord> {
    const res = await apiClient.get<ApiResponse<SupportTicketRecord>>(`/admin/support/tickets/${id}`);
    return res.data;
  }

  static async updateSupportTicket(id: string, input: UpdateSupportTicketInput): Promise<SupportTicketRecord> {
    const res = await apiClient.patch<ApiResponse<SupportTicketRecord>>(`/admin/support/tickets/${id}`, input);
    return res.data;
  }

  // ==========================================
  // TRUST & SAFETY CASES
  // ==========================================
  static async listTrustSafetyCases(params?: {
    page?: number;
    limit?: number;
    status?: string;
    severity?: string;
    entityType?: string;
  }): Promise<{ cases: TrustSafetyCaseRecord[]; total: number; page: number; totalPages: number }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.status) searchParams.set('status', params.status);
    if (params?.severity) searchParams.set('severity', params.severity);
    if (params?.entityType) searchParams.set('entityType', params.entityType);

    const query = searchParams.toString();
    const endpoint = `/admin/trust-safety${query ? `?${query}` : ''}`;
    const res = await apiClient.get<ApiResponse<{ cases: TrustSafetyCaseRecord[]; total: number; page: number; totalPages: number }>>(endpoint);
    return res.data;
  }

  static async getTrustSafetyCaseDetail(id: string): Promise<TrustSafetyCaseRecord> {
    const res = await apiClient.get<ApiResponse<TrustSafetyCaseRecord>>(`/admin/trust-safety/${id}`);
    return res.data;
  }

  static async createTrustSafetyCase(input: CreateTrustSafetyCaseInput): Promise<TrustSafetyCaseRecord> {
    const res = await apiClient.post<ApiResponse<TrustSafetyCaseRecord>>('/admin/trust-safety', input);
    return res.data;
  }

  static async updateTrustSafetyCase(id: string, input: UpdateTrustSafetyCaseInput): Promise<TrustSafetyCaseRecord> {
    const res = await apiClient.patch<ApiResponse<TrustSafetyCaseRecord>>(`/admin/trust-safety/${id}`, input);
    return res.data;
  }

  // ==========================================
  // AUDIT LOGS
  // ==========================================
  static async listAuditLogs(params?: {
    page?: number;
    limit?: number;
    actorUserId?: string;
    entityType?: string;
    entityId?: string;
    action?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<{ logs: AuditLogRecord[]; total: number; page: number; totalPages: number }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.actorUserId) searchParams.set('actorUserId', params.actorUserId);
    if (params?.entityType) searchParams.set('entityType', params.entityType);
    if (params?.entityId) searchParams.set('entityId', params.entityId);
    if (params?.action) searchParams.set('action', params.action);
    if (params?.fromDate) searchParams.set('fromDate', params.fromDate);
    if (params?.toDate) searchParams.set('toDate', params.toDate);

    const query = searchParams.toString();
    const endpoint = `/admin/audit-logs${query ? `?${query}` : ''}`;
    const res = await apiClient.get<ApiResponse<{ logs: AuditLogRecord[]; total: number; page: number; totalPages: number }>>(endpoint);
    return res.data;
  }

  // ==========================================
  // PLATFORM SETTINGS
  // ==========================================
  static async getSettings(): Promise<PlatformSettingRecord[]> {
    const res = await apiClient.get<ApiResponse<PlatformSettingRecord[]>>('/admin/settings');
    return res.data;
  }

  static async updateSetting(key: string, value: string, description?: string): Promise<PlatformSettingRecord> {
    const res = await apiClient.put<ApiResponse<PlatformSettingRecord>>(`/admin/settings/${key}`, { value, description });
    return res.data;
  }
}
