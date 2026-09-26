import React from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  compact?: boolean;
}

export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, icon, title, description, action, compact = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50/50',
          compact ? 'p-6' : 'p-12',
          className
        )}
        {...props}
      >
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-neutral-100 text-neutral-500 mb-4 ring-8 ring-neutral-50">
          {icon || <Inbox size={24} aria-hidden="true" />}
        </div>

        <h4 className="text-base font-semibold text-neutral-900 mb-1">{title}</h4>

        {description && (
          <p className="text-sm text-neutral-600 max-w-sm mb-6 leading-relaxed">
            {description}
          </p>
        )}

        {action && <div className="flex items-center gap-3">{action}</div>}
      </div>
    );
  }
);

EmptyState.displayName = 'EmptyState';
