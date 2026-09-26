import React, { useState } from 'react';
import {
  Sparkles,
  MapPin,
  Calendar,
  Send,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../ui/Card';
import { Input } from '../../ui/Input';
import { Textarea } from '../../ui/Textarea';
import { Select } from '../../ui/Select';
import { Button } from '../../ui/Button';
import { Alert } from '../../ui/Alert';
import { Badge } from '../../ui/Badge';
import { CORE_SERVICE_CATEGORIES } from '../../../constants/categories';

export interface RequestServiceFormProps {
  initialCategory?: string;
  initialProviderId?: string;
  onSubmitSuccess?: () => void;
}

export const RequestServiceForm: React.FC<RequestServiceFormProps> = ({
  initialCategory = '',
  initialProviderId,
}) => {
  const [naturalLanguageInput, setNaturalLanguageInput] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [needSummary, setNeedSummary] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('morning');
  const [duration, setDuration] = useState('1-2');
  const [location, setLocation] = useState('');
  const [preferences, setPreferences] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  const categoryOptions = [
    { value: '', label: 'Select a category...' },
    ...CORE_SERVICE_CATEGORIES.map((c) => ({ value: c.slug, label: c.name })),
  ];

  const timeOptions = [
    { value: 'morning', label: 'Morning (09:00 AM – 12:00 PM)' },
    { value: 'afternoon', label: 'Afternoon (12:00 PM – 04:00 PM)' },
    { value: 'evening', label: 'Evening (04:00 PM – 08:00 PM)' },
    { value: 'urgent', label: 'Immediate / Urgent' },
  ];

  const durationOptions = [
    { value: '1-2', label: 'Quick repair / Inspection (1–2 hours)' },
    { value: 'half-day', label: 'Half Day (3–4 hours)' },
    { value: 'full-day', label: 'Full Day (6–8 hours)' },
    { value: 'flexible', label: 'Flexible / As required' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. Natural Language Input Card */}
      <Card variant="elevated" padding="md" className="border-primary-100 bg-white">
        <CardHeader className="pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-2 text-primary-700 font-semibold text-xs mb-1">
            <Sparkles size={16} />
            <span>Smart Request Assistant</span>
          </div>
          <CardTitle>Tell us what you need</CardTitle>
          <CardDescription>
            Describe your problem or service requirement in your own words. The platform will organize your request and match local verified professionals.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          <Textarea
            rows={3}
            value={naturalLanguageInput}
            onChange={(e) => setNaturalLanguageInput(e.target.value)}
            placeholder="e.g., I have a water leakage problem under my kitchen sink and need a qualified plumber tomorrow morning around 10 AM..."
            helperText="Feel free to mention specific symptoms, appliances, or time preferences."
          />
          <div className="flex items-center gap-2 text-xs text-neutral-600">
            <Info size={14} className="text-neutral-500 shrink-0" />
            <span>AI-assisted parsing and automatic field matching will be activated in later phases.</span>
          </div>
        </CardContent>
      </Card>

      {/* 2. Structured Request Fields Card */}
      <Card variant="default" padding="md" className="bg-white">
        <CardHeader className="pb-3 border-b border-neutral-100">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Structured Request Details</CardTitle>
              <CardDescription>Verify and adjust the specific details for the service request.</CardDescription>
            </div>
            {initialProviderId && (
              <Badge variant="info" size="sm">
                Targeting Provider ID: {initialProviderId}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Service Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={categoryOptions}
              required
              helperText="Choose the primary service domain."
            />

            <Input
              label="Service Need Summary"
              placeholder="e.g. Tap repair, AC servicing, Deep clean..."
              value={needSummary}
              onChange={(e) => setNeedSummary(e.target.value)}
              required
              helperText="Brief headline for the service request."
            />

            <Input
              type="date"
              label="Preferred Date"
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
              leftIcon={<Calendar size={16} />}
              required
              helperText="When do you need the service?"
            />

            <Select
              label="Preferred Time Window"
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              options={timeOptions}
              required
            />

            <Select
              label="Estimated Duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              options={durationOptions}
              required
            />

            <Input
              label="Service Location / Area"
              placeholder="House/Flat No., Apartment, Landmark, Pincode"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              leftIcon={<MapPin size={16} />}
              required
              helperText="Local address where service is required."
            />
          </div>

          <div className="pt-2">
            <Textarea
              label="Specific Preferences or Tools Needed (Optional)"
              rows={2}
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              placeholder="e.g. Please bring special ladder, ladder not available on site, gate code..."
              helperText="Any additional instructions or safety notices for the professional."
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-neutral-100">
          <div className="flex items-center gap-2 text-xs text-neutral-600">
            <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
            <span>Verified service standards • Transparent communication</span>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            leftIcon={<Send size={16} />}
            className="w-full sm:w-auto"
          >
            Submit Service Request
          </Button>
        </CardFooter>
      </Card>

      {/* Honest Feedback Banner upon Submission */}
      {isSubmitted && (
        <Alert
          variant="success"
          title="Service Request Structure Captured"
          onClose={() => setIsSubmitted(false)}
        >
          <div className="space-y-1 mt-1 text-xs sm:text-sm">
            <p>
              Your service request framework has been validated and structured properly.
            </p>
            <p className="text-neutral-600">
              <strong>Notice:</strong> In this UI/UX foundation phase, requests are not sent to live providers. Real provider matching and booking workflows will be enabled in upcoming phases.
            </p>
          </div>
        </Alert>
      )}
    </form>
  );
};
