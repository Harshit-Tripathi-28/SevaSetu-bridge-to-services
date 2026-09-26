import React from 'react';
import { Badge } from '../ui/Badge';
import type { BookingTransactionStatus } from '../../types';

export interface TransactionStatusBadgeProps {
  status: BookingTransactionStatus;
  size?: 'sm' | 'md';
  className?: string;
}

const statusConfig: Record<
  BookingTransactionStatus,
  { label: string; variant: 'info' | 'warning' | 'success' | 'error' | 'neutral' }
> = {
  requested: { label: 'Requested', variant: 'info' },
  pending: { label: 'Pending Confirmation', variant: 'warning' },
  confirmed: { label: 'Confirmed', variant: 'info' },
  scheduled: { label: 'Scheduled', variant: 'info' },
  in_progress: { label: 'In Progress', variant: 'warning' },
  completed: { label: 'Completed', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'neutral' },
  disputed: { label: 'Disputed', variant: 'error' },
};

export const TransactionStatusBadge: React.FC<TransactionStatusBadgeProps> = ({
  status,
  size = 'sm',
  className,
}) => {
  const config = statusConfig[status] || { label: status, variant: 'neutral' };

  return (
    <Badge
      variant={config.variant}
      size={size}
      withDot
      className={className}
      aria-label={`Booking status: ${config.label}`}
    >
      {config.label}
    </Badge>
  );
};
