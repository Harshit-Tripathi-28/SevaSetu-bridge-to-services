import React from 'react';
import {
  Wrench,
  MapPin,
  Calendar,
  Clock,
  Settings,
  Edit2,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { CORE_SERVICE_CATEGORIES } from '../../../constants/categories';
import type { ServiceRequestFormData, ServiceAddress } from '../../../types';
import { cn } from '../../../lib/utils';

// ==========================================
// 1. EditSectionButton Component
// ==========================================
export interface EditSectionButtonProps {
  stepNumber: number;
  label?: string;
  onEdit: (stepNumber: number) => void;
  className?: string;
}

export const EditSectionButton: React.FC<EditSectionButtonProps> = ({
  stepNumber,
  label = 'Edit',
  onEdit,
  className,
}) => {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      leftIcon={<Edit2 size={13} />}
      onClick={() => onEdit(stepNumber)}
      className={cn('text-xs h-7 px-2.5 text-primary-700 hover:text-primary-800 font-medium', className)}
      aria-label={`Edit ${label}`}
    >
      {label}
    </Button>
  );
};

// ==========================================
// 2. ReviewSection Component
// ==========================================
export interface ReviewSectionProps {
  title: string;
  icon?: React.ReactNode;
  stepNumber?: number;
  onEdit?: (stepNumber: number) => void;
  editLabel?: string;
  children: React.ReactNode;
  className?: string;
}

export const ReviewSection: React.FC<ReviewSectionProps> = ({
  title,
  icon,
  stepNumber,
  onEdit,
  editLabel = 'Edit',
  children,
  className,
}) => {
  return (
    <div className={cn('p-4 rounded-xl border border-neutral-200 bg-neutral-50/70 space-y-2.5', className)}>
      <div className="flex items-center justify-between pb-1 border-b border-neutral-200/60">
        <div className="flex items-center gap-2 text-neutral-800 font-semibold text-xs uppercase tracking-wider">
          {icon}
          <span>{title}</span>
        </div>
        {stepNumber && onEdit && (
          <EditSectionButton
            stepNumber={stepNumber}
            label={editLabel}
            onEdit={onEdit}
          />
        )}
      </div>
      <div className="text-xs text-neutral-700 space-y-1.5">
        {children}
      </div>
    </div>
  );
};

// ==========================================
// 3. DetailSummary Component
// ==========================================
export interface DetailSummaryProps {
  category: string;
  serviceType: string;
  serviceNeed: string;
  descriptionOfWork?: string;
  taskCount?: number;
  duration?: string;
  onEdit?: (stepNumber: number) => void;
  compact?: boolean;
}

const DURATION_LABELS: Record<string, string> = {
  '1-2': '1–2 Hours (Quick Task)',
  'half-day': '3–4 Hours (Half Day)',
  'full-day': '6–8 Hours (Full Day)',
  flexible: 'Flexible / Estimated on-site',
};

export const DetailSummary: React.FC<DetailSummaryProps> = ({
  category,
  serviceType,
  serviceNeed,
  descriptionOfWork,
  taskCount,
  duration,
  onEdit,
  compact = false,
}) => {
  const categoryObj = CORE_SERVICE_CATEGORIES.find((c) => c.slug === category);
  const categoryName = categoryObj ? categoryObj.name : category || 'General Service';

  return (
    <ReviewSection
      title="Service Scope & Need"
      icon={<Wrench size={14} className="text-primary-600" />}
      stepNumber={1}
      onEdit={onEdit}
      editLabel="Edit Need"
    >
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="info" size="sm">{categoryName}</Badge>
        {serviceType && (
          <Badge variant="neutral" size="sm" className="capitalize">
            {serviceType}
          </Badge>
        )}
      </div>

      <p className={cn('font-medium text-neutral-900', compact ? 'text-xs' : 'text-sm')}>
        "{serviceNeed || 'No request description provided'}"
      </p>

      {descriptionOfWork && !compact && (
        <p className="text-neutral-600">
          <strong className="text-neutral-700">Scope:</strong> {descriptionOfWork}
        </p>
      )}

      {(taskCount !== undefined || duration) && (
        <div className="flex items-center gap-4 text-neutral-600 pt-0.5 text-xs">
          {taskCount !== undefined && (
            <span>Units: <strong className="text-neutral-900">{taskCount}</strong></span>
          )}
          {duration && (
            <span>Duration: <strong className="text-neutral-900">{DURATION_LABELS[duration] || duration}</strong></span>
          )}
        </div>
      )}
    </ReviewSection>
  );
};

// ==========================================
// 4. LocationSummary Component
// ==========================================
export interface LocationSummaryProps {
  address: ServiceAddress;
  onEdit?: (stepNumber: number) => void;
  compact?: boolean;
}

export const LocationSummary: React.FC<LocationSummaryProps> = ({
  address,
  onEdit,
  compact = false,
}) => {
  const hasAddress = address.flatNumber || address.streetArea || address.city;

  return (
    <ReviewSection
      title="Service Location"
      icon={<MapPin size={14} className="text-primary-600" />}
      stepNumber={3}
      onEdit={onEdit}
      editLabel="Edit Address"
    >
      {hasAddress ? (
        <>
          <div className="flex items-center gap-2">
            <Badge variant="neutral" size="sm">{address.label || 'Home'}</Badge>
          </div>
          <p className={cn('font-medium text-neutral-900 leading-snug', compact ? 'text-xs' : 'text-sm')}>
            {address.flatNumber ? `${address.flatNumber}, ` : ''}{address.streetArea}
          </p>
          <p className="text-neutral-600 font-mono">
            {address.city} {address.pincode ? `— ${address.pincode}` : ''}
          </p>
          {address.landmark && !compact && (
            <p className="text-neutral-600 text-xs">
              <strong className="text-neutral-700">Landmark:</strong> {address.landmark}
            </p>
          )}
        </>
      ) : (
        <p className="text-neutral-500 italic">No address selected yet</p>
      )}
    </ReviewSection>
  );
};

// ==========================================
// 5. ScheduleSummary Component
// ==========================================
export interface ScheduleSummaryProps {
  scheduledDate: string;
  timeSlot: string;
  isFlexibleTiming?: boolean;
  onEdit?: (stepNumber: number) => void;
}

const TIME_SLOT_LABELS: Record<string, string> = {
  morning: 'Morning (09:00 AM – 12:00 PM)',
  afternoon: 'Afternoon (12:00 PM – 04:00 PM)',
  evening: 'Evening (04:00 PM – 08:00 PM)',
  urgent: 'Immediate / Urgent Dispatch',
};

export const ScheduleSummary: React.FC<ScheduleSummaryProps> = ({
  scheduledDate,
  timeSlot,
  isFlexibleTiming,
  onEdit,
}) => {
  return (
    <ReviewSection
      title="Schedule & Timing"
      icon={<Calendar size={14} className="text-primary-600" />}
      stepNumber={4}
      onEdit={onEdit}
      editLabel="Edit Schedule"
    >
      <div className="flex items-center gap-3 flex-wrap">
        <span className="font-semibold text-neutral-900 text-sm">
          {scheduledDate || 'Date not selected'}
        </span>
        <span className="text-neutral-600 font-medium flex items-center gap-1 font-mono text-xs">
          <Clock size={12} className="text-neutral-400" />
          {TIME_SLOT_LABELS[timeSlot] || timeSlot || 'No slot selected'}
        </span>
      </div>
      {isFlexibleTiming && (
        <div className="pt-1">
          <Badge variant="success" size="sm" withDot>
            Flexible arrival window (+/- 2 hours)
          </Badge>
        </div>
      )}
    </ReviewSection>
  );
};

// ==========================================
// 6. PreferencesSummary Component
// ==========================================
export interface PreferencesSummaryProps {
  accessInstructions?: string;
  additionalInstructions?: string;
  parkingAvailable?: boolean;
  hasPets?: boolean;
  bringTools?: boolean;
  onEdit?: (stepNumber: number) => void;
}

export const PreferencesSummary: React.FC<PreferencesSummaryProps> = ({
  accessInstructions,
  additionalInstructions,
  parkingAvailable,
  hasPets,
  bringTools,
  onEdit,
}) => {
  const hasPreferences =
    accessInstructions ||
    additionalInstructions ||
    parkingAvailable ||
    hasPets ||
    bringTools;

  return (
    <ReviewSection
      title="Preferences & Access"
      icon={<Settings size={14} className="text-primary-600" />}
      stepNumber={5}
      onEdit={onEdit}
      editLabel="Edit Notes"
    >
      {hasPreferences ? (
        <>
          {accessInstructions && (
            <p><strong className="text-neutral-700">Access:</strong> {accessInstructions}</p>
          )}
          {additionalInstructions && (
            <p><strong className="text-neutral-700">Notes:</strong> {additionalInstructions}</p>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            {parkingAvailable && (
              <Badge variant="neutral" size="sm">Parking on site</Badge>
            )}
            {hasPets && (
              <Badge variant="neutral" size="sm">Pets on premises</Badge>
            )}
            {bringTools && (
              <Badge variant="neutral" size="sm">Bring basic consumables</Badge>
            )}
          </div>
        </>
      ) : (
        <p className="text-neutral-500 italic">No special instructions or preferences provided.</p>
      )}
    </ReviewSection>
  );
};

// ==========================================
// 7. RequestSummary (Full Combined Card)
// ==========================================
export interface RequestSummaryProps {
  formData: ServiceRequestFormData;
  onEditStep?: (stepNumber: number) => void;
  className?: string;
  compact?: boolean;
}

export const RequestSummary: React.FC<RequestSummaryProps> = ({
  formData,
  onEditStep,
  className,
  compact = false,
}) => {
  return (
    <Card variant="default" padding="md" className={cn('bg-white space-y-4', className)}>
      <CardHeader className="pb-3 border-b border-neutral-100">
        <div className="flex items-center gap-2 text-primary-700 font-semibold text-xs mb-1">
          <CheckCircle2 size={16} />
          <span>Live Request Overview</span>
        </div>
        <CardTitle className="text-base sm:text-lg">Request Summary</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3 pt-1">
        <DetailSummary
          category={formData.category}
          serviceType={formData.serviceType}
          serviceNeed={formData.serviceNeed}
          descriptionOfWork={formData.descriptionOfWork}
          taskCount={formData.taskCount}
          duration={formData.duration}
          onEdit={onEditStep}
          compact={compact}
        />

        <LocationSummary
          address={formData.address}
          onEdit={onEditStep}
          compact={compact}
        />

        <ScheduleSummary
          scheduledDate={formData.scheduledDate}
          timeSlot={formData.timeSlot}
          isFlexibleTiming={formData.isFlexibleTiming}
          onEdit={onEditStep}
        />

        {!compact && (
          <PreferencesSummary
            accessInstructions={formData.accessInstructions}
            additionalInstructions={formData.additionalInstructions}
            parkingAvailable={formData.parkingAvailable}
            hasPets={formData.hasPets}
            bringTools={formData.bringTools}
            onEdit={onEditStep}
          />
        )}
      </CardContent>
    </Card>
  );
};
