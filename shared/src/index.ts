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
