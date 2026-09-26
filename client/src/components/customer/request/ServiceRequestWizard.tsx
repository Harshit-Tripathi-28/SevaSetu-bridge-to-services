import React, { useState } from 'react';
import { RequestStepIndicator } from './RequestStepIndicator';
import { Step1ServiceNeed } from './Step1ServiceNeed';
import { Step2ServiceDetails } from './Step2ServiceDetails';
import { Step3Location } from './Step3Location';
import { Step4DateTime } from './Step4DateTime';
import { Step5Preferences } from './Step5Preferences';
import { Step6ReviewConfirm } from './Step6ReviewConfirm';
import { ConfirmationSuccessState } from './ConfirmationSuccessState';
import { RequestSummary } from './SummaryComponents';
import { CORE_SERVICE_CATEGORIES } from '../../../constants/categories';
import type {
  ServiceRequestFormData,
  RequestFormErrors,
  RequestConfirmationData,
} from '../../../types';

export interface ServiceRequestWizardProps {
  initialCategory?: string;
  initialProviderId?: string;
}

const DEFAULT_FORM_DATA: ServiceRequestFormData = {
  serviceNeed: '',
  category: '',
  serviceType: '',
  descriptionOfWork: '',
  taskCount: 1,
  duration: '1-2',
  addressMode: 'saved',
  selectedSavedAddressId: 'addr-home',
  address: {
    label: 'Home',
    flatNumber: 'Flat 402, Block B, Green Heights',
    streetArea: 'Sector 62, Central Enclave',
    city: 'Noida',
    pincode: '201301',
    landmark: 'Near Fortis Hospital',
  },
  scheduledDate: '',
  timeSlot: 'morning',
  isFlexibleTiming: false,
  additionalInstructions: '',
  accessInstructions: '',
  hasPets: false,
  parkingAvailable: false,
  bringTools: false,
  acceptedTerms: false,
};

export const ServiceRequestWizard: React.FC<ServiceRequestWizardProps> = ({
  initialCategory = '',
  initialProviderId,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [maxCompletedStep, setMaxCompletedStep] = useState<number>(1);
  const [errors, setErrors] = useState<RequestFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [confirmationData, setConfirmationData] = useState<RequestConfirmationData | null>(null);

  const [formData, setFormData] = useState<ServiceRequestFormData>(() => ({
    ...DEFAULT_FORM_DATA,
    category: initialCategory || '',
    targetProviderId: initialProviderId,
  }));

  // Step 1 Validation
  const validateStep1 = (): boolean => {
    const newErrors: RequestFormErrors = {};
    if (!formData.serviceNeed.trim() || formData.serviceNeed.trim().length < 10) {
      newErrors.serviceNeed = 'Please describe what you need in at least 10 characters.';
    }
    if (!formData.category) {
      newErrors.category = 'Please choose a primary service category.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step 2 Validation
  const validateStep2 = (): boolean => {
    const newErrors: RequestFormErrors = {};
    if (!formData.serviceType) {
      newErrors.serviceType = 'Please select the type/nature of service.';
    }
    if (!formData.descriptionOfWork.trim() || formData.descriptionOfWork.trim().length < 5) {
      newErrors.descriptionOfWork = 'Please provide details on the scope of work (min 5 characters).';
    }
    if (!formData.duration) {
      newErrors.duration = 'Please estimate the service duration.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step 3 Validation
  const validateStep3 = (): boolean => {
    const newErrors: RequestFormErrors = {};
    const addr = formData.address;

    if (!addr.flatNumber.trim()) {
      newErrors.flatNumber = 'Flat / house number and building details are required.';
    }
    if (!addr.streetArea.trim()) {
      newErrors.streetArea = 'Street / area name is required.';
    }
    if (!addr.city.trim()) {
      newErrors.city = 'City name is required.';
    }
    const pincodeRegex = /^[1-9][0-9]{5}$/;
    if (!addr.pincode.trim()) {
      newErrors.pincode = 'PIN Code is required.';
    } else if (!pincodeRegex.test(addr.pincode.trim())) {
      newErrors.pincode = 'Please enter a valid 6-digit Indian PIN Code.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step 4 Validation
  const validateStep4 = (): boolean => {
    const newErrors: RequestFormErrors = {};
    const today = new Date().toISOString().split('T')[0] ?? '';

    if (!formData.scheduledDate) {
      newErrors.scheduledDate = 'Please select a preferred appointment date.';
    } else if (formData.scheduledDate < today) {
      newErrors.scheduledDate = 'Appointment date cannot be in the past.';
    }
    if (!formData.timeSlot) {
      newErrors.timeSlot = 'Please select an arrival time window.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step 5 Validation (Preferences)
  const validateStep5 = (): boolean => {
    setErrors({});
    return true;
  };

  // Step 6 Validation (Review & Terms)
  const validateStep6 = (): boolean => {
    const newErrors: RequestFormErrors = {};
    if (!formData.acceptedTerms) {
      newErrors.acceptedTerms = 'You must accept the terms to submit this request.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navigation Handlers
  const handleNext = () => {
    let isValid = false;
    if (currentStep === 1) isValid = validateStep1();
    else if (currentStep === 2) isValid = validateStep2();
    else if (currentStep === 3) isValid = validateStep3();
    else if (currentStep === 4) isValid = validateStep4();
    else if (currentStep === 5) isValid = validateStep5();

    if (isValid) {
      setErrors({});
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setMaxCompletedStep((prev) => Math.max(prev, nextStep));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setErrors({});
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleEditStep = (stepNumber: number) => {
    setErrors({});
    setCurrentStep(stepNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setFormData({
      ...DEFAULT_FORM_DATA,
      category: initialCategory || '',
      targetProviderId: initialProviderId,
    });
    setErrors({});
    setCurrentStep(1);
    setMaxCompletedStep(1);
    setConfirmationData(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Final Confirmation Submit
  const handleConfirmSubmit = () => {
    if (!validateStep6()) return;

    setIsSubmitting(true);

    // Simulate structured request preparation
    setTimeout(() => {
      const categoryObj = CORE_SERVICE_CATEGORIES.find((c) => c.slug === formData.category);
      const catName = categoryObj ? categoryObj.name : formData.category;

      const timeSlotLabels: Record<string, string> = {
        morning: 'Morning (09:00 AM – 12:00 PM)',
        afternoon: 'Afternoon (12:00 PM – 04:00 PM)',
        evening: 'Evening (04:00 PM – 08:00 PM)',
        urgent: 'Immediate Dispatch',
      };

      const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const referenceId = `REQ-${dateCode}-${randomSuffix}`;

      const confirmation: RequestConfirmationData = {
        referenceId,
        categoryName: catName,
        serviceType: formData.serviceType || 'Standard Service',
        scheduledDate: formData.scheduledDate,
        timeSlotLabel: timeSlotLabels[formData.timeSlot] || formData.timeSlot,
        locationSummary: `${formData.address.flatNumber}, ${formData.address.streetArea}, ${formData.address.city} (${formData.address.pincode})`,
        createdAt: new Date().toISOString(),
      };

      setConfirmationData(confirmation);
      setIsSubmitting(false);
      setCurrentStep(7); // Show confirmation
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 400);
  };

  // Render Step 7: Confirmation State
  if (currentStep === 7 && confirmationData) {
    return (
      <ConfirmationSuccessState
        confirmation={confirmationData}
        onReset={handleReset}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Wizard Progress Indicator */}
      <RequestStepIndicator
        currentStep={currentStep}
        maxCompletedStep={maxCompletedStep}
        onStepClick={handleEditStep}
      />

      {/* Main Wizard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Step Canvas */}
        <div className={currentStep > 1 && currentStep < 6 ? 'lg:col-span-8' : 'lg:col-span-12'}>
          {currentStep === 1 && (
            <Step1ServiceNeed
              serviceNeed={formData.serviceNeed}
              onChangeNeed={(val) => {
                setFormData((prev) => ({ ...prev, serviceNeed: val }));
                if (errors.serviceNeed) setErrors((prev) => ({ ...prev, serviceNeed: undefined }));
              }}
              category={formData.category}
              onChangeCategory={(val) => {
                setFormData((prev) => ({ ...prev, category: val }));
                if (errors.category) setErrors((prev) => ({ ...prev, category: undefined }));
              }}
              errorNeed={errors.serviceNeed}
              errorCategory={errors.category}
              onContinue={handleNext}
            />
          )}

          {currentStep === 2 && (
            <Step2ServiceDetails
              serviceType={formData.serviceType}
              onChangeServiceType={(val) => {
                setFormData((prev) => ({ ...prev, serviceType: val }));
                if (errors.serviceType) setErrors((prev) => ({ ...prev, serviceType: undefined }));
              }}
              descriptionOfWork={formData.descriptionOfWork}
              onChangeDescriptionOfWork={(val) => {
                setFormData((prev) => ({ ...prev, descriptionOfWork: val }));
                if (errors.descriptionOfWork) setErrors((prev) => ({ ...prev, descriptionOfWork: undefined }));
              }}
              taskCount={formData.taskCount}
              onChangeTaskCount={(val) => setFormData((prev) => ({ ...prev, taskCount: val }))}
              duration={formData.duration}
              onChangeDuration={(val) => {
                setFormData((prev) => ({ ...prev, duration: val }));
                if (errors.duration) setErrors((prev) => ({ ...prev, duration: undefined }));
              }}
              errors={errors}
              onBack={handleBack}
              onContinue={handleNext}
            />
          )}

          {currentStep === 3 && (
            <Step3Location
              addressMode={formData.addressMode}
              onChangeAddressMode={(mode) => setFormData((prev) => ({ ...prev, addressMode: mode }))}
              selectedSavedAddressId={formData.selectedSavedAddressId}
              onSelectSavedAddress={(id, addr) => {
                setFormData((prev) => ({
                  ...prev,
                  selectedSavedAddressId: id,
                  address: addr,
                }));
                setErrors({});
              }}
              address={formData.address}
              onChangeAddressField={(field, val) => {
                setFormData((prev) => ({
                  ...prev,
                  address: { ...prev.address, [field]: val },
                }));
                if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
              }}
              errors={errors}
              onBack={handleBack}
              onContinue={handleNext}
            />
          )}

          {currentStep === 4 && (
            <Step4DateTime
              scheduledDate={formData.scheduledDate}
              onChangeScheduledDate={(val) => {
                setFormData((prev) => ({ ...prev, scheduledDate: val }));
                if (errors.scheduledDate) setErrors((prev) => ({ ...prev, scheduledDate: undefined }));
              }}
              timeSlot={formData.timeSlot}
              onChangeTimeSlot={(slot) => setFormData((prev) => ({ ...prev, timeSlot: slot }))}
              isFlexibleTiming={formData.isFlexibleTiming}
              onChangeFlexibleTiming={(flex) => setFormData((prev) => ({ ...prev, isFlexibleTiming: flex }))}
              errors={errors}
              onBack={handleBack}
              onContinue={handleNext}
            />
          )}

          {currentStep === 5 && (
            <Step5Preferences
              additionalInstructions={formData.additionalInstructions}
              onChangeAdditionalInstructions={(val) =>
                setFormData((prev) => ({ ...prev, additionalInstructions: val }))
              }
              accessInstructions={formData.accessInstructions}
              onChangeAccessInstructions={(val) =>
                setFormData((prev) => ({ ...prev, accessInstructions: val }))
              }
              hasPets={formData.hasPets}
              onChangeHasPets={(val) => setFormData((prev) => ({ ...prev, hasPets: val }))}
              parkingAvailable={formData.parkingAvailable}
              onChangeParkingAvailable={(val) =>
                setFormData((prev) => ({ ...prev, parkingAvailable: val }))
              }
              bringTools={formData.bringTools}
              onChangeBringTools={(val) => setFormData((prev) => ({ ...prev, bringTools: val }))}
              onBack={handleBack}
              onContinue={handleNext}
            />
          )}

          {currentStep === 6 && (
            <Step6ReviewConfirm
              formData={formData}
              onEditStep={handleEditStep}
              onConfirm={handleConfirmSubmit}
              onBack={handleBack}
              isSubmitting={isSubmitting}
              termsError={errors.acceptedTerms}
              onToggleTerms={(accepted) => {
                setFormData((prev) => ({ ...prev, acceptedTerms: accepted }));
                if (errors.acceptedTerms) setErrors((prev) => ({ ...prev, acceptedTerms: undefined }));
              }}
            />
          )}
        </div>

        {/* Right Column: Dynamic Desktop Summary Preview on Steps 2 to 5 */}
        {currentStep > 1 && currentStep < 6 && (
          <div className="hidden lg:block lg:col-span-4 sticky top-24">
            <RequestSummary
              formData={formData}
              onEditStep={handleEditStep}
              compact
            />
          </div>
        )}
      </div>
    </div>
  );
};
