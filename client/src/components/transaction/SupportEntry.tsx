import React, { useState } from 'react';
import {
  LifeBuoy,
  CheckCircle2,
  Mail,
  Phone,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import type { SupportTopic } from '../../types';

export interface SupportEntryProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTopic?: SupportTopic;
  bookingReference?: string;
  invoiceReference?: string;
}

const SUPPORT_TOPICS: { value: SupportTopic; label: string }[] = [
  { value: 'payment_issue', label: 'Payment Deducted / Gateway Failure' },
  { value: 'booking_issue', label: 'Booking Reschedule / Provider Delay' },
  { value: 'service_quality', label: 'Service Quality / Scope Dispute' },
  { value: 'communication', label: 'Unresponsive Provider or Contact Issue' },
  { value: 'cancellation_refund', label: 'Refund Processing Delay' },
  { value: 'safety_trust', label: 'Safety, Security or Conduct Concern' },
  { value: 'other', label: 'General Account or Platform Inquiry' },
];

export const SupportEntry: React.FC<SupportEntryProps> = ({
  isOpen,
  onClose,
  defaultTopic = 'payment_issue',
  bookingReference,
  invoiceReference,
}) => {
  const [topic, setTopic] = useState<SupportTopic>(defaultTopic);
  const [subject, setSubject] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [contactEmail, setContactEmail] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
    setSubject('');
    setDescription('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleReset}
      title="SevaSetu Support &amp; Resolution Desk"
      description="Report an issue with your transaction, booking, or service delivery."
      size="md"
    >
      {submitted ? (
        <div className="py-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 size={32} />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-bold text-neutral-900">
              Inquiry Registered
            </h4>
            <p className="text-xs text-neutral-600 max-w-sm mx-auto">
              Our support operations team will review your inquiry and follow up within 4 business hours.
            </p>
          </div>
          <div className="pt-2">
            <Button variant="primary" size="sm" onClick={handleReset}>
              Close Window
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 py-1">
          {bookingReference && (
            <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-200 text-xs flex justify-between">
              <span className="text-neutral-500">Associated Booking:</span>
              <span className="font-mono font-semibold text-neutral-900">#{bookingReference}</span>
            </div>
          )}

          {invoiceReference && (
            <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-200 text-xs flex justify-between">
              <span className="text-neutral-500">Associated Invoice:</span>
              <span className="font-mono font-semibold text-neutral-900">#{invoiceReference}</span>
            </div>
          )}

          <Select
            label="Inquiry Category *"
            value={topic}
            onChange={(e) => setTopic(e.target.value as SupportTopic)}
            options={SUPPORT_TOPICS}
          />

          <Input
            label="Subject Summary *"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Brief summary of the issue..."
            required
          />

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-neutral-800">
              Detailed Description *
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide specifics, relevant times, technician actions, or payment references..."
              rows={3}
              required
            />
          </div>

          <Input
            type="email"
            label="Follow-up Email (Optional)"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="your-email@example.com"
          />

          {/* Quick Contact Info */}
          <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-600 space-y-1">
            <span className="font-semibold text-neutral-800 block">Emergency &amp; Trust Contact</span>
            <div className="flex flex-wrap gap-4 text-[11px] pt-0.5">
              <span className="flex items-center gap-1">
                <Mail size={12} className="text-neutral-400" />
                <span>support@sevasetu.internal</span>
              </span>
              <span className="flex items-center gap-1">
                <Phone size={12} className="text-neutral-400" />
                <span>1800-SEVA-SETU (Toll-free 8AM-9PM)</span>
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" leftIcon={<LifeBuoy size={14} />}>
              Submit Request
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
