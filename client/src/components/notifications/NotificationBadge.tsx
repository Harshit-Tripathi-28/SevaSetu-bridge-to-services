import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { cn } from '../../lib/utils';
import { NotificationService } from '../../services/notification.service';
import { CommunicationService } from '../../services/communication.service';

export interface NotificationBadgeProps {
  count?: number;
  className?: string;
  size?: number;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count: propCount,
  className,
  size = 18,
}) => {
  const [unreadCount, setUnreadCount] = useState<number>(propCount ?? 0);

  useEffect(() => {
    if (propCount !== undefined) {
      setUnreadCount(propCount);
      return;
    }

    // Fetch real unread count from PostgreSQL
    NotificationService.getUnreadCount()
      .then((c) => setUnreadCount(c))
      .catch(() => setUnreadCount(0));

    // Listen to real-time notification events
    const unsubscribe = CommunicationService.onNotification(() => {
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      unsubscribe();
    };
  }, [propCount]);

  const displayCount = propCount !== undefined ? propCount : unreadCount;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <Bell size={size} className="text-neutral-600" />
      {displayCount > 0 && (
        <span
          className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-primary-600 text-white text-[10px] font-bold flex items-center justify-center shadow-xs"
          aria-label={`${displayCount} unread notifications`}
        >
          {displayCount > 99 ? '99+' : displayCount}
        </span>
      )}
    </div>
  );
};
