import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Save,
  CalendarOff,
  Plus,
  Trash2,
  Coffee,
  Loader2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/Card';
import { Button } from '../ui/Button';
import { Checkbox } from '../ui/Checkbox';
import { Alert } from '../ui/Alert';
import { Input } from '../ui/Input';
import { providerService } from '../../services/provider.service';
import type {
  DayOfWeek,
  SetDayScheduleInput,
  AvailabilityOverrideItem,
  ProviderAvailabilitySchedule,
  ProviderAvailabilityItem,
} from '@sevasetu/shared';

export interface AvailabilityEditorProps {
  className?: string;
  onSaved?: (data: ProviderAvailabilitySchedule) => void;
}

interface LocalDaySchedule {
  dayOfWeek: DayOfWeek;
  dayLabel: string;
  isAvailable: boolean;
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
}

const ORDERED_DAYS: { day: DayOfWeek; label: string; defaultStart: string; defaultEnd: string; defaultAvailable: boolean }[] = [
  { day: 'MONDAY', label: 'Monday', defaultStart: '09:00', defaultEnd: '18:00', defaultAvailable: true },
  { day: 'TUESDAY', label: 'Tuesday', defaultStart: '09:00', defaultEnd: '18:00', defaultAvailable: true },
  { day: 'WEDNESDAY', label: 'Wednesday', defaultStart: '09:00', defaultEnd: '18:00', defaultAvailable: true },
  { day: 'THURSDAY', label: 'Thursday', defaultStart: '09:00', defaultEnd: '18:00', defaultAvailable: true },
  { day: 'FRIDAY', label: 'Friday', defaultStart: '09:00', defaultEnd: '18:00', defaultAvailable: true },
  { day: 'SATURDAY', label: 'Saturday', defaultStart: '10:00', defaultEnd: '16:00', defaultAvailable: true },
  { day: 'SUNDAY', label: 'Sunday', defaultStart: '10:00', defaultEnd: '14:00', defaultAvailable: false },
];

export const AvailabilityEditor: React.FC<AvailabilityEditorProps> = ({
  className,
  onSaved,
}) => {
  const [schedule, setSchedule] = useState<LocalDaySchedule[]>(() =>
    ORDERED_DAYS.map((d) => ({
      dayOfWeek: d.day,
      dayLabel: d.label,
      isAvailable: d.defaultAvailable,
      startTime: d.defaultStart,
      endTime: d.defaultEnd,
      breakStart: '13:00',
      breakEnd: '14:00',
    }))
  );
  const [vacationMode, setVacationMode] = useState<boolean>(false);
  const [overrides, setOverrides] = useState<AvailabilityOverrideItem[]>([]);

  // State indicators
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // New Override State
  const [newOverrideDate, setNewOverrideDate] = useState('');
  const [newOverrideAvailable, setNewOverrideAvailable] = useState(false);
  const [newOverrideReason, setNewOverrideReason] = useState('');
  const [isAddingOverride, setIsAddingOverride] = useState(false);

  // Fetch Real Availability from PostgreSQL
  useEffect(() => {
    let isMounted = true;
    async function loadAvailability() {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const data = await providerService.getAvailability();
        if (!isMounted) return;

        setVacationMode(data.vacationMode || false);
        setOverrides(data.overrides || []);

        // Map weeklySchedule from backend onto the 7 ordered days
        if (data.weeklySchedule && data.weeklySchedule.length > 0) {
          const mapped = ORDERED_DAYS.map((def) => {
            const existing = data.weeklySchedule.find((w: ProviderAvailabilityItem) => w.dayOfWeek === def.day);
            if (existing) {
              return {
                dayOfWeek: def.day,
                dayLabel: def.label,
                isAvailable: existing.isAvailable,
                startTime: existing.startTime || def.defaultStart,
                endTime: existing.endTime || def.defaultEnd,
                breakStart: existing.breakStart || undefined,
                breakEnd: existing.breakEnd || undefined,
              };
            }
            return {
              dayOfWeek: def.day,
              dayLabel: def.label,
              isAvailable: def.defaultAvailable,
              startTime: def.defaultStart,
              endTime: def.defaultEnd,
              breakStart: '13:00',
              breakEnd: '14:00',
            };
          });
          setSchedule(mapped);
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : 'Failed to load availability schedule';
        setErrorMessage(msg);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadAvailability();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggleDay = (day: DayOfWeek) => {
    setSchedule((prev) =>
      prev.map((s) => (s.dayOfWeek === day ? { ...s, isAvailable: !s.isAvailable } : s))
    );
  };

  const handleTimeChange = (
    day: DayOfWeek,
    field: 'startTime' | 'endTime' | 'breakStart' | 'breakEnd',
    val: string
  ) => {
    setSchedule((prev) =>
      prev.map((s) => (s.dayOfWeek === day ? { ...s, [field]: val } : s))
    );
  };

  // Add Date-Specific Override
  const handleAddOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOverrideDate) return;

    setIsAddingOverride(true);
    setErrorMessage(null);
    try {
      const updated = await providerService.createOverride({
        date: newOverrideDate,
        isAvailable: newOverrideAvailable,
        reason: newOverrideReason.trim() || undefined,
      });

      setOverrides(updated.overrides || []);
      setNewOverrideDate('');
      setNewOverrideReason('');
      setNewOverrideAvailable(false);
      setSuccessMessage(`Date override for ${newOverrideDate} saved.`);
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save date override';
      setErrorMessage(msg);
    } finally {
      setIsAddingOverride(false);
    }
  };

  // Remove Date Override
  const handleRemoveOverride = async (id: string, dateStr: string) => {
    setErrorMessage(null);
    try {
      await providerService.deleteOverride(id);
      setOverrides((prev) => prev.filter((o) => o.id !== id));
      setSuccessMessage(`Override for ${dateStr} removed.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete date override';
      setErrorMessage(msg);
    }
  };

  // Validate and Save Weekly Working Hours
  const handleSave = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    // Client-side validation: ensure startTime < endTime for available days
    for (const item of schedule) {
      if (item.isAvailable) {
        if (!item.startTime || !item.endTime) {
          setErrorMessage(`Please provide valid start and end times for ${item.dayLabel}.`);
          return;
        }
        if (item.startTime >= item.endTime) {
          setErrorMessage(`${item.dayLabel} operating hours are invalid: Start time must precede end time.`);
          return;
        }
        if (item.breakStart && item.breakEnd) {
          if (item.breakStart >= item.breakEnd) {
            setErrorMessage(`${item.dayLabel} break times are invalid: Break start must precede break end.`);
            return;
          }
          if (item.breakStart < item.startTime || item.breakEnd > item.endTime) {
            setErrorMessage(`${item.dayLabel} break must fall within the working shift (${item.startTime} - ${item.endTime}).`);
            return;
          }
        }
      }
    }

    setIsSaving(true);
    try {
      const payloadSchedule: SetDayScheduleInput[] = schedule.map((s) => ({
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        isAvailable: s.isAvailable,
        breakStart: s.breakStart || null,
        breakEnd: s.breakEnd || null,
      }));

      const res = await providerService.setAvailability({
        vacationMode,
        weeklySchedule: payloadSchedule,
      });

      setSuccessMessage('Weekly operating schedule successfully saved.');
      if (onSaved) onSaved(res);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save weekly schedule';
      setErrorMessage(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const activeDaysCount = schedule.filter((s) => s.isAvailable).length;

  if (isLoading) {
    return (
      <Card variant="default" padding="lg" className="bg-white text-center py-12">
        <Loader2 size={28} className="animate-spin text-primary-600 mx-auto mb-3" />
        <p className="text-xs text-neutral-600 font-medium">Loading your availability schedule...</p>
      </Card>
    );
  }

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
          {errorMessage && (
            <Alert variant="error" title="Schedule Error">
              {errorMessage}
            </Alert>
          )}

          {successMessage && (
            <Alert variant="success" title="Success">
              {successMessage}
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
                When enabled, your profile will be marked unavailable for customer search and booking dispatches.
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
                  key={item.dayOfWeek}
                  className={`p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    item.isAvailable ? 'bg-white' : 'bg-neutral-50/60 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3 sm:w-36">
                    <input
                      type="checkbox"
                      id={`day-${item.dayOfWeek}`}
                      checked={item.isAvailable}
                      onChange={() => handleToggleDay(item.dayOfWeek)}
                      className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 cursor-pointer"
                    />
                    <label
                      htmlFor={`day-${item.dayOfWeek}`}
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
                          onChange={(e) => handleTimeChange(item.dayOfWeek, 'startTime', e.target.value)}
                          className="px-2 py-1 bg-white border border-neutral-300 rounded text-xs font-mono text-neutral-900 focus:ring-1 focus:ring-primary-500"
                        />
                        <span className="text-[11px] text-neutral-500">To:</span>
                        <input
                          type="time"
                          value={item.endTime}
                          onChange={(e) => handleTimeChange(item.dayOfWeek, 'endTime', e.target.value)}
                          className="px-2 py-1 bg-white border border-neutral-300 rounded text-xs font-mono text-neutral-900 focus:ring-1 focus:ring-primary-500"
                        />
                      </div>

                      {/* Optional Lunch / Break Window */}
                      <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 bg-neutral-50 border border-neutral-200 px-2 py-1 rounded">
                        <Coffee size={12} className="text-neutral-400" />
                        <span>Break:</span>
                        <input
                          type="time"
                          value={item.breakStart || ''}
                          onChange={(e) => handleTimeChange(item.dayOfWeek, 'breakStart', e.target.value)}
                          placeholder="Break Start"
                          className="px-1 py-0.5 bg-white border border-neutral-300 rounded text-[11px] font-mono text-neutral-800"
                        />
                        <span>–</span>
                        <input
                          type="time"
                          value={item.breakEnd || ''}
                          onChange={(e) => handleTimeChange(item.dayOfWeek, 'breakEnd', e.target.value)}
                          placeholder="Break End"
                          className="px-1 py-0.5 bg-white border border-neutral-300 rounded text-[11px] font-mono text-neutral-800"
                        />
                      </div>
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

            {overrides.length > 0 ? (
              <div className="space-y-2">
                {overrides.map((ov) => (
                  <div
                    key={ov.id}
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
                      {ov.reason && <span className="text-neutral-500 text-[11px]">— {ov.reason}</span>}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveOverride(ov.id, ov.date)}
                      className="p-1 text-neutral-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                      aria-label="Remove override"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 text-center border border-dashed border-neutral-200 rounded-lg text-xs text-neutral-500">
                No specific date overrides configured. Your recurring weekly schedule applies to all dates.
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
                  placeholder="Reason / Note (e.g. National Holiday, Extra Shift)"
                  value={newOverrideReason}
                  onChange={(e) => setNewOverrideReason(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                variant="outline"
                size="sm"
                leftIcon={isAddingOverride ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                disabled={isAddingOverride || !newOverrideDate}
                className="shrink-0 w-full sm:w-auto text-xs"
              >
                Add Date Override
              </Button>
            </form>
          </div>
        </CardContent>

        <CardFooter className="pt-4 border-t border-neutral-100 flex items-center justify-between">
          <span className="text-[11px] text-neutral-500">
            Changes are saved to your real database profile and affect search dispatching.
          </span>

          <Button
            type="button"
            variant="primary"
            size="md"
            leftIcon={isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            disabled={isSaving}
            onClick={handleSave}
          >
            {isSaving ? 'Saving...' : 'Save Schedule'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
