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

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconName?: string;
  isActive: boolean;
  serviceCount?: number;
}

export type PricingModel = 'fixed' | 'hourly' | 'quote' | 'tiered';

export interface Service {
  id: string;
  categoryId: string;
  title: string;
  description: string;
  pricingModel: PricingModel;
  basePrice?: number;
  currency?: string;
  durationMinutes?: number;
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
