import React from 'react';
import { Bell } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface NotificationBadgeProps {
  count?: number;
  className?: string;
  size?: number;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count = 0,
  className,
  size = 18,
}) => {
  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <Bell size={size} className="text-neutral-600" />
      {count > 0 && (
        <span
          className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-primary-600 text-white text-[10px] font-bold flex items-center justify-center shadow-xs"
          aria-label={`${count} unread notifications`}
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </div>
  );
};
