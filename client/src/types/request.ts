export interface ServiceAddress {
  label: 'Home' | 'Work' | 'Other';
  flatNumber: string;
  streetArea: string;
  city: string;
  pincode: string;
  landmark?: string;
}

export interface ServiceRequestFormData {
  // Step 1: Service Need
  serviceNeed: string;
  category: string;

  // Step 2: Service Details
  serviceType: string;
  descriptionOfWork: string;
  taskCount: number;
  duration: string;

  // Step 3: Location
  addressMode: 'saved' | 'new';
  selectedSavedAddressId?: string;
  address: ServiceAddress;

  // Step 4: Date & Time
  scheduledDate: string;
  timeSlot: 'morning' | 'afternoon' | 'evening' | 'urgent';
  isFlexibleTiming: boolean;

  // Step 5: Preferences & Instructions
  additionalInstructions: string;
  accessInstructions: string;
  hasPets: boolean;
  parkingAvailable: boolean;
  bringTools: boolean;

  // Step 6: Review & Confirmation
  acceptedTerms: boolean;
  targetProviderId?: string;
}

export type RequestFormErrors = Partial<Record<string, string>>;

export interface RequestConfirmationData {
  referenceId: string;
  categoryName: string;
  serviceType: string;
  scheduledDate: string;
  timeSlotLabel: string;
  locationSummary: string;
  createdAt: string;
}
