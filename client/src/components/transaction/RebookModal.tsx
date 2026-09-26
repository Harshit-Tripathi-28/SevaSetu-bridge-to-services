import React, { useState } from 'react';
import {
  Calendar,
  Sparkles,
  ArrowRight,
  User,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import type { RebookSummaryData } from '../../types';

export interface RebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: RebookSummaryData;
}

export const RebookModal: React.FC<RebookModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  const navigate = useNavigate();

  // Pre-fill editable fields
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [timeSlot, setTimeSlot] = useState<string>('morning');
  const [address, setAddress] = useState<string>(data.previousAddressSummary || '');
  const [additionalNotes, setAdditionalNotes] = useState<string>('');

  const handleProceedToRequest = () => {
    // Navigate to /request with state pre-filled for customer review & confirmation
    navigate('/request', {
      state: {
        rebookSource: {
          previousBookingId: data.previousBookingId,
          serviceTitle: data.serviceTitle,
          categoryName: data.categoryName,
          categorySlug: data.categorySlug,
          providerId: data.providerId,
          providerName: data.providerName,
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
            {data.providerName && (
              <div className="flex items-center gap-1.5">
                <User size={13} className="text-neutral-400" />
                <span>Preferred Provider: <strong>{data.providerName}</strong></span>
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

            <Select
              label="Preferred Time Window"
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              options={[
                { value: 'morning', label: 'Morning (09:00 AM - 12:00 PM)' },
                { value: 'afternoon', label: 'Afternoon (12:00 PM - 03:00 PM)' },
                { value: 'evening', label: 'Evening (03:00 PM - 07:00 PM)' },
                { value: 'urgent', label: 'Express / As early as possible' },
              ]}
            />
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
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-neutral-200">
          <Button variant="ghost" size="sm" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Sparkles size={14} />}
            rightIcon={<ArrowRight size={14} />}
            onClick={handleProceedToRequest}
            className="w-full sm:w-auto"
          >
            Review &amp; Place Request
          </Button>
        </div>
      </div>
    </Modal>
  );
};
