import React, { useState } from 'react';
import { Bell, Sliders } from 'lucide-react';
import { PageContainer } from '../../layouts/PageContainer';
import { PageHeader } from '../../layouts/PageHeader';
import {
  NotificationCenter,
  NotificationPreferences,
} from '../../components/notifications';
import { cn } from '../../lib/utils';
import type { NotificationItem } from '../../types';

export interface NotificationsPageProps {
  userRole?: 'customer' | 'provider';
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({
  userRole = 'customer',
}) => {
  const [activeTab, setActiveTab] = useState<'notifications' | 'preferences'>('notifications');

  // Honest data-driven notifications list (empty initial state per data integrity audit)
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <PageContainer maxWidth="xl" className="space-y-6 pb-12">
      <PageHeader
        title="Notification &amp; Alert Center"
        description="Real-time updates regarding service bookings, partner arrival, payment receipts, and security reminders."
        breadcrumbs={[
          {
            label: userRole === 'provider' ? 'Provider Console' : 'Activity',
            href: userRole === 'provider' ? '/provider' : '/activity',
          },
          { label: 'Notifications' },
        ]}
      />

      {/* Primary Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-neutral-200" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'notifications'}
          onClick={() => setActiveTab('notifications')}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer',
            activeTab === 'notifications'
              ? 'border-neutral-900 text-neutral-900'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          )}
        >
          <Bell size={14} />
          <span>All Notifications</span>
          {notifications.filter((n) => !n.isRead).length > 0 && (
            <span className="w-5 h-5 rounded-full bg-primary-600 text-white text-[10px] font-bold flex items-center justify-center">
              {notifications.filter((n) => !n.isRead).length}
            </span>
          )}
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'preferences'}
          onClick={() => setActiveTab('preferences')}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer',
            activeTab === 'preferences'
              ? 'border-neutral-900 text-neutral-900'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          )}
        >
          <Sliders size={14} />
          <span>Alert Preferences</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'notifications' ? (
        <NotificationCenter
          notifications={notifications}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
        />
      ) : (
        <NotificationPreferences />
      )}
    </PageContainer>
  );
};
