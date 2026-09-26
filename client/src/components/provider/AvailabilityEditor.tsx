import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Save,
  CalendarOff,
  Plus,
  Trash2,
  Coffee,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/Card';
import { Button } from '../ui/Button';
import { Checkbox } from '../ui/Checkbox';
import { Alert } from '../ui/Alert';
import { Input } from '../ui/Input';
import type {
  ProviderAvailabilityData,
  DaySchedule,
  DayOfWeek,
  AvailabilityOverride,
} from '../../types';

export interface AvailabilityEditorProps {
  initialAvailability?: ProviderAvailabilityData;
  onSave?: (availability: ProviderAvailabilityData) => void;
  className?: string;
}

const DEFAULT_WEEKLY: DaySchedule[] = [
  { day: 'monday', dayLabel: 'Monday', isAvailable: true, startTime: '09:00', endTime: '18:00', breakStart: '13:00', breakEnd: '14:00' },
  { day: 'tuesday', dayLabel: 'Tuesday', isAvailable: true, startTime: '09:00', endTime: '18:00', breakStart: '13:00', breakEnd: '14:00' },
  { day: 'wednesday', dayLabel: 'Wednesday', isAvailable: true, startTime: '09:00', endTime: '18:00', breakStart: '13:00', breakEnd: '14:00' },
  { day: 'thursday', dayLabel: 'Thursday', isAvailable: true, startTime: '09:00', endTime: '18:00', breakStart: '13:00', breakEnd: '14:00' },
  { day: 'friday', dayLabel: 'Friday', isAvailable: true, startTime: '09:00', endTime: '18:00', breakStart: '13:00', breakEnd: '14:00' },
  { day: 'saturday', dayLabel: 'Saturday', isAvailable: true, startTime: '10:00', endTime: '16:00' },
  { day: 'sunday', dayLabel: 'Sunday', isAvailable: false, startTime: '10:00', endTime: '14:00' },
];

export const AvailabilityEditor: React.FC<AvailabilityEditorProps> = ({
  initialAvailability,
  onSave,
  className,
}) => {
  const [schedule, setSchedule] = useState<DaySchedule[]>(
    initialAvailability?.weeklySchedule || DEFAULT_WEEKLY
  );
  const [vacationMode, setVacationMode] = useState<boolean>(
    initialAvailability?.vacationMode || false
  );
  const [overrides, setOverrides] = useState<AvailabilityOverride[]>(
    initialAvailability?.overrides || []
  );

  const [newOverrideDate, setNewOverrideDate] = useState('');
  const [newOverrideAvailable, setNewOverrideAvailable] = useState(false);
  const [newOverrideNote, setNewOverrideNote] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleToggleDay = (day: DayOfWeek) => {
    setSchedule((prev) =>
      prev.map((s) => (s.day === day ? { ...s, isAvailable: !s.isAvailable } : s))
    );
  };

  const handleTimeChange = (
    day: DayOfWeek,
    field: 'startTime' | 'endTime' | 'breakStart' | 'breakEnd',
    val: string
  ) => {
    setSchedule((prev) =>
      prev.map((s) => (s.day === day ? { ...s, [field]: val } : s))
    );
  };

  const handleAddOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOverrideDate) return;
    setOverrides((prev) => [
      ...prev,
      {
        date: newOverrideDate,
        isAvailable: newOverrideAvailable,
        note: newOverrideNote.trim() || undefined,
      },
    ]);
    setNewOverrideDate('');
    setNewOverrideNote('');
  };

  const handleRemoveOverride = (idx: number) => {
    setOverrides((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    const payload: ProviderAvailabilityData = {
      weeklySchedule: schedule,
      vacationMode,
      overrides,
    };
    if (onSave) onSave(payload);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  const activeDaysCount = schedule.filter((s) => s.isAvailable).length;

  return (
    <div className={`space-y-6 ${className || ''}`}>
      <Card variant="default" padding="md" className="bg-white space-y-6">
        <CardHeader className="pb-3 border-b border-neutral-100">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-primary-700 font-semibold text-xs">
                <Calendar size={16} />
                <span>Operating Calendar</span>
              </div>
              <CardTitle className="text-lg pt-1">Weekly Working Schedule</CardTitle>
              <CardDescription>
                Define the recurring weekly slots when you accept customer dispatch appointments.
              </CardDescription>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-neutral-600 bg-neutral-100 px-2.5 py-1 rounded-md font-medium">
                {activeDaysCount} of 7 Days Active
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {saveSuccess && (
            <Alert variant="success" title="Schedule Preferences Saved">
              Your weekly operating hours and holiday overrides have been recorded.
            </Alert>
          )}

          {/* Vacation / Temporary Pause Toggle */}
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-900">
                <CalendarOff size={15} />
                <span>Vacation / Temporary Pause Mode</span>
              </div>
              <p className="text-[11px] text-amber-800">
                When enabled, your profile will be marked unavailable for new immediate dispatches.
              </p>
            </div>

            <Checkbox
              label="Pause All Dispatches"
              checked={vacationMode}
              onChange={(e) => setVacationMode(e.target.checked)}
            />
          </div>

          {/* 7-Day Schedule List */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-neutral-800">
              Recurring Weekly Working Hours
            </label>

            <div className="divide-y divide-neutral-100 border border-neutral-200 rounded-xl overflow-hidden bg-white">
              {schedule.map((item) => (
                <div
                  key={item.day}
                  className={`p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    item.isAvailable ? 'bg-white' : 'bg-neutral-50/60 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3 sm:w-36">
                    <input
                      type="checkbox"
                      id={`day-${item.day}`}
                      checked={item.isAvailable}
                      onChange={() => handleToggleDay(item.day)}
                      className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 cursor-pointer"
                    />
                    <label
                      htmlFor={`day-${item.day}`}
                      className="text-xs font-semibold text-neutral-900 cursor-pointer select-none"
                    >
                      {item.dayLabel}
                    </label>
                  </div>

                  {item.isAvailable ? (
                    <div className="flex flex-wrap items-center gap-3 text-xs flex-1 justify-start sm:justify-end">
                      {/* Operating Hours */}
                      <div className="flex items-center gap-1.5">
                        <Clock size={13} className="text-neutral-400 shrink-0" />
                        <span className="text-[11px] text-neutral-500">From:</span>
                        <input
                          type="time"
                          value={item.startTime}
                          onChange={(e) => handleTimeChange(item.day, 'startTime', e.target.value)}
                          className="px-2 py-1 bg-white border border-neutral-300 rounded text-xs font-mono text-neutral-900 focus:ring-1 focus:ring-primary-500"
                        />
                        <span className="text-[11px] text-neutral-500">To:</span>
                        <input
                          type="time"
                          value={item.endTime}
                          onChange={(e) => handleTimeChange(item.day, 'endTime', e.target.value)}
                          className="px-2 py-1 bg-white border border-neutral-300 rounded text-xs font-mono text-neutral-900 focus:ring-1 focus:ring-primary-500"
                        />
                      </div>

                      {/* Optional Lunch / Break Window */}
                      {item.breakStart && item.breakEnd && (
                        <div className="hidden lg:flex items-center gap-1 text-[11px] text-neutral-500 bg-neutral-100 px-2 py-1 rounded">
                          <Coffee size={12} className="text-neutral-400" />
                          <span>Break: {item.breakStart}–{item.breakEnd}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-neutral-500 italic">Marked Unavailable</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* One-Time Date Overrides */}
          <div className="space-y-3 pt-2">
            <label className="block text-xs font-semibold text-neutral-800">
              Specific Date Overrides &amp; Holiday Blocks
            </label>

            {overrides.length > 0 && (
              <div className="space-y-2">
                {overrides.map((ov, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-neutral-200 bg-neutral-50 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-neutral-900">{ov.date}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                          ov.isAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {ov.isAvailable ? 'Special Available Day' : 'Blocked / Off-Duty'}
                      </span>
                      {ov.note && <span className="text-neutral-500 text-[11px]">— {ov.note}</span>}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveOverride(idx)}
                      className="p-1 text-neutral-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                      aria-label="Remove override"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Override Inline Form */}
            <form onSubmit={handleAddOverride} className="flex flex-col sm:flex-row items-center gap-2.5 p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-xs">
              <input
                type="date"
                value={newOverrideDate}
                onChange={(e) => setNewOverrideDate(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-primary-500 w-full sm:w-auto"
                aria-label="Override Date"
                required
              />

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="overrideAvailable"
                  checked={newOverrideAvailable}
                  onChange={(e) => setNewOverrideAvailable(e.target.checked)}
                  className="w-4 h-4 rounded text-primary-600"
                />
                <label htmlFor="overrideAvailable" className="text-neutral-700 cursor-pointer select-none">
                  Available on this date
                </label>
              </div>

              <div className="flex-1 w-full sm:w-auto">
                <Input
                  placeholder="Reason / Note (optional)"
                  value={newOverrideNote}
                  onChange={(e) => setNewOverrideNote(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                variant="outline"
                size="sm"
                leftIcon={<Plus size={14} />}
                className="shrink-0 w-full sm:w-auto text-xs"
              >
                Add Date Override
              </Button>
            </form>
          </div>
        </CardContent>

        <CardFooter className="pt-4 border-t border-neutral-100 flex items-center justify-between">
          <span className="text-[11px] text-neutral-500">
            Changes apply to incoming booking requests.
          </span>

          <Button
            type="button"
            variant="primary"
            size="md"
            leftIcon={<Save size={15} />}
            onClick={handleSave}
          >
            Save Schedule
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
