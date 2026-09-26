import React from 'react';
import { RotateCcw, HelpCircle } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import type { RefundSummary, RefundStatus as RefundStatusType } from '../../types';

export interface RefundStatusProps {
  refund: RefundSummary;
  onContactSupport?: () => void;
  className?: string;
}

const statusConfig: Record<
  RefundStatusType,
  { label: string; variant: 'info' | 'warning' | 'success' | 'error' | 'neutral'; description: string }
> = {
  pending: {
    label: 'Refund Requested',
    variant: 'warning',
    description: 'Under review by settlement operations. Usually verified within 24 hours.',
  },
  approved: {
    label: 'Refund Approved',
    variant: 'info',
    description: 'Authorization granted. Transferred to clearing bank gateway.',
  },
  processed: {
    label: 'Refund Completed',
    variant: 'success',
    description: 'Credited back to the original payment source (UPI/Card/Account).',
  },
  rejected: {
    label: 'Refund Rejected',
    variant: 'error',
    description: 'Ineligible per cancellation policy or after service dispatch window.',
  },
  not_applicable: {
    label: 'N/A',
    variant: 'neutral',
    description: 'No monetary refund is applicable for this booking.',
  },
};

export const RefundStatus: React.FC<RefundStatusProps> = ({
  refund,
  onContactSupport,
  className,
}) => {
  const config = statusConfig[refund.status] || statusConfig.pending;

  return (
    <Card variant="default" padding="sm" className={className}>
      <CardContent className="p-4 space-y-3 text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
          <div className="flex items-center gap-1.5 font-semibold text-neutral-900">
            <RotateCcw size={14} className="text-neutral-500" />
            <span>Refund Settlement Status</span>
          </div>
          <Badge variant={config.variant} size="sm" withDot>
            {config.label}
          </Badge>
        </div>

        <div className="space-y-1 text-neutral-600">
          <div className="flex justify-between">
            <span>Refundable Amount:</span>
            <span className="font-mono font-bold text-neutral-900 text-sm">
              {refund.currency} {refund.refundAmount.toFixed(2)}
            </span>
          </div>

          <p className="text-[11px] text-neutral-500 pt-0.5">{config.description}</p>
        </div>

        <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-200/80 text-[11px] text-neutral-500 space-y-1 font-mono">
          <div className="flex justify-between">
            <span>Booking Ref:</span>
            <span className="text-neutral-700">#{refund.bookingId}</span>
          </div>
          <div className="flex justify-between">
            <span>Requested On:</span>
            <span className="text-neutral-700">{refund.requestedAt}</span>
          </div>
          {refund.settledAt && (
            <div className="flex justify-between">
              <span>Settled Date:</span>
              <span className="text-neutral-700">{refund.settledAt}</span>
            </div>
          )}
          {refund.originalTransactionRef && (
            <div className="flex justify-between">
              <span>Original Txn ID:</span>
              <span className="text-neutral-700">{refund.originalTransactionRef}</span>
            </div>
          )}
        </div>

        {onContactSupport && (
          <div className="pt-1 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<HelpCircle size={13} />}
              onClick={onContactSupport}
              className="text-xs"
            >
              Have a dispute or query? Contact Support
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
