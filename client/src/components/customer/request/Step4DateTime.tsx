import React from 'react';
import { ArrowLeft, ArrowRight, Calendar, Clock, Info, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../ui/Card';
import { Input } from '../../ui/Input';
import { Checkbox } from '../../ui/Checkbox';
import { Button } from '../../ui/Button';
import { cn } from '../../../lib/utils';
import type { RequestFormErrors } from '../../../types';

export interface Step4DateTimeProps {
  scheduledDate: string;
  onChangeScheduledDate: (value: string) => void;
  timeSlot: 'morning' | 'afternoon' | 'evening' | 'urgent';
  onChangeTimeSlot: (slot: 'morning' | 'afternoon' | 'evening' | 'urgent') => void;
  isFlexibleTiming: boolean;
  onChangeFlexibleTiming: (flexible: boolean) => void;
  errors: RequestFormErrors;
  onBack: () => void;
  onContinue: () => void;
}

export const Step4DateTime: React.FC<Step4DateTimeProps> = ({
  scheduledDate,
  onChangeScheduledDate,
  timeSlot,
  onChangeTimeSlot,
  isFlexibleTiming,
  onChangeFlexibleTiming,
  errors,
  onBack,
  onContinue,
}) => {
  // Format today's date in YYYY-MM-DD for min date attribute
  const today = new Date().toISOString().split('T')[0] ?? '';

  const timeSlotOptions: { id: 'morning' | 'afternoon' | 'evening' | 'urgent'; title: string; window: string }[] = [
    { id: 'morning', title: 'Morning Slot', window: '09:00 AM – 12:00 PM' },
    { id: 'afternoon', title: 'Afternoon Slot', window: '12:00 PM – 04:00 PM' },
    { id: 'evening', title: 'Evening Slot', window: '04:00 PM – 08:00 PM' },
    { id: 'urgent', title: 'Immediate / Urgent', window: 'Earliest available professional' },
  ];

  return (
    <Card variant="default" padding="md" className="bg-white space-y-6">
      <CardHeader className="pb-3 border-b border-neutral-100">
        <div className="flex items-center gap-2 text-primary-700 font-semibold text-xs mb-1">
          <Calendar size={16} />
          <span>Step 4: Scheduling &amp; Timing</span>
        </div>
        <CardTitle>When should the professional arrive?</CardTitle>
        <CardDescription>
          Select your preferred appointment date and arrival time window.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Date Selector */}
        <div className="max-w-xs space-y-1">
          <Input
            type="date"
            label="Service Date"
            min={today}
            value={scheduledDate}
            onChange={(e) => onChangeScheduledDate(e.target.value)}
            leftIcon={<Calendar size={16} />}
            error={errors.scheduledDate}
            required
            helperText="Select a day from today onwards."
          />
        </div>

        {/* Time Slot Options */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-neutral-800">
            Preferred Time Window <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Arrival Time Window">
            {timeSlotOptions.map((opt) => {
              const isSelected = timeSlot === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => onChangeTimeSlot(opt.id)}
                  className={cn(
                    'p-4 rounded-xl border text-left transition-all cursor-pointer space-y-1',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                    isSelected
                      ? 'border-primary-500 bg-primary-50/70 ring-1 ring-primary-500 text-primary-950'
                      : 'border-neutral-200 bg-white hover:border-neutral-300 text-neutral-700'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs sm:text-sm">{opt.title}</span>
                    {isSelected && (
                      <CheckCircle2 size={16} className="text-primary-600" />
                    )}
                  </div>
                  <p className="text-xs text-neutral-600 flex items-center gap-1.5 font-mono">
                    <Clock size={12} className="text-neutral-400" />
                    <span>{opt.window}</span>
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Flexible Timing Option */}
        <div className="pt-2">
          <Checkbox
            label="Flexible arrival window (+/- 2 hours)"
            helperText="Allows a wider dispatch window to match top-rated professionals faster."
            checked={isFlexibleTiming}
            onChange={(e) => onChangeFlexibleTiming(e.target.checked)}
          />
        </div>

        {/* Honest Availability Notice */}
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-neutral-50 border border-neutral-200 text-xs text-neutral-600">
          <Info size={16} className="text-neutral-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Exact professional arrival confirmation will be issued when a verified service partner in your sector accepts the booking.
          </p>
        </div>
      </CardContent>

      <CardFooter className="pt-4 border-t border-neutral-100 flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          size="md"
          leftIcon={<ArrowLeft size={16} />}
          onClick={onBack}
        >
          Back
        </Button>

        <Button
          type="button"
          variant="primary"
          size="md"
          rightIcon={<ArrowRight size={16} />}
          onClick={onContinue}
        >
          Continue to Preferences
        </Button>
      </CardFooter>
    </Card>
  );
};
