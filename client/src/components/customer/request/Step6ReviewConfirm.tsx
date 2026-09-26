import React from 'react';
import {
  ArrowLeft,
  CheckCircle,
  ShieldCheck,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Checkbox } from '../../ui/Checkbox';
import {
  DetailSummary,
  LocationSummary,
  ScheduleSummary,
  PreferencesSummary,
} from './SummaryComponents';
import type { ServiceRequestFormData } from '../../../types';

export interface Step6ReviewConfirmProps {
  formData: ServiceRequestFormData;
  onEditStep: (stepNumber: number) => void;
  onConfirm: () => void;
  onBack: () => void;
  isSubmitting?: boolean;
  termsError?: string;
  onToggleTerms: (accepted: boolean) => void;
}

export const Step6ReviewConfirm: React.FC<Step6ReviewConfirmProps> = ({
  formData,
  onEditStep,
  onConfirm,
  onBack,
  isSubmitting = false,
  termsError,
  onToggleTerms,
}) => {
  return (
    <div className="space-y-6">
      {/* Review Card */}
      <Card variant="default" padding="md" className="bg-white">
        <CardHeader className="pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-2 text-primary-700 font-semibold text-xs mb-1">
            <CheckCircle size={16} />
            <span>Step 6: Review &amp; Confirmation</span>
          </div>
          <CardTitle>Review your service request</CardTitle>
          <CardDescription>
            Please verify all entered parameters below before submitting the request to our matching system.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          {/* 1. Service Need & Details Section */}
          <DetailSummary
            category={formData.category}
            serviceType={formData.serviceType}
            serviceNeed={formData.serviceNeed}
            descriptionOfWork={formData.descriptionOfWork}
            taskCount={formData.taskCount}
            duration={formData.duration}
            onEdit={onEditStep}
          />

          {/* 2. Service Location Section */}
          <LocationSummary
            address={formData.address}
            onEdit={onEditStep}
          />

          {/* 3. Schedule Section */}
          <ScheduleSummary
            scheduledDate={formData.scheduledDate}
            timeSlot={formData.timeSlot}
            isFlexibleTiming={formData.isFlexibleTiming}
            onEdit={onEditStep}
          />

          {/* 4. Preferences Section */}
          <PreferencesSummary
            accessInstructions={formData.accessInstructions}
            additionalInstructions={formData.additionalInstructions}
            parkingAvailable={formData.parkingAvailable}
            hasPets={formData.hasPets}
            bringTools={formData.bringTools}
            onEdit={onEditStep}
          />

          {/* Confirmation Terms & Disclaimers */}
          <div className="pt-2 space-y-3">
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-neutral-50 border border-neutral-200 text-xs text-neutral-600">
              <ShieldCheck size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                By submitting, your structured service requirements will be registered for matching. You will review and approve the final estimate and assigned professional prior to dispatch.
              </p>
            </div>

            <div className="pt-1">
              <Checkbox
                label="I confirm the details above are accurate and accept SevaSetu service terms"
                checked={formData.acceptedTerms}
                onChange={(e) => onToggleTerms(e.target.checked)}
                error={termsError}
                required
              />
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-4 border-t border-neutral-100 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="md"
            leftIcon={<ArrowLeft size={16} />}
            onClick={onBack}
            disabled={isSubmitting}
          >
            Back
          </Button>

          <Button
            type="button"
            variant="primary"
            size="md"
            rightIcon={<CheckCircle size={16} />}
            onClick={onConfirm}
            isLoading={isSubmitting}
          >
            Confirm &amp; Log Request
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
