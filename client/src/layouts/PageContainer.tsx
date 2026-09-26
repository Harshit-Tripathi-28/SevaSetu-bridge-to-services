import React from 'react';
import { cn } from '../lib/utils';

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  noPadding?: boolean;
}

const maxWidthStyles: Record<NonNullable<PageContainerProps['maxWidth']>, string> = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  full: 'max-w-full',
};

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  maxWidth = 'lg',
  noPadding = false,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'w-full mx-auto',
        maxWidthStyles[maxWidth],
        !noPadding && 'px-4 sm:px-6 lg:px-8 py-6 sm:py-8',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
