import React from 'react';
import { Receipt, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { PaymentStatusBadge } from './PaymentStatusBadge';
import type { InvoiceData } from '../../types';

export interface InvoiceSummaryProps {
  invoice: InvoiceData;
  className?: string;
}

export const InvoiceSummary: React.FC<InvoiceSummaryProps> = ({
  invoice,
  className,
}) => {
  const currencySymbol = invoice.currency || '₹';

  return (
    <Card variant="default" padding="sm" className={className}>
      <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-600 shrink-0">
            <Receipt size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-neutral-900 font-mono text-sm">
                Invoice #{invoice.invoiceNumber}
              </span>
              <PaymentStatusBadge status={invoice.paymentStatus} size="sm" />
            </div>
            <p className="text-neutral-500 mt-0.5">
              Issued on {invoice.issueDate} • Total: <strong className="text-neutral-900 font-mono">{currencySymbol}{invoice.total.toFixed(2)}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Link to={`/invoice/${invoice.invoiceNumber}`}>
            <Button variant="outline" size="sm" rightIcon={<ArrowRight size={13} />}>
              View Invoice
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
