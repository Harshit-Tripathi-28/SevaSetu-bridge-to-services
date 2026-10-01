/**
 * Core shared types for SevaSetu application.
 * Contains foundational contract interfaces across client and server.
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface DatabaseHealth {
  connected: boolean;
  status: 'connected' | 'disconnected' | 'unconfigured' | 'error';
  message: string;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded';
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
  service: string;
  version: string;
  database: DatabaseHealth;
}

/**
 * Authentication & Authorization Role and Status Types
 * Single source of truth across client and server.
 */

export type UserRole = 'CUSTOMER' | 'PROVIDER' | 'ADMIN';

export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  role: UserRole;
  status: AccountStatus;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
  role?: 'CUSTOMER' | 'PROVIDER'; // Public self-registration only allows CUSTOMER or PROVIDER
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponseData {
  user: AuthUser;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

/**
 * Customer Experience & Service Domain Interfaces
 * Ready for future backend service endpoints.
 */

export type AddressLabel = 'HOME' | 'WORK' | 'OTHER';

export interface Address {
  id: string;
  userId: string;
  label: AddressLabel;
  flatNumber: string;
  streetArea: string;
  city: string;
  state: string;
  postalCode: string;
  landmark?: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAddressRequest {
  label: AddressLabel;
  flatNumber: string;
  streetArea: string;
  city: string;
  state?: string;
  postalCode: string;
  landmark?: string;
  isDefault?: boolean;
}

export interface UpdateAddressRequest {
  label?: AddressLabel;
  flatNumber?: string;
  streetArea?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  landmark?: string;
  isDefault?: boolean;
}

export interface CustomerProfile {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  role: UserRole;
  status: AccountStatus;
  createdAt: string;
  updatedAt: string;
  addressesCount?: number;
  defaultAddress?: Address | null;
}

export interface UpdateCustomerProfileRequest {
  fullName?: string;
  phone?: string;
}

export type CatalogPricingModel = 'HOURLY' | 'FIXED' | 'PER_VISIT' | 'PER_TASK' | 'QUOTE';

export type OnboardingStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export interface ProviderProfileData {
  id: string;
  userId: string;
  businessName: string | null;
  displayName?: string;
  fullName?: string;
  bio: string | null;
  experienceYears: number;
  languages: string[];
  serviceAreaSummary: string | null;
  avatarUrl: string | null;
  isPubliclyListed: boolean;
  onboardingStatus: OnboardingStatus;
  createdAt: string;
  updatedAt: string;
  user?: {
    email: string;
    phone: string | null;
    role: UserRole;
    status: AccountStatus;
  };
}

export interface UpdateProviderProfileRequest {
  businessName?: string;
  displayName?: string;
  bio?: string;
  experienceYears?: number;
  languages?: string[];
  serviceAreaSummary?: string;
  avatarUrl?: string;
  isPubliclyListed?: boolean;
}

export interface ProviderSkillItem {
  id: string;
  providerProfileId: string;
  name: string;
  category: string;
  experienceLevel?: 'beginner' | 'intermediate' | 'expert' | string;
  createdAt: string;
}

export interface CreateProviderSkillRequest {
  name: string;
  category: string;
  experienceLevel?: 'beginner' | 'intermediate' | 'expert' | string;
}

export interface ProviderServiceRecord {
  id: string;
  providerProfileId: string;
  serviceId: string;
  service?: Service;
  customTitle: string | null;
  description: string | null;
  customDescription?: string | null;
  pricingModel: CatalogPricingModel | null;
  customPrice: number | null;
  basePrice?: number | null;
  minDuration: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProviderServiceRequest {
  serviceId: string;
  customTitle?: string;
  description?: string;
  customDescription?: string;
  pricingModel?: CatalogPricingModel;
  customPrice?: number;
  basePrice?: number;
  minDuration?: string;
  isActive?: boolean;
}

export interface UpdateProviderServiceRequest {
  customTitle?: string;
  description?: string;
  customDescription?: string;
  pricingModel?: CatalogPricingModel;
  customPrice?: number;
  basePrice?: number;
  minDuration?: string;
  isActive?: boolean;
}

export interface ProviderServiceAreaRecord {
  id: string;
  providerProfileId: string;
  city: string;
  locality: string;
  state: string;
  postalCode: string;
  radiusKm: number;
  createdAt: string;
  updatedAt: string;
}

export interface SetProviderServiceAreaRequest {
  city: string;
  locality: string;
  state?: string;
  postalCode?: string;
  postalCodes?: string[];
  radiusKm?: number;
}

export interface OnboardingSectionStatus {
  id: 'profile' | 'skills' | 'services' | 'area' | string;
  title: string;
  isComplete: boolean;
  required: boolean;
  details?: string;
}

export interface ProviderOnboardingState {
  status: OnboardingStatus;
  isComplete: boolean;
  completionPercentage: number;
  sections: OnboardingSectionStatus[];
  profile: ProviderProfileData | null;
  onboardingStatus?: OnboardingStatus;
  progressPercentage?: number;
  completedSections?: string[];
  remainingSections?: string[];
}

export interface PublicProviderProfile {
  id: string;
  displayName: string;
  bio: string;
  experienceYears: number;
  languages: string[];
  avatarUrl: string | null;
  serviceAreaSummary: string | null;
  skills: (string | ProviderSkillItem)[];
  services: {
    id: string;
    title: string;
    name?: string;
    slug?: string;
    description?: string | null;
    categoryName: string;
    pricingModel: string;
    basePrice?: number | null;
  }[];
  isPubliclyListed: boolean;
  createdAt: string;
  serviceAreas?: ProviderServiceAreaRecord[];
}

/**
 * Customer Experience & Service Domain Interfaces
 * Ready for future backend service endpoints.
 */

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconName?: string | null;
  isActive: boolean;
  serviceCount?: number;
}

export type PricingModel = 'fixed' | 'hourly' | 'quote' | 'tiered' | 'HOURLY' | 'FIXED' | 'PER_VISIT' | 'PER_TASK' | 'QUOTE';

export interface Service {
  id: string;
  categoryId: string;
  category?: ServiceCategory;
  categoryName?: string;
  name?: string;
  title?: string;
  slug?: string;
  description: string;
  serviceType?: string | null;
  pricingModel: PricingModel;
  basePrice?: number | null;
  currency?: string;
  durationMinutes?: number | null;
  includedFeatures?: string[];
  isActive: boolean;
}

export interface ProviderSummary {
  id: string;
  fullName: string;
  avatarUrl?: string;
  verified: boolean;
  categoryNames: string[];
  skills: string[];
  experienceYears?: number;
  averageRating?: number;
  totalReviews?: number;
  pricingDisplay?: string;
  distanceKm?: number;
  isAvailableNow?: boolean;
}

export interface ProviderProfile extends ProviderSummary {
  bio?: string;
  serviceArea?: string;
  completedJobsCount?: number;
  languagesSpoken?: string[];
  verificationBadges?: string[];
  servicesOffered?: Service[];
}

export interface AvailabilitySummary {
  providerId: string;
  availableDates?: string[];
  nextAvailableSlot?: string;
  workingDays?: string[];
  workingHours?: {
    start: string;
    end: string;
  };
}

export type ServiceRequestStatus =
  | 'SUBMITTED'
  | 'PENDING_PROVIDER'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'draft'
  | 'submitted'
  | 'matching'
  | 'matched'
  | 'cancelled';


export interface ServiceRequestSummary {
  id: string;
  categorySlug?: string;
  serviceNeed: string;
  preferredDate?: string;
  preferredTime?: string;
  location?: string;
  durationHours?: number;
  preferences?: string;
  additionalDetails?: string;
  status: ServiceRequestStatus;
  createdAt: string;
}

export type ActivityStatus =
  | 'requested'
  | 'upcoming'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface CustomerActivityItem {
  id: string;
  serviceTitle: string;
  categoryName: string;
  providerName?: string;
  status: ActivityStatus;
  scheduledDate?: string;
  scheduledTime?: string;
  location?: string;
  pricePaid?: number;
  canRebook?: boolean;
  createdAt: string;
}

/**
 * Functional Phase 3: Real Search, Discovery, Availability & Matching Contracts
 */

export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export interface ProviderAvailabilityItem {
  id: string;
  providerProfileId: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // "09:00"
  endTime: string;   // "18:00"
  breakStart?: string | null;
  breakEnd?: string | null;
  isAvailable: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AvailabilityOverrideItem {
  id: string;
  providerProfileId: string;
  date: string; // "YYYY-MM-DD"
  startTime?: string | null;
  endTime?: string | null;
  isAvailable: boolean;
  reason?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProviderAvailabilitySchedule {
  weeklySchedule: ProviderAvailabilityItem[];
  vacationMode: boolean;
  overrides: AvailabilityOverrideItem[];
}

export interface SetDayScheduleInput {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  breakStart?: string | null;
  breakEnd?: string | null;
  isAvailable: boolean;
}

export interface SetAvailabilityRequest {
  weeklySchedule: SetDayScheduleInput[];
  vacationMode?: boolean;
}

export interface CreateOverrideRequest {
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  isAvailable: boolean;
  reason?: string | null;
}

export interface ProviderSearchQuery {
  keyword?: string;
  serviceId?: string;
  categorySlug?: string;
  categoryId?: string;
  city?: string;
  locality?: string;
  postalCode?: string;
  date?: string;
  startTime?: string;
  durationHours?: number;
  pricingModel?: CatalogPricingModel;
  sortBy?: 'recommended' | 'experience' | 'price_low' | 'price_high';
  page?: number;
  limit?: number;
}

export interface MatchReason {
  code: string;
  message: string;
}

export interface MatchedServiceInfo {
  id: string;
  serviceId: string;
  serviceTitle: string;
  categorySlug: string;
  pricingModel: CatalogPricingModel;
  price: number | null;
  customDescription?: string | null;
}

export interface ProviderSearchResultItem {
  id: string; // providerProfileId
  userId: string;
  businessName: string | null;
  displayName: string;
  bio: string | null;
  experienceYears: number;
  avatarUrl: string | null;
  serviceAreaSummary: string | null;
  serviceAreas?: Array<{
    city: string;
    locality: string;
    state: string;
    postalCode: string;
    radiusKm: number;
  }>;
  skills: Array<{
    id: string;
    name: string;
    category: string;
    experienceLevel: string;
  }>;
  offeredServices: Array<{
    id: string;
    serviceId: string;
    serviceTitle: string;
    categorySlug: string;
    pricingModel: CatalogPricingModel;
    price: number | null;
  }>;
  matchedService?: MatchedServiceInfo;
  isAvailableForSchedule?: boolean;
  matchScore: number;
  matchReasons: MatchReason[];
}

export interface ProviderSearchResponse {
  results: ProviderSearchResultItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  filtersApplied: {
    keyword?: string;
    serviceId?: string;
    categorySlug?: string;
    city?: string;
    postalCode?: string;
    date?: string;
    startTime?: string;
    durationHours?: number;
    sortBy?: string;
  };
}

export interface AvailabilityCheckQuery {
  date: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  durationHours?: number;
}

export interface AvailabilityCheckResponse {
  providerId: string;
  date: string;
  isAvailable: boolean;
  reason?: string;
  workingHours?: {
    startTime: string;
    endTime: string;
    breakStart?: string | null;
    breakEnd?: string | null;
  };
}

/**
 * Functional Phase 4: Real Booking Lifecycle Contracts
 */

export type BookingStatus =
  | 'PENDING_PROVIDER'
  | 'ACCEPTED'
  | 'SCHEDULED'
  | 'ON_THE_WAY'
  | 'ARRIVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DECLINED'
  | 'EXPIRED';

export type BookingActorType = 'CUSTOMER' | 'PROVIDER' | 'SYSTEM';

export interface BookingAddressSnapshot {
  flatNumber: string;
  streetArea: string;
  city: string;
  state?: string;
  postalCode: string;
  landmark?: string | null;
}

export interface BookingUserSnapshot {
  fullName: string | null;
  email: string;
  phone: string | null;
  businessName?: string | null;
}

export interface BookingStatusHistoryItem {
  id: string;
  bookingId: string;
  previousStatus: BookingStatus | null;
  newStatus: BookingStatus;
  actorType: BookingActorType;
  actorUserId?: string | null;
  reason?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface ServiceRequestRecord {
  id: string;
  customerId: string;
  serviceId: string;
  selectedProviderId?: string | null;
  description: string;
  requestedDate: string; // YYYY-MM-DD
  requestedStartTime: string; // HH:mm
  requestedDurationHours: number;
  addressId?: string | null;
  addressSnapshot: BookingAddressSnapshot;
  preferences?: Record<string, unknown> | null;
  status: ServiceRequestStatus;
  createdAt: string;
  updatedAt: string;
  service?: {
    id: string;
    title: string;
    slug: string;
    category?: {
      id: string;
      name: string;
      slug: string;
    };
  };
  selectedProvider?: {
    id: string;
    businessName: string | null;
    user?: {
      fullName: string | null;
      email: string;
      phone: string | null;
    };
  } | null;
}

export interface BookingRecord {
  id: string;
  referenceCode: string;
  serviceRequestId: string;
  customerId: string;
  providerProfileId: string;
  serviceId: string;
  scheduledDate: string; // YYYY-MM-DD
  scheduledStartTime: string; // HH:mm
  scheduledEndTime: string; // HH:mm
  durationHours: number;
  status: BookingStatus;
  serviceTitleSnapshot: string;
  pricingModelSnapshot: CatalogPricingModel;
  priceSnapshot: number | null;
  locationSnapshot: BookingAddressSnapshot;
  customerSnapshot: BookingUserSnapshot;
  providerSnapshot: BookingUserSnapshot;
  notes?: string | null;
  cancellationReason?: string | null;
  cancelledBy?: BookingActorType | null;
  createdAt: string;
  updatedAt: string;
  serviceRequest?: ServiceRequestRecord;
  statusHistory?: BookingStatusHistoryItem[];
  customer?: {
    id: string;
    fullName: string | null;
    email: string;
    phone: string | null;
  };
  providerProfile?: {
    id: string;
    businessName: string | null;
    avatarUrl?: string | null;
    user?: {
      fullName: string | null;
      email: string;
      phone: string | null;
    };
  };
  service?: {
    id: string;
    title: string;
    slug: string;
    category?: {
      name: string;
      slug: string;
    };
  };
}

export interface CreateServiceRequestInput {
  serviceId: string;
  providerProfileId?: string;
  description: string;
  addressId?: string;
  address?: {
    flatNumber: string;
    streetArea: string;
    city: string;
    state?: string;
    postalCode: string;
    landmark?: string;
  };
  requestedDate: string; // YYYY-MM-DD
  requestedStartTime: string; // HH:mm
  requestedDurationHours?: number;
  preferences?: {
    timeSlot?: string;
    additionalInstructions?: string;
    accessInstructions?: string;
    hasPets?: boolean;
    parkingAvailable?: boolean;
    bringTools?: boolean;
  };
}

export interface AcceptBookingRequest {
  notes?: string;
}

export interface DeclineBookingRequest {
  reason: string;
}

export interface CancelBookingRequest {
  reason: string;
}

export interface RescheduleBookingRequest {
  newDate: string; // YYYY-MM-DD
  newStartTime: string; // HH:mm
  durationHours?: number;
}

export interface UpdateExecutionStatusRequest {
  status: 'ON_THE_WAY' | 'ARRIVED' | 'IN_PROGRESS' | 'COMPLETED';
  notes?: string;
}

export interface BookingListQuery {
  status?: BookingStatus | BookingStatus[];
  page?: number;
  limit?: number;
}

export interface BookingListResponse {
  bookings: BookingRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ==========================================
// Phase 5: Real Payments, Invoices, Refunds & Provider Earnings
// ==========================================

export type PaymentStatus =
  | 'CREATED'
  | 'PENDING'
  | 'PROCESSING'
  | 'AUTHORIZED'
  | 'PAID'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUND_PENDING'
  | 'PARTIALLY_REFUNDED'
  | 'REFUNDED';

export type RefundStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type EarningStatus =
  | 'PENDING'
  | 'AVAILABLE'
  | 'DISBURSED'
  | 'CANCELLED';

export type PayoutStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'PAID'
  | 'FAILED'
  | 'CANCELLED';

/**
 * Monetary conversion & formatting utilities.
 * Ensures consistent minor-unit (paise) integer math across all layers.
 */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

export function paiseToRupees(paise: number): number {
  return paise / 100;
}

export function formatINR(paise: number): string {
  return `₹${(paise / 100).toFixed(2)}`;
}

export const ALLOWED_PAYMENT_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  CREATED: ['PENDING', 'CANCELLED', 'FAILED'],
  PENDING: ['PROCESSING', 'AUTHORIZED', 'PAID', 'CANCELLED', 'FAILED'],
  PROCESSING: ['AUTHORIZED', 'PAID', 'FAILED'],
  AUTHORIZED: ['PAID', 'FAILED', 'CANCELLED'],
  PAID: ['REFUND_PENDING', 'PARTIALLY_REFUNDED', 'REFUNDED'],
  REFUND_PENDING: ['PARTIALLY_REFUNDED', 'REFUNDED', 'PAID'],
  PARTIALLY_REFUNDED: ['REFUND_PENDING', 'REFUNDED'],
  REFUNDED: [],
  FAILED: ['PENDING'],
  CANCELLED: [],
};

export function canTransitionPaymentStatus(current: PaymentStatus, target: PaymentStatus): boolean {
  if (current === target) return true;
  const allowed = ALLOWED_PAYMENT_TRANSITIONS[current] || [];
  return allowed.includes(target);
}

export const ALLOWED_REFUND_TRANSITIONS: Record<RefundStatus, RefundStatus[]> = {
  PENDING: ['PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'],
  PROCESSING: ['COMPLETED', 'FAILED'],
  COMPLETED: [],
  FAILED: ['PENDING'],
  CANCELLED: [],
};

export function canTransitionRefundStatus(current: RefundStatus, target: RefundStatus): boolean {
  if (current === target) return true;
  const allowed = ALLOWED_REFUND_TRANSITIONS[current] || [];
  return allowed.includes(target);
}

export interface PaymentRecord {
  id: string;
  referenceCode: string;
  bookingId: string;
  customerId: string;
  providerProfileId: string;
  gatewayProvider: string;
  gatewayOrderId: string | null;
  gatewayPaymentId: string | null;
  idempotencyKey?: string | null;
  amount: number; // in paise
  baseAmount: number; // in paise
  taxAmount: number; // in paise
  platformFee: number; // in paise
  discountAmount: number; // in paise
  currency: string;
  status: PaymentStatus;
  paymentMethod: string | null;
  failureCode?: string | null;
  failureMessage?: string | null;
  paidAt?: string | null;
  createdAt: string;
  updatedAt: string;
  booking?: BookingRecord;
  invoices?: PaymentInvoiceSummary[];
  refunds?: PaymentRefundSummary[];
}

export interface PaymentInvoiceSummary {
  id: string;
  invoiceNumber: string;
  bookingId: string;
  total: number;
  paymentStatus: PaymentStatus;
  issuedAt: string;
}

export interface PaymentRefundSummary {
  id: string;
  refundReference: string;
  amount: number;
  status: RefundStatus;
  reason: string;
  createdAt: string;
}

export interface InvoiceLineItemRecord {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number; // in paise
  total: number; // in paise
}

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  bookingId: string;
  paymentId?: string | null;
  customerId: string;
  providerProfileId: string;
  serviceTitleSnapshot: string;
  serviceDate: string;
  customerSnapshot: {
    fullName: string | null;
    email: string;
    phone: string | null;
    billingAddress?: BookingAddressSnapshot;
  };
  providerSnapshot: {
    businessName: string | null;
    displayName?: string;
    phone?: string | null;
    email?: string;
    taxRegistration?: string | null;
  };
  subtotal: number; // in paise
  tax: number; // in paise
  platformFee: number; // in paise
  discount: number; // in paise
  total: number; // in paise
  currency: string;
  paymentStatus: PaymentStatus;
  paymentMethodMasked?: string | null;
  issuedAt: string;
  createdAt: string;
  lineItems?: InvoiceLineItemRecord[];
  booking?: BookingRecord;
}

export interface RefundRecord {
  id: string;
  refundReference: string;
  paymentId: string;
  bookingId: string;
  gatewayRefundId?: string | null;
  amount: number; // in paise
  currency: string;
  status: RefundStatus;
  reason: string;
  initiatedBy: BookingActorType;
  processedAt?: string | null;
  createdAt: string;
}

export interface ProviderEarningRecord {
  id: string;
  providerProfileId: string;
  bookingId: string;
  paymentId?: string | null;
  grossAmount: number; // in paise
  platformFee: number; // in paise
  taxDeduction: number; // in paise
  netEarning: number; // in paise
  currency: string;
  status: EarningStatus;
  availableAt?: string | null;
  createdAt: string;
  booking?: BookingRecord;
}

export interface ProviderPayoutRecord {
  id: string;
  payoutReference: string;
  providerProfileId: string;
  amount: number; // in paise
  currency: string;
  status: PayoutStatus;
  bankDetailsSnapshot?: Record<string, unknown> | null;
  failureReason?: string | null;
  requestedAt: string;
  processedAt?: string | null;
  createdAt: string;
}

export interface ProviderFinancialSummary {
  totalGrossEarnings: number; // in paise
  totalPlatformFees: number; // in paise
  netEarnings: number; // in paise
  availableBalance: number; // in paise
  pendingBalance: number; // in paise
  disbursedTotal: number; // in paise
  completedJobsCount: number;
}

export interface CreatePaymentOrderInput {
  bookingId: string;
  idempotencyKey?: string;
}

export interface CreatePaymentOrderResponse {
  payment: PaymentRecord;
  gatewayOrder?: {
    orderId: string;
    amount: number;
    currency: string;
    keyId?: string;
  };
}

export interface VerifyPaymentInput {
  bookingId: string;
  gatewayOrderId: string;
  gatewayPaymentId: string;
  gatewaySignature: string;
  paymentMethod?: string;
}

export interface BookingPaymentBreakdown {
  bookingId: string;
  referenceCode: string;
  serviceTitle: string;
  pricingModel: CatalogPricingModel;
  baseAmountPaise: number;
  platformFeePaise: number;
  taxPaise: number;
  discountPaise: number;
  totalPaise: number;
  currency: string;
  isPayable: boolean;
  unpayableReason?: string;
  existingPayment?: PaymentRecord | null;
}



