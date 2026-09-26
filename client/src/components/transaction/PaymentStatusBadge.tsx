import React from 'react';
import { Badge } from '../ui/Badge';
import type { PaymentStatus } from '../../types';

export interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  size?: 'sm' | 'md';
  className?: string;
}

const paymentStatusConfig: Record<
  PaymentStatus,
  { label: string; variant: 'info' | 'warning' | 'success' | 'error' | 'neutral' }
> = {
  pending: { label: 'Payment Pending', variant: 'warning' },
  authorized: { label: 'Authorized / Held', variant: 'info' },
  paid: { label: 'Paid & Settled', variant: 'success' },
  failed: { label: 'Payment Failed', variant: 'error' },
  refunded: { label: 'Refunded', variant: 'neutral' },
  partially_refunded: { label: 'Partially Refunded', variant: 'warning' },
};

export const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({
  status,
  size = 'sm',
  className,
}) => {
  const config = paymentStatusConfig[status] || { label: status, variant: 'neutral' };

  return (
    <Badge
      variant={config.variant}
      size={size}
      withDot
      className={className}
      aria-label={`Payment status: ${config.label}`}
    >
      {config.label}
    </Badge>
  );
};
