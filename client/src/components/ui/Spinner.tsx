import React from 'react';
import { cn } from '../../lib/utils';

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'current' | 'white' | 'neutral';
  label?: string;
}

const sizeStyles: Record<NonNullable<SpinnerProps['size']>, string> = {
  xs: 'w-3 h-3 border-2',
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-3',
  xl: 'w-12 h-12 border-4',
};

const variantStyles: Record<NonNullable<SpinnerProps['variant']>, { track: string; head: string }> = {
  primary: {
    track: 'border-primary-100',
    head: 'border-t-primary-600',
  },
  current: {
    track: 'border-current/20',
    head: 'border-t-current',
  },
  white: {
    track: 'border-white/30',
    head: 'border-t-white',
  },
  neutral: {
    track: 'border-neutral-200',
    head: 'border-t-neutral-700',
  },
};

export const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = 'md', variant = 'primary', label = 'Loading...', ...props }, ref) => {
    const config = variantStyles[variant];

    return (
      <div
        ref={ref}
        role="status"
        aria-label={label}
        className={cn('inline-flex items-center justify-center shrink-0', className)}
        {...props}
      >
        <span
          className={cn(
            'rounded-full animate-spin',
            sizeStyles[size],
            config.track,
            config.head
          )}
        />
        <span className="sr-only">{label}</span>
      </div>
    );
  }
);

Spinner.displayName = 'Spinner';
