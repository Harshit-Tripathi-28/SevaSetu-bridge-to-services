import React, { useState } from 'react';
import { Clock } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import type { CancellationReason, CancellationPolicyInfo } from '../../types';

export interface CancellationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  serviceTitle: string;
  policy?: CancellationPolicyInfo;
  onConfirmCancellation: (reason: CancellationReason, notes?: string) => void;
  isProcessing?: boolean;
}

const CANCELLATION_REASONS: { value: CancellationReason; label: string }[] = [
  { value: 'schedule_conflict', label: 'Schedule conflict / change in plans' },
  { value: 'service_no_longer_needed', label: 'Service is no longer needed' },
  { value: 'provider_unresponsive', label: 'Provider was unreachable' },
  { value: 'booked_by_mistake', label: 'Booked by mistake' },
  { value: 'emergency', label: 'Family or home emergency' },
  { value: 'price_disagreement', label: 'Estimate or pricing disagreement' },
  { value: 'other', label: 'Other personal reason' },
];

export const CancellationDialog: React.FC<CancellationDialogProps> = ({
  isOpen,
  onClose,
  bookingId,
  serviceTitle,
  policy = {
    title: 'Standard Cancellation Terms',
    description:
      'Free cancellation is available up to 2 hours before the scheduled arrival. Any refund eligibility will be processed to the original payment source.',
    freeCancellationHours: 2,
  },
  onConfirmCancellation,
  isProcessing = false,
}) => {
  const [reason, setReason] = useState<CancellationReason>('schedule_conflict');
  const [notes, setNotes] = useState<string>('');
  const [acknowledged, setAcknowledged] = useState<boolean>(false);

  const handleConfirm = () => {
    onConfirmCancellation(reason, notes);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cancel Service Booking"
      description={`Are you sure you wish to cancel booking #${bookingId}?`}
      size="md"
    >
      <div className="space-y-5 py-1">
        {/* Booking Meta Pill */}
        <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-xs flex items-center justify-between">
          <span className="text-neutral-600">Service:</span>
          <span className="font-semibold text-neutral-900">{serviceTitle}</span>
        </div>

        {/* Cancellation Policy Disclosure */}
        <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 text-xs text-amber-900 space-y-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-amber-800">
            <Clock size={14} />
            <span>{policy.title}</span>
          </div>
          <p className="leading-relaxed text-amber-800/90">{policy.description}</p>
        </div>

        {/* Reason Selector */}
        <div className="space-y-3">
          <Select
            label="Reason for Cancellation *"
            value={reason}
            onChange={(e) => setReason(e.target.value as CancellationReason)}
            options={CANCELLATION_REASONS}
          />

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-neutral-800">
              Additional Details (Optional)
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tell us what happened so we can improve partner matching..."
              rows={2}
            />
          </div>
        </div>

        {/* Acknowledgment Checkbox */}
        <div className="flex items-start gap-2 pt-1 text-xs text-neutral-600">
          <input
            id="cancel-ack"
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            className="mt-0.5 rounded border-neutral-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
          />
          <label htmlFor="cancel-ack" className="cursor-pointer select-none">
            I understand that cancelling releases the scheduled provider slot, and any eligible refunds will be initiated per platform terms.
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-neutral-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isProcessing}
            className="w-full sm:w-auto"
          >
            Keep My Booking
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={handleConfirm}
            isLoading={isProcessing}
            disabled={!acknowledged || isProcessing}
            className="w-full sm:w-auto"
          >
            Confirm Cancellation
          </Button>
        </div>
      </div>
    </Modal>
  );
};
