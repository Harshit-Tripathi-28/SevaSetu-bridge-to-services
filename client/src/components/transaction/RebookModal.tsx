import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Sparkles,
  ArrowRight,
  User,
  Clock,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { Alert } from '../ui/Alert';
import { RebookingService } from '../../services/rebooking.service';
import type { RebookSummaryData } from '../../types';
import type { RebookEligibilityCheck, BookingRecord } from '@sevasetu/shared';

export interface RebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: RebookSummaryData;
  onRebooked?: (newBooking: BookingRecord) => void;
}

export const RebookModal: React.FC<RebookModalProps> = ({
  isOpen,
  onClose,
  data,
  onRebooked,
}) => {
  const navigate = useNavigate();

  // Pre-fill editable fields
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [timeSlot, setTimeSlot] = useState<string>('morning');
  const [scheduledTime, setScheduledTime] = useState<string>('10:00');
  const [address, setAddress] = useState<string>(data.previousAddressSummary || '');
  const [additionalNotes, setAdditionalNotes] = useState<string>('');

  const [isLoadingEligibility, setIsLoadingEligibility] = useState(false);
  const [eligibility, setEligibility] = useState<RebookEligibilityCheck | null>(null);
  const [eligibilityError, setEligibilityError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && data.previousBookingId) {
      setIsLoadingEligibility(true);
      setEligibilityError(null);
      RebookingService.checkEligibility(data.previousBookingId)
        .then((res) => {
          setEligibility(res);
          if (res.suggestedLocation) {
            const loc = res.suggestedLocation as { addressLine1?: string; landmark?: string };
            if (loc.addressLine1) {
              setAddress(loc.addressLine1 + (loc.landmark ? `, ${loc.landmark}` : ''));
            }
          }
        })
        .catch((err) => {
          setEligibilityError(err instanceof Error ? err.message : 'Failed to check eligibility');
        })
        .finally(() => {
          setIsLoadingEligibility(false);
        });
    }
  }, [isOpen, data.previousBookingId]);

  const handleTimeSlotChange = (slot: string) => {
    setTimeSlot(slot);
    if (slot === 'morning') setScheduledTime('10:00');
    else if (slot === 'afternoon') setScheduledTime('14:00');
    else if (slot === 'evening') setScheduledTime('17:00');
    else if (slot === 'urgent') setScheduledTime('09:00');
  };

  const handleDirectRebook = async () => {
    if (!scheduledDate) {
      setSubmitError('Please select a preferred date for the appointment.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const newBooking = await RebookingService.rebook(data.previousBookingId, {
        requestedDate: scheduledDate,
        requestedStartTime: scheduledTime || '10:00',
        description: additionalNotes ? `Rebooked: ${additionalNotes}` : `Rebooked service for ${data.serviceTitle}`,
      });

      if (onRebooked) {
        onRebooked(newBooking);
      }
      onClose();
      navigate(`/customer/bookings/${newBooking.id}`);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit rebooking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProceedToRequest = () => {
    navigate('/request', {
      state: {
        rebookSource: {
          previousBookingId: data.previousBookingId,
          serviceTitle: data.serviceTitle,
          categoryName: data.categoryName,
          categorySlug: data.categorySlug,
          providerId: data.providerId || eligibility?.providerId,
          providerName: data.providerName || eligibility?.providerName,
          scheduledDate,
          timeSlot,
          address,
          additionalNotes,
        },
      },
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rebook Service"
      description="Review previous service details and choose your preferred date and time for the repeat booking."
      size="lg"
    >
      <div className="space-y-5 py-1">
        {isLoadingEligibility && (
          <div className="flex items-center justify-center p-6 text-sm text-neutral-600 gap-2">
            <Loader2 size={16} className="animate-spin text-brand-600" />
            <span>Checking provider eligibility and service availability...</span>
          </div>
        )}

        {eligibilityError && (
          <Alert variant="error" title="Eligibility Check Error">
            {eligibilityError}
          </Alert>
        )}

        {eligibility && !eligibility.eligible && (
          <Alert variant="warning" title="Not Eligible for Rebooking">
            {eligibility.reason || 'This booking cannot be rebooked directly.'}
          </Alert>
        )}

        {eligibility && eligibility.eligible && !eligibility.providerAvailable && (
          <Alert variant="warning" title="Provider Unavailable">
            {eligibility.reason || 'The original provider is not currently available for direct rebooking.'}
            <div className="mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  navigate('/services');
                }}
              >
                Browse Alternative Providers
              </Button>
            </div>
          </Alert>
        )}

        {/* Previous Service & Provider Summary */}
        <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-3 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold block">
                Previous Service
              </span>
              <span className="font-bold text-sm text-neutral-900">{data.serviceTitle}</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-neutral-200 text-neutral-700 font-medium">
              {data.categoryName}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-neutral-600">
            {(data.providerName || eligibility?.providerName) && (
              <div className="flex items-center gap-1.5">
                <User size={13} className="text-neutral-400" />
                <span>
                  Preferred Provider:{' '}
                  <strong>{data.providerName || eligibility?.providerName}</strong>
                </span>
                {eligibility?.providerAvailable && (
                  <span className="inline-flex items-center text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-medium">
                    <CheckCircle2 size={10} className="mr-0.5" /> Available
                  </span>
                )}
              </div>
            )}
            {data.lastServicedDate && (
              <div className="flex items-center gap-1.5">
                <Calendar size={13} className="text-neutral-400" />
                <span>Last Serviced: {data.lastServicedDate}</span>
              </div>
            )}
          </div>
        </div>

        {submitError && (
          <Alert variant="error" title="Rebooking Failed">
            {submitError}
          </Alert>
        )}

        {/* Customization & Modification Inputs */}
        <div className="space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-700 block">
            Select New Schedule &amp; Preferences
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              type="date"
              label="Preferred Date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              helperText="Pick your preferred day for the visit"
              required
            />

            <div className="space-y-1">
              <Select
                label="Preferred Time Window"
                value={timeSlot}
                onChange={(e) => handleTimeSlotChange(e.target.value)}
                options={[
                  { value: 'morning', label: 'Morning (09:00 AM - 12:00 PM)' },
                  { value: 'afternoon', label: 'Afternoon (12:00 PM - 03:00 PM)' },
                  { value: 'evening', label: 'Evening (03:00 PM - 07:00 PM)' },
                  { value: 'urgent', label: 'Express / As early as possible' },
                ]}
              />
              <div className="flex items-center gap-2 pt-1 text-xs text-neutral-500">
                <Clock size={12} />
                <span>Approximate start time: <strong>{scheduledTime}</strong></span>
              </div>
            </div>
          </div>

          <Input
            label="Service Location Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Flat/House number, Street, Area, Landmark"
            helperText="Confirm or update the service location"
          />

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-neutral-800">
              Any special updates or notes for this visit? (Optional)
            </label>
            <Textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="e.g. Same maintenance as before, or specify new items..."
              rows={2}
            />
          </div>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-neutral-200">
          <Button variant="ghost" size="sm" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleProceedToRequest}
              disabled={isSubmitting}
            >
              Open in Request Form
            </Button>

            <Button
              variant="primary"
              size="sm"
              leftIcon={
                isSubmitting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Sparkles size={14} />
                )
              }
              rightIcon={!isSubmitting ? <ArrowRight size={14} /> : undefined}
              onClick={handleDirectRebook}
              disabled={
                isSubmitting ||
                isLoadingEligibility ||
                (eligibility !== null && (!eligibility.eligible || !eligibility.providerAvailable))
              }
              className="w-full sm:w-auto"
            >
              {isSubmitting ? 'Placing Rebook Request...' : 'Confirm & Rebook'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
