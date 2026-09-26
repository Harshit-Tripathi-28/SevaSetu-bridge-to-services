import type { PricingModel } from '@sevasetu/shared';
import type { ProviderPricingModel } from './provider';

// ==========================================
// 1. Transaction & Payment Status Types
// ==========================================

export type BookingTransactionStatus =
  | 'requested'
  | 'pending'
  | 'confirmed'
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'disputed';

export type PaymentStatus =
  | 'pending'
  | 'authorized'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'partially_refunded';

export type PaymentFlowState =
  | 'ready'
  | 'processing'
  | 'success'
  | 'failed'
  | 'retry'
  | 'cancelled';

// ==========================================
// 2. Price Breakdown & Quotation Data
// ==========================================

export interface PriceBreakdownItem {
  id: string;
  label: string;
  amount: number;
  description?: string;
  isDeduction?: boolean;
}

export interface PriceTaxItem {
  label: string;
  ratePercent?: number;
  amount: number;
}

export interface PriceDiscountItem {
  code: string;
  label: string;
  amount: number;
}

export interface PriceBreakdownData {
  baseAmount: number;
  currency?: string;
  pricingModel: PricingModel | ProviderPricingModel;
  quantityOrDuration?: string;
  additionalFees?: PriceBreakdownItem[];
  taxes?: PriceTaxItem[];
  discounts?: PriceDiscountItem[];
  totalAmount: number;
}

// ==========================================
// 3. Payment Method & Summary
// ==========================================

export type PaymentMethodType =
  | 'upi'
  | 'card'
  | 'netbanking'
  | 'wallet'
  | 'cash_after_service';

export interface PaymentMethodOption {
  id: string;
  type: PaymentMethodType;
  title: string;
  subtitle: string;
  iconName?: string;
  isAvailable: boolean;
  notes?: string;
}

export interface PaymentSummaryData {
  bookingId: string;
  serviceTitle: string;
  categoryName: string;
  provider?: {
    id: string;
    fullName: string;
    avatarUrl?: string;
    verified: boolean;
    phoneMasked?: string;
  };
  scheduledDate: string;
  scheduledTimeSlot: string;
  serviceAddress: string;
  pricing: PriceBreakdownData;
  paymentStatus: PaymentStatus;
  paymentTerms?: string[];
}

export interface PaymentResultData {
  transactionReference?: string;
  invoiceReference?: string;
  amountPaid?: number;
  currency?: string;
  serviceTitle?: string;
  paidAt?: string;
  paymentMethod?: string;
  errorMessage?: string;
  canRetry?: boolean;
}

// ==========================================
// 4. Invoice Types
// ==========================================

export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'void' | 'refunded';

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoicePartyInfo {
  nameMasked: string;
  tradeOrRole?: string;
  phoneMasked?: string;
  emailMasked?: string;
  addressSummary?: string;
  taxRegistrationMasked?: string;
}

export interface InvoiceData {
  invoiceNumber: string;
  bookingReference?: string;
  serviceTitle: string;
  categoryName: string;
  issueDate: string;
  serviceDate: string;
  customerInfo: InvoicePartyInfo;
  providerInfo: InvoicePartyInfo;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  platformFees?: number;
  taxes?: number;
  discount?: number;
  total: number;
  currency?: string;
  paymentStatus: PaymentStatus;
  paymentMethodMasked?: string;
  paidAt?: string;
  notes?: string;
}

// ==========================================
// 5. Customer Review & Ratings Types
// ==========================================

export interface ServiceAspectRatings {
  punctuality?: number;
  quality?: number;
  cleanliness?: number;
  communication?: number;
}

export interface ReviewSubmissionData {
  bookingId: string;
  providerId: string;
  serviceTitle: string;
  rating: number;
  comment: string;
  aspects?: ServiceAspectRatings;
  isAnonymous?: boolean;
}

export interface ReviewItem {
  id: string;
  bookingId?: string;
  serviceTitle: string;
  customerNameMasked: string;
  providerNameMasked?: string;
  rating: number;
  comment?: string;
  aspects?: ServiceAspectRatings;
  createdAt: string;
  verifiedBooking: boolean;
  providerResponse?: {
    comment: string;
    respondedAt: string;
  };
}

// ==========================================
// 6. Rebooking Types
// ==========================================

export interface RebookSummaryData {
  previousBookingId: string;
  serviceId?: string;
  serviceTitle: string;
  categoryName: string;
  categorySlug?: string;
  providerId?: string;
  providerName?: string;
  previousAddressSummary: string;
  previousPricingModel?: string;
  lastServicedDate?: string;
}

// ==========================================
// 7. Customer ↔ Provider Messaging Types
// ==========================================

export type MessageStatus =
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed';

export interface MessageAttachment {
  name: string;
  url?: string;
  type: 'image' | 'document';
  sizeFormatted?: string;
}

export interface MessageItem {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: 'customer' | 'provider' | 'system';
  senderName: string;
  content: string;
  timestamp: string;
  status: MessageStatus;
  attachment?: MessageAttachment;
}

export interface ConversationContextData {
  bookingId?: string;
  serviceTitle: string;
  scheduledDate?: string;
  statusLabel?: string;
  locationSummary?: string;
}

export interface ConversationSummary {
  id: string;
  otherPartyId: string;
  otherPartyName: string;
  otherPartyRole: 'customer' | 'provider';
  otherPartyAvatar?: string;
  serviceTitle: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  bookingReference?: string;
  bookingStatus?: BookingTransactionStatus;
  isOnline?: boolean;
}

// ==========================================
// 8. Notification Center & Preferences Types
// ==========================================

export type NotificationCategory =
  | 'request_update'
  | 'booking_update'
  | 'schedule_change'
  | 'service_status'
  | 'payment_update'
  | 'review_reminder'
  | 'system';

export interface NotificationItem {
  id: string;
  category: NotificationCategory;
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
  referenceId?: string;
}

export interface NotificationPreferenceItem {
  key: string;
  label: string;
  description: string;
  inApp: boolean;
  email: boolean;
  sms: boolean;
  push: boolean;
}

// ==========================================
// 9. Cancellation & Refund Types
// ==========================================

export type CancellationReason =
  | 'schedule_conflict'
  | 'service_no_longer_needed'
  | 'provider_unresponsive'
  | 'booked_by_mistake'
  | 'emergency'
  | 'price_disagreement'
  | 'other';

export interface CancellationPolicyInfo {
  title: string;
  description: string;
  freeCancellationHours?: number;
  feePercentageAfterWindow?: number;
}

export type RefundStatus =
  | 'pending'
  | 'approved'
  | 'processed'
  | 'rejected'
  | 'not_applicable';

export interface RefundSummary {
  bookingId: string;
  refundAmount: number;
  currency: string;
  status: RefundStatus;
  requestedAt: string;
  settledAt?: string;
  reasonText?: string;
  originalTransactionRef?: string;
}

// ==========================================
// 10. Support Entry Types
// ==========================================

export type SupportTopic =
  | 'payment_issue'
  | 'booking_issue'
  | 'service_quality'
  | 'communication'
  | 'cancellation_refund'
  | 'safety_trust'
  | 'other';

export interface SupportInquiryData {
  topic: SupportTopic;
  bookingReference?: string;
  invoiceReference?: string;
  subject: string;
  description: string;
  contactEmail?: string;
  contactPhone?: string;
}
