import type { FC, HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  showDot?: boolean;
  withDot?: boolean;
  icon?: ReactNode;
}

export const Badge: FC<BadgeProps> = ({
  className,
  variant = 'neutral',
  size = 'md',
  showDot = false,
  withDot = false,
  icon,
  children,
  ...props
}) => {
  const hasDot = showDot || withDot;
  const variants: Record<BadgeVariant, { container: string; dot: string }> = {
    success: {
      container: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      dot: 'bg-emerald-500',
    },
    warning: {
      container: 'bg-amber-50 text-amber-800 border-amber-200',
      dot: 'bg-amber-500',
    },
    error: {
      container: 'bg-red-50 text-red-800 border-red-200',
      dot: 'bg-red-500',
    },
    info: {
      container: 'bg-sky-50 text-sky-800 border-sky-200',
      dot: 'bg-sky-500',
    },
    neutral: {
      container: 'bg-slate-100 text-slate-700 border-slate-200',
      dot: 'bg-slate-400',
    },
  };

  const sizes: Record<BadgeSize, string> = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border',
        variants[variant].container,
        sizes[size],
        className
      )}
      {...props}
    >
      {hasDot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full shrink-0', variants[variant].dot)}
          aria-hidden="true"
        />
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
