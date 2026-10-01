import React, { useState } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Alert } from '../ui/Alert';

export interface RescheduleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  serviceTitle: string;
  currentDate?: string;
  currentTime?: string;
  onConfirmReschedule: (newDate: string, newStartTime: string) => Promise<void>;
}

const TIME_OPTIONS = [
  { value: '09:00', label: '09:00 AM' },
  { value: '10:00', label: '10:00 AM' },
  { value: '11:00', label: '11:00 AM' },
  { value: '12:00', label: '12:00 PM' },
  { value: '14:00', label: '02:00 PM' },
  { value: '15:00', label: '03:00 PM' },
  { value: '16:00', label: '04:00 PM' },
  { value: '17:00', label: '05:00 PM' },
];

export const RescheduleDialog: React.FC<RescheduleDialogProps> = ({
  isOpen,
  onClose,
  bookingId,
  serviceTitle,
  currentDate,
  currentTime,
  onConfirmReschedule,
}) => {
  const today = new Date().toISOString().split('T')[0] ?? '';
  const [newDate, setNewDate] = useState<string>(currentDate || today);
  const [newTime, setNewTime] = useState<string>(currentTime?.split(' ')[0] || '10:00');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!newDate) {
      setErrorMessage('Please select a date.');
      return;
    }
    if (!newTime) {
      setErrorMessage('Please select a time slot.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await onConfirmReschedule(newDate, newTime);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Reschedule request failed';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reschedule Service Booking"
      description={`Select a new schedule slot for #${bookingId}.`}
      size="md"
    >
      <div className="space-y-5 py-1">
        {/* Service meta */}
        <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-xs flex items-center justify-between">
          <span className="text-neutral-600">Service:</span>
          <span className="font-semibold text-neutral-900">{serviceTitle}</span>
        </div>

        {errorMessage && (
          <Alert variant="error" title="Reschedule Conflict" onClose={() => setErrorMessage(null)}>
            {errorMessage}
          </Alert>
        )}

        {/* Date Selector */}
        <div className="space-y-1">
          <Input
            type="date"
            label="New Service Date *"
            min={today}
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            leftIcon={<Calendar size={16} />}
            required
          />
        </div>

        {/* Time Selector */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-neutral-800">
            New Arrival Time Slot *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TIME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setNewTime(opt.value)}
                className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-all cursor-pointer ${
                  newTime === opt.value
                    ? 'border-primary-600 bg-primary-50 text-primary-950 ring-1 ring-primary-500 font-semibold'
                    : 'border-neutral-200 bg-white hover:border-neutral-300 text-neutral-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleConfirm}
            isLoading={isSubmitting}
            leftIcon={<Clock size={14} />}
          >
            Confirm Reschedule
          </Button>
        </div>
      </div>
    </Modal>
  );
};
