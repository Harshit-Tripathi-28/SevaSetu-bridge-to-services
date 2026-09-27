import type { BookingTransactionStatus, PaymentStatus } from './transaction';
import type { VerificationStatus } from './provider';

// ==========================================
// 1. Admin User & Provider Management Types
// ==========================================

export type AdminUserRole = 'customer' | 'provider' | 'operator' | 'admin';

export type AdminAccountStatus =
  | 'active'
  | 'inactive'
  | 'restricted'
  | 'suspended'
  | 'under_review';

export interface AdminUserItem {
  id: string;
  fullName: string;
  emailMasked: string;
  phoneMasked: string;
  role: AdminUserRole;
  status: AdminAccountStatus;
  createdAt: string;
  lastActiveAt?: string;
  bookingsCount: number;
  reportsCount: number;
  city?: string;
}

export interface AdminProviderItem {
  id: string;
  fullName: string;
  emailMasked?: string;
  phoneMasked: string;
  categoryNames: string[];
  skills: string[];
  experienceYears: number;
  verificationStatus: VerificationStatus | 'under_review' | 'rejected' | 'needs_information';
  accountStatus: AdminAccountStatus;
  averageRating: number;
  totalReviews: number;
  completedJobsCount: number;
  serviceArea: string;
  joinedAt: string;
  activeDisputesCount: number;
}

// ==========================================
// 2. Service & Category Management Types
// ==========================================

export interface AdminServiceCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  servicesCount: number;
  iconName?: string;
}

export interface AdminServiceItem {
  id: string;
  categoryId: string;
  categoryName: string;
  title: string;
  description: string;
  pricingModel: 'fixed' | 'hourly' | 'quote' | 'tiered';
  basePrice?: number;
  currency?: string;
  durationMinutes?: number;
  isActive: boolean;
  bookingsCount: number;
}

// ==========================================
// 3. Booking & Request Operations Types
// ==========================================

export interface AdminBookingItem {
  id: string;
  requestId?: string;
  serviceTitle: string;
  categoryName: string;
  customerId: string;
  customerNameMasked: string;
  providerId?: string;
  providerNameMasked?: string;
  scheduledDate: string;
  scheduledTime: string;
  locationSummary: string;
  status: BookingTransactionStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  currency: string;
  invoiceReference?: string;
  hasDispute: boolean;
  createdAt: string;
}

// ==========================================
// 4. Verification Center Types
// ==========================================

export type VerificationState =
  | 'not_submitted'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'needs_information';

export type VerificationDocType =
  | 'government_id'
  | 'trade_certification'
  | 'police_verification'
  | 'address_proof';

export interface VerificationDocument {
  id: string;
  type: VerificationDocType;
  title: string;
  fileName: string;
  fileSizeFormatted: string;
  status: 'pending' | 'verified' | 'rejected';
  submittedAt: string;
  previewUrl?: string;
}

export interface VerificationRecord {
  id: string;
  providerId: string;
  providerName: string;
  emailMasked?: string;
  phoneMasked: string;
  tradeCategory: string;
  experienceYears: number;
  serviceArea: string;
  status: VerificationState;
  submittedAt: string;
  reviewedAt?: string;
  reviewerNotes?: string;
  documents: VerificationDocument[];
}

// ==========================================
// 5. Reports & Dispute Resolution Types
// ==========================================

export type DisputeStatus =
  | 'open'
  | 'under_review'
  | 'waiting_for_info'
  | 'resolved'
  | 'closed';

export type DisputePriority = 'low' | 'medium' | 'high' | 'urgent';

export type DisputeCategory =
  | 'payment_issue'
  | 'service_quality'
  | 'cancellation_refund'
  | 'communication'
  | 'safety_trust'
  | 'property_damage'
  | 'other';

export interface DisputeCase {
  id: string;
  caseNumber: string;
  bookingId?: string;
  bookingRef?: string;
  serviceTitle?: string;
  reporterRole: 'customer' | 'provider';
  reporterNameMasked: string;
  respondentNameMasked: string;
  category: DisputeCategory;
  priority: DisputePriority;
  status: DisputeStatus;
  issueSummary: string;
  detailedDescription: string;
  amountInvolved?: number;
  createdAt: string;
  updatedAt: string;
  assignedOperator?: string;
  internalNotes?: string[];
  resolutionSummary?: string;
}

// ==========================================
// 6. Support Center Types
// ==========================================

export type SupportTicketStatus = 'open' | 'pending' | 'resolved' | 'closed';
export type SupportTicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  requesterNameMasked: string;
  requesterRole: 'customer' | 'provider' | 'general';
  contactEmailMasked?: string;
  category: string;
  subject: string;
  description: string;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  createdAt: string;
  lastUpdated: string;
  assignedAgent?: string;
  bookingReference?: string;
}

// ==========================================
// 7. Audit & Operational Activity Logs
// ==========================================

export interface AuditActor {
  id: string;
  name: string;
  role: 'operator' | 'admin' | 'system' | 'user';
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: AuditActor;
  action: string;
  entity: 'User' | 'Provider' | 'Booking' | 'Verification' | 'Dispute' | 'Service' | 'Setting';
  entityId: string;
  details: string;
  ipAddressMasked?: string;
}

// ==========================================
// 8. Trust & Safety Suspicious Accounts Types
// ==========================================

export type TrustSafetyState =
  | 'flagged'
  | 'under_review'
  | 'cleared'
  | 'restricted'
  | 'escalated';

export interface TrustSafetyCase {
  id: string;
  caseReference: string;
  entityType: 'customer' | 'provider' | 'booking';
  entityId: string;
  entityNameMasked: string;
  riskSignal: string;
  signalSeverity: 'medium' | 'high' | 'critical';
  status: TrustSafetyState;
  flaggedAt: string;
  assignedInvestigator?: string;
  investigationNotes?: string;
}

// ==========================================
// 9. Admin Action Modal & High-Impact Dialog
// ==========================================

export type AdminActionType =
  | 'approve_verification'
  | 'reject_verification'
  | 'request_verification_info'
  | 'suspend_user'
  | 'restrict_user'
  | 'reactivate_user'
  | 'suspend_provider'
  | 'restrict_provider'
  | 'resolve_dispute'
  | 'escalate_dispute'
  | 'close_ticket';

export interface AdminActionDialogConfig {
  actionType: AdminActionType;
  title: string;
  entityName: string;
  entityId: string;
  consequenceNotice: string;
  severity: 'warning' | 'destructive' | 'primary';
  requireReason: boolean;
  reasonPlaceholder?: string;
  confirmLabel: string;
}
