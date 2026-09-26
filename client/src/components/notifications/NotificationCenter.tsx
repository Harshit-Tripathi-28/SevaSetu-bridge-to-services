import React, { useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { NotificationItem } from './NotificationItem';
import { cn } from '../../lib/utils';
import type { NotificationItem as NotificationItemType } from '../../types';

export interface NotificationCenterProps {
  notifications: NotificationItemType[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  isLoading?: boolean;
  className?: string;
}

type FilterCategory = 'all' | 'bookings' | 'payments' | 'system';

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  isLoading = false,
  className,
}) => {
  const [activeTab, setActiveTab] = useState<FilterCategory>('all');

  const filterTabs: { id: FilterCategory; label: string }[] = [
    { id: 'all', label: 'All Alerts' },
    { id: 'bookings', label: 'Service & Bookings' },
    { id: 'payments', label: 'Payments & Invoices' },
    { id: 'system', label: 'System' },
  ];

  const filteredNotifications = notifications.filter((item) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'bookings') {
      return (
        item.category === 'booking_update' ||
        item.category === 'request_update' ||
        item.category === 'schedule_change' ||
        item.category === 'service_status' ||
        item.category === 'review_reminder'
      );
    }
    if (activeTab === 'payments') {
      return item.category === 'payment_update';
    }
    if (activeTab === 'system') {
      return item.category === 'system';
    }
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Top Filter Bar and Mark Read Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-neutral-200">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none" role="tablist">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shrink-0 cursor-pointer select-none',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                activeTab === tab.id
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {unreadCount > 0 && onMarkAllAsRead && (
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<CheckCheck size={13} />}
            onClick={onMarkAllAsRead}
            className="text-xs self-end sm:self-auto text-neutral-600"
          >
            Mark all read ({unreadCount})
          </Button>
        )}
      </div>

      {/* Notification Stream */}
      {isLoading ? (
        <div className="space-y-3">
          <div className="h-20 rounded-xl bg-neutral-100 animate-pulse" />
          <div className="h-20 rounded-xl bg-neutral-100 animate-pulse" />
          <div className="h-20 rounded-xl bg-neutral-100 animate-pulse" />
        </div>
      ) : filteredNotifications.length > 0 ? (
        <div className="space-y-2.5">
          {filteredNotifications.map((notif) => (
            <NotificationItem
              key={notif.id}
              notification={notif}
              onMarkAsRead={onMarkAsRead}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Bell size={24} />}
          title="No alerts right now"
          description="Updates regarding your service appointments, technician dispatches, payment receipts, and review requests will be displayed here."
        />
      )}
    </div>
  );
};
