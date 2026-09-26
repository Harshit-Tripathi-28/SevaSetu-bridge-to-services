export type ProviderRequestStatus =
  | 'new'
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'expired'
  | 'cancelled';

export type ProviderJobStatus =
  | 'scheduled'
  | 'on_the_way'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type ProviderProfileStatus =
  | 'draft'
  | 'active'
  | 'incomplete'
  | 'under_review'
  | 'verified';

export type VerificationStatus = 'unverified' | 'pending' | 'verified';

export interface ProviderSkill {
  id: string;
  name: string;
  category: string;
  experienceLevel?: 'beginner' | 'intermediate' | 'expert';
}

export type ProviderPricingModel =
  | 'hourly'
  | 'fixed'
  | 'per_visit'
  | 'per_task'
  | 'quote';

export interface ProviderServiceItem {
  id: string;
  category: string;
  title: string;
  description: string;
  pricingModel: ProviderPricingModel;
  basePrice?: number;
  minDuration?: string;
  maxDuration?: string;
  serviceArea?: string;
  isActive: boolean;
}

export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface DaySchedule {
  day: DayOfWeek;
  dayLabel: string;
  isAvailable: boolean;
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
}

export interface AvailabilityOverride {
  date: string;
  isAvailable: boolean;
  note?: string;
}

export interface ProviderAvailabilityData {
  weeklySchedule: DaySchedule[];
  vacationMode: boolean;
  overrides?: AvailabilityOverride[];
}

export interface ProviderRequestItem {
  id: string;
  serviceTitle: string;
  category: string;
  customerSummary: string;
  requestedDate: string;
  requestedTime: string;
  duration: string;
  locationSummary: string;
  instructions?: string;
  status: ProviderRequestStatus;
  createdAt: string;
  estimatedPrice?: number;
  contactMasked?: string;
}

export interface JobTimelineStep {
  status: ProviderJobStatus;
  label: string;
  timestamp?: string;
  note?: string;
}

export interface ProviderJobItem {
  id: string;
  requestId?: string;
  serviceTitle: string;
  category: string;
  customerNameMasked?: string;
  location: string;
  scheduledDate: string;
  scheduledTime: string;
  duration: string;
  status: ProviderJobStatus;
  price?: number;
  timeline: JobTimelineStep[];
  workNotes?: string;
}

export interface ProviderEarningItem {
  id: string;
  jobId: string;
  serviceTitle: string;
  date: string;
  grossAmount: number;
  platformFee: number;
  netAmount: number;
  status: 'pending' | 'available' | 'paid';
}

export interface ProviderEarningsSummary {
  totalEarnings: number;
  pendingEarnings: number;
  availableBalance: number;
  completedJobsCount: number;
}

export interface ProviderReviewItem {
  id: string;
  customerNameMasked: string;
  rating: number;
  serviceTitle: string;
  date: string;
  comment?: string;
}

export interface ProviderProfileData {
  fullName: string;
  avatarUrl?: string;
  bio: string;
  experienceYears: number;
  serviceArea: string;
  languages: string[];
  phoneMasked?: string;
  emailMasked?: string;
  profileStatus: ProviderProfileStatus;
  visibility: 'public' | 'unlisted';
  verificationStatus: VerificationStatus;
}
