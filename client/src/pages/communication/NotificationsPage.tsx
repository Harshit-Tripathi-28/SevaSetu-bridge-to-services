import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Sliders } from 'lucide-react';
import { PageContainer } from '../../layouts/PageContainer';
import { PageHeader } from '../../layouts/PageHeader';
import {
  NotificationCenter,
  NotificationPreferences,
} from '../../components/notifications';
import { cn } from '../../lib/utils';
import { NotificationService } from '../../services/notification.service';
import { CommunicationService } from '../../services/communication.service';
import type { NotificationItem as NotificationItemType } from '../../types';
import type { NotificationRecord } from '@sevasetu/shared';

export interface NotificationsPageProps {
  userRole?: 'customer' | 'provider';
}

function mapBackendNotificationToItem(n: NotificationRecord): NotificationItemType {
  let category: NotificationItemType['category'] = 'system';
  if (n.type.startsWith('BOOKING_')) category = 'booking_update';
  else if (n.type === 'SERVICE_STATUS_UPDATED') category = 'service_status';
  else if (n.type === 'PAYMENT_UPDATED' || n.type === 'INVOICE_AVAILABLE') category = 'payment_update';
  else if (n.type === 'REVIEW_REMINDER') category = 'review_reminder';
  else if (n.type === 'NEW_MESSAGE') category = 'system';

  let timeFormatted = 'Recently';
  try {
    timeFormatted = new Date(n.createdAt).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    timeFormatted = 'Recently';
  }

  return {
    id: n.id,
    title: n.title,
    description: n.message,
    category,
    timestamp: timeFormatted,
    isRead: n.isRead,
    actionUrl:
      n.relatedEntityType === 'BOOKING' && n.relatedEntityId
        ? `/activity/${n.relatedEntityId}`
        : undefined,
  };
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({
  userRole = 'customer',
}) => {
  const [activeTab, setActiveTab] = useState<'notifications' | 'preferences'>('notifications');
  const [notifications, setNotifications] = useState<NotificationItemType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await NotificationService.getUserNotifications(1, 50);
      const items = res.notifications.map(mapBackendNotificationToItem);
      setNotifications(items);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Real-time notification updates via Socket.IO
  useEffect(() => {
    const socket = CommunicationService.getSocket();

    const handleNewNotification = (notif: NotificationRecord) => {
      const item = mapBackendNotificationToItem(notif);
      setNotifications((prev) => [item, ...prev.filter((n) => n.id !== notif.id)]);
    };

    socket.on('notification:new', handleNewNotification);

    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await NotificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await NotificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

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
          {unreadCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-primary-600 text-white text-[10px] font-bold flex items-center justify-center">
              {unreadCount}
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
          isLoading={isLoading}
        />
      ) : (
        <NotificationPreferences />
      )}
    </PageContainer>
  );
};
