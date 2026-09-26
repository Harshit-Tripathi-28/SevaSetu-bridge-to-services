import React, { useState } from 'react';
import { ShieldCheck, Info } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import type { NotificationPreferenceItem } from '../../types';

export interface NotificationPreferencesProps {
  onSavePreferences?: (prefs: NotificationPreferenceItem[]) => void;
  className?: string;
}

const DEFAULT_PREFERENCES: NotificationPreferenceItem[] = [
  {
    key: 'booking_updates',
    label: 'Booking & Dispatch Updates',
    description: 'Instant notifications when provider confirms slot, marks on the way, or arrives.',
    inApp: true,
    email: true,
    sms: true,
    push: true,
  },
  {
    key: 'service_reminders',
    label: 'Service Reminders',
    description: 'Advance reminders 2 hours before the scheduled home visit appointment.',
    inApp: true,
    email: false,
    sms: true,
    push: true,
  },
  {
    key: 'payment_updates',
    label: 'Payment & Invoice Receipts',
    description: 'Immediate payment receipts, settlement statements, and refund notices.',
    inApp: true,
    email: true,
    sms: false,
    push: true,
  },
  {
    key: 'direct_messages',
    label: 'Chat Messages from Partner/Client',
    description: 'Coordination messages, location queries, and arrival questions.',
    inApp: true,
    email: false,
    sms: false,
    push: true,
  },
  {
    key: 'reviews_ratings',
    label: 'Reviews & Feedback Requests',
    description: 'Invitations to evaluate completed service quality and view responses.',
    inApp: true,
    email: true,
    sms: false,
    push: false,
  },
];

export const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({
  onSavePreferences,
  className,
}) => {
  const [preferences, setPreferences] = useState<NotificationPreferenceItem[]>(DEFAULT_PREFERENCES);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleToggle = (
    key: string,
    channel: 'inApp' | 'email' | 'sms' | 'push'
  ) => {
    setPreferences((prev) =>
      prev.map((item) => {
        if (item.key === key) {
          return { ...item, [channel]: !item[channel] };
        }
        return item;
      })
    );
    setSavedSuccess(false);
  };

  const handleSave = () => {
    if (onSavePreferences) {
      onSavePreferences(preferences);
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <Card variant="default" padding="md" className={className}>
      <CardHeader className="pb-3 border-b border-neutral-100 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base sm:text-lg">
            Notification &amp; Alert Preferences
          </CardTitle>
          <p className="text-xs text-neutral-500 mt-0.5">
            Configure which updates you receive and choose delivery channels.
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-2">
        {/* Channel Status Disclosure */}
        <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-600 flex items-start gap-2.5">
          <Info size={16} className="text-neutral-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>In-app alerts</strong> are active natively. <strong>Email, SMS, and Push</strong> preferences will automatically apply as respective notification gateways are connected in future infrastructure integrations.
          </p>
        </div>

        {/* Matrix Table */}
        <div className="border border-neutral-200 rounded-xl overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-600 border-b border-neutral-200">
              <tr>
                <th scope="col" className="py-3 px-4 font-semibold">Notification Type</th>
                <th scope="col" className="py-3 px-3 font-semibold text-center w-20">In-App</th>
                <th scope="col" className="py-3 px-3 font-semibold text-center w-20">Push</th>
                <th scope="col" className="py-3 px-3 font-semibold text-center w-20">Email</th>
                <th scope="col" className="py-3 px-3 font-semibold text-center w-20">SMS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {preferences.map((item) => (
                <tr key={item.key} className="hover:bg-neutral-50/50">
                  <td className="py-3 px-4">
                    <span className="font-semibold text-neutral-900 block">{item.label}</span>
                    <span className="text-[11px] text-neutral-500">{item.description}</span>
                  </td>

                  {/* In-App Toggle */}
                  <td className="py-3 px-3 text-center">
                    <input
                      type="checkbox"
                      checked={item.inApp}
                      onChange={() => handleToggle(item.key, 'inApp')}
                      className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 cursor-pointer"
                      aria-label={`${item.label} in-app toggle`}
                    />
                  </td>

                  {/* Push Toggle */}
                  <td className="py-3 px-3 text-center">
                    <input
                      type="checkbox"
                      checked={item.push}
                      onChange={() => handleToggle(item.key, 'push')}
                      className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 cursor-pointer"
                      aria-label={`${item.label} push toggle`}
                    />
                  </td>

                  {/* Email Toggle */}
                  <td className="py-3 px-3 text-center">
                    <input
                      type="checkbox"
                      checked={item.email}
                      onChange={() => handleToggle(item.key, 'email')}
                      className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 cursor-pointer"
                      aria-label={`${item.label} email toggle`}
                    />
                  </td>

                  {/* SMS Toggle */}
                  <td className="py-3 px-3 text-center">
                    <input
                      type="checkbox"
                      checked={item.sms}
                      onChange={() => handleToggle(item.key, 'sms')}
                      className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 cursor-pointer"
                      aria-label={`${item.label} sms toggle`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Action Save CTA */}
        <div className="flex items-center justify-between pt-2">
          {savedSuccess ? (
            <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
              <ShieldCheck size={14} />
              Preferences saved successfully!
            </span>
          ) : (
            <span className="text-[11px] text-neutral-400">Settings update immediately for your active session.</span>
          )}

          <Button variant="primary" size="sm" onClick={handleSave}>
            Save Preferences
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
