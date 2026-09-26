import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  onClose?: () => void;
  icon?: boolean;
}

const variantStyles: Record<
  NonNullable<AlertProps['variant']>,
  { container: string; iconColor: string; defaultIcon: React.ElementType }
> = {
  info: {
    container: 'bg-primary-50/70 border-primary-200 text-primary-950',
    iconColor: 'text-primary-600',
    defaultIcon: Info,
  },
  success: {
    container: 'bg-emerald-50/80 border-emerald-200 text-emerald-950',
    iconColor: 'text-emerald-600',
    defaultIcon: CheckCircle2,
  },
  warning: {
    container: 'bg-amber-50/80 border-amber-200 text-amber-950',
    iconColor: 'text-amber-600',
    defaultIcon: AlertTriangle,
  },
  error: {
    container: 'bg-rose-50/80 border-rose-200 text-rose-950',
    iconColor: 'text-rose-600',
    defaultIcon: AlertCircle,
  },
};

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'info', title, children, onClose, icon = true, ...props }, ref) => {
    const config = variantStyles[variant];
    const IconComponent = config.defaultIcon;

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          'relative w-full rounded-lg border p-4 text-sm flex gap-3 transition-colors',
          config.container,
          className
        )}
        {...props}
      >
        {icon && (
          <div className="shrink-0 mt-0.5">
            <IconComponent size={18} className={config.iconColor} aria-hidden="true" />
          </div>
        )}

        <div className="flex-1 space-y-1">
          {title && <h5 className="font-semibold leading-tight">{title}</h5>}
          {children && <div className="text-neutral-700 leading-relaxed text-xs sm:text-sm">{children}</div>}
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Dismiss alert"
            className="shrink-0 rounded-md p-1 text-neutral-400 hover:text-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-400 transition-colors"
          >
            <X size={16} aria-hidden="true" />
          </button>
        )}
      </div>
    );
  }
);

Alert.displayName = 'Alert';

export const AlertTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5 ref={ref} className={cn('font-semibold leading-tight text-neutral-900', className)} {...props} />
  )
);
AlertTitle.displayName = 'AlertTitle';

export const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('text-sm text-neutral-700 leading-relaxed', className)} {...props} />
  )
);
AlertDescription.displayName = 'AlertDescription';
