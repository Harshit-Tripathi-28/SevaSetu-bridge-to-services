import React, { useState } from 'react';
import { User } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  initials?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  shape?: 'circle' | 'rounded';
  status?: 'online' | 'offline' | 'busy' | 'away';
}

const sizeStyles: Record<NonNullable<AvatarProps['size']>, { container: string; text: string; icon: number; status: string }> = {
  xs: { container: 'w-6 h-6', text: 'text-[10px]', icon: 12, status: 'w-1.5 h-1.5 ring-1' },
  sm: { container: 'w-8 h-8', text: 'text-xs', icon: 16, status: 'w-2 h-2 ring-1.5' },
  md: { container: 'w-10 h-10', text: 'text-sm', icon: 20, status: 'w-2.5 h-2.5 ring-2' },
  lg: { container: 'w-14 h-14', text: 'text-base', icon: 28, status: 'w-3.5 h-3.5 ring-2' },
  xl: { container: 'w-20 h-20', text: 'text-xl', icon: 40, status: 'w-4 h-4 ring-2' },
};

const statusStyles: Record<NonNullable<AvatarProps['status']>, string> = {
  online: 'bg-emerald-500',
  offline: 'bg-neutral-400',
  busy: 'bg-rose-500',
  away: 'bg-amber-500',
};

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt = '', initials, size = 'md', shape = 'circle', status, ...props }, ref) => {
    const [imageError, setImageError] = useState(false);
    const sizeConfig = sizeStyles[size];

    const hasValidImage = src && !imageError;

    return (
      <div
        ref={ref}
        className={cn(
          'relative inline-flex shrink-0 items-center justify-center font-medium bg-neutral-100 text-neutral-700 select-none overflow-visible',
          shape === 'circle' ? 'rounded-full' : 'rounded-lg',
          sizeConfig.container,
          className
        )}
        {...props}
      >
        <div
          className={cn(
            'w-full h-full flex items-center justify-center overflow-hidden',
            shape === 'circle' ? 'rounded-full' : 'rounded-lg'
          )}
        >
          {hasValidImage ? (
            <img
              src={src}
              alt={alt}
              onError={() => setImageError(true)}
              className="w-full h-full object-cover"
            />
          ) : initials ? (
            <span className={cn('font-semibold uppercase tracking-wider', sizeConfig.text)}>
              {initials.slice(0, 2)}
            </span>
          ) : (
            <User size={sizeConfig.icon} className="text-neutral-400" aria-hidden="true" />
          )}
        </div>

        {status && (
          <span
            className={cn(
              'absolute bottom-0 right-0 rounded-full ring-white',
              statusStyles[status],
              sizeConfig.status
            )}
            aria-label={`Status: ${status}`}
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';
