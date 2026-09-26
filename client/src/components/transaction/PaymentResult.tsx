import React from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  ArrowRight,
  LifeBuoy,
  CreditCard,
  Receipt,
  MessageSquare,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import type { PaymentFlowState, PaymentResultData } from '../../types';

export interface PaymentResultProps {
  state: PaymentFlowState;
  data?: PaymentResultData;
  onRetry?: () => void;
  onChangePaymentMethod?: () => void;
  onContactSupport?: () => void;
}

export const PaymentResult: React.FC<PaymentResultProps> = ({
  state,
  data,
  onRetry,
  onChangePaymentMethod,
  onContactSupport,
}) => {
  const currencySymbol = data?.currency || '₹';

  // State: Processing
  if (state === 'processing') {
    return (
      <Card variant="default" padding="lg" className="max-w-xl mx-auto text-center space-y-4">
        <CardContent className="space-y-4 py-8">
          <div className="flex justify-center">
            <Spinner size="lg" className="text-primary-600" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-neutral-900">
              Processing Payment Authorization
            </h3>
            <p className="text-xs sm:text-sm text-neutral-600 max-w-sm mx-auto">
              Please wait while we establish secure handshake with the payment network. Do not refresh or close this window.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // State: Success
  if (state === 'success') {
    return (
      <Card variant="default" padding="lg" className="max-w-xl mx-auto text-center space-y-6">
        <CardContent className="space-y-6 py-4">
          {/* Success Check Icon */}
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 size={36} />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">
              Payment Confirmed
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 max-w-md mx-auto">
              Your service booking has been confirmed and placed with local service technicians.
            </p>
          </div>

          {/* Reference Details Grid */}
          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-left space-y-2.5">
            {data?.transactionReference && (
              <div className="flex items-center justify-between pb-1.5 border-b border-neutral-200">
                <span className="text-neutral-500">Transaction Ref:</span>
                <span className="font-mono font-semibold text-neutral-900">
                  {data.transactionReference}
                </span>
              </div>
            )}

            {data?.invoiceReference && (
              <div className="flex items-center justify-between pb-1.5 border-b border-neutral-200">
                <span className="text-neutral-500">Tax Invoice No:</span>
                <span className="font-mono font-semibold text-neutral-900">
                  {data.invoiceReference}
                </span>
              </div>
            )}

            {data?.serviceTitle && (
              <div className="flex items-center justify-between pb-1.5 border-b border-neutral-200">
                <span className="text-neutral-500">Service:</span>
                <span className="font-medium text-neutral-900">{data.serviceTitle}</span>
              </div>
            )}

            {data?.amountPaid !== undefined && (
              <div className="flex items-center justify-between pt-1">
                <span className="text-neutral-700 font-semibold">Total Paid:</span>
                <span className="font-mono font-bold text-base text-neutral-900">
                  {currencySymbol}{data.amountPaid.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {data?.invoiceReference && (
              <Link to={`/invoice/${data.invoiceReference}`} className="w-full sm:w-auto">
                <Button variant="outline" size="sm" leftIcon={<Receipt size={14} />} className="w-full sm:w-auto">
                  View Invoice
                </Button>
              </Link>
            )}

            <Link to="/messages" className="w-full sm:w-auto">
              <Button variant="outline" size="sm" leftIcon={<MessageSquare size={14} />} className="w-full sm:w-auto">
                Contact Provider
              </Button>
            </Link>

            <Link to="/activity" className="w-full sm:w-auto">
              <Button variant="primary" size="sm" rightIcon={<ArrowRight size={14} />} className="w-full sm:w-auto">
                Go to Activity
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // State: Failed / Retry
  if (state === 'failed' || state === 'retry') {
    return (
      <Card variant="default" padding="lg" className="max-w-xl mx-auto text-center space-y-6">
        <CardContent className="space-y-6 py-4">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
            <XCircle size={36} />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">
              Payment Could Not Be Processed
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 max-w-md mx-auto">
              {data?.errorMessage ||
                'The banking network or payment authorization provider was unable to complete this transaction.'}
            </p>
          </div>

          {/* Safe Disclosure Notice */}
          <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-600 text-left">
            <div className="flex items-center gap-2 font-medium text-neutral-800 mb-1">
              <Clock size={14} className="text-neutral-500" />
              <span>Was your bank account debited?</span>
            </div>
            <p className="leading-relaxed">
              If an amount was deducted, standard banking clearing guidelines dictate an automatic reversal within 2 to 4 business days. No extra charge will be held.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {onRetry && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<RotateCcw size={14} />}
                onClick={onRetry}
                className="w-full sm:w-auto"
              >
                Retry Payment
              </Button>
            )}

            {onChangePaymentMethod && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<CreditCard size={14} />}
                onClick={onChangePaymentMethod}
                className="w-full sm:w-auto"
              >
                Change Method
              </Button>
            )}

            {onContactSupport && (
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<LifeBuoy size={14} />}
                onClick={onContactSupport}
                className="w-full sm:w-auto"
              >
                Payment Support
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};
