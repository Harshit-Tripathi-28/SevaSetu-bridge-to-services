import React from 'react';
import {
  CalendarClock,
  Sparkles,
  CreditCard,
  Star,
  Info,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import type { NotificationItem as NotificationItemType, NotificationCategory } from '../../types';

export interface NotificationItemProps {
  notification: NotificationItemType;
  onMarkAsRead?: (id: string) => void;
  className?: string;
}

const getCategoryIcon = (category: NotificationCategory) => {
  switch (category) {
    case 'booking_update':
    case 'schedule_change':
      return <CalendarClock size={16} className="text-primary-600" />;
    case 'request_update':
      return <Sparkles size={16} className="text-primary-600" />;
    case 'payment_update':
      return <CreditCard size={16} className="text-emerald-600" />;
    case 'review_reminder':
      return <Star size={16} className="text-amber-500" />;
    case 'service_status':
      return <CheckCircle2 size={16} className="text-primary-600" />;
    case 'system':
    default:
      return <Info size={16} className="text-neutral-500" />;
  }
};

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  className,
}) => {
  return (
    <div
      className={cn(
        'p-3.5 sm:p-4 rounded-xl border transition-all flex items-start gap-3.5',
        notification.isRead
          ? 'bg-white border-neutral-200 text-neutral-600'
          : 'bg-primary-50/30 border-primary-200/60 text-neutral-900 shadow-2xs',
        className
      )}
    >
      {/* Category Icon Badge */}
      <div
        className={cn(
          'w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
          notification.isRead ? 'bg-neutral-100' : 'bg-primary-100/70'
        )}
      >
        {getCategoryIcon(notification.category)}
      </div>

      {/* Content Details */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-xs sm:text-sm text-neutral-900">
            {notification.title}
          </span>
          <span className="text-[11px] font-mono text-neutral-400 shrink-0">
            {notification.timestamp}
          </span>
        </div>

        <p className="text-xs text-neutral-600 leading-relaxed">
          {notification.description}
        </p>

        {/* Action Link & Mark Read CTA */}
        <div className="flex items-center justify-between pt-1 text-xs">
          {notification.actionUrl ? (
            <Link
              to={notification.actionUrl}
              className="inline-flex items-center gap-1 font-semibold text-primary-600 hover:text-primary-800"
            >
              <span>View details</span>
              <ArrowRight size={12} />
            </Link>
          ) : (
            <span />
          )}

          {!notification.isRead && onMarkAsRead && (
            <button
              type="button"
              onClick={() => onMarkAsRead(notification.id)}
              className="text-[11px] text-neutral-400 hover:text-neutral-700 underline cursor-pointer"
            >
              Mark as read
            </button>
          )}
        </div>
      </div>

      {/* Unread Indicator Dot */}
      {!notification.isRead && (
        <span
          className="w-2 h-2 rounded-full bg-primary-600 mt-2 shrink-0"
          aria-label="Unread notification"
        />
      )}
    </div>
  );
};
