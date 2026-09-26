import React from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  User,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { PriceBreakdown } from './PriceBreakdown';
import { PaymentMethodSelector } from './PaymentMethodSelector';
import { PaymentStatusBadge } from './PaymentStatusBadge';
import type { PaymentSummaryData, PaymentMethodType } from '../../types';

export interface PaymentSummaryProps {
  data: PaymentSummaryData;
  selectedMethod: PaymentMethodType;
  onSelectMethod: (method: PaymentMethodType) => void;
  onProceedToPayment: () => void;
  isProcessing?: boolean;
}

export const PaymentSummary: React.FC<PaymentSummaryProps> = ({
  data,
  selectedMethod,
  onSelectMethod,
  onProceedToPayment,
  isProcessing = false,
}) => {
  const currencySymbol = data.pricing.currency || '₹';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Service Details & Payment Method Selection */}
      <div className="lg:col-span-7 space-y-6">
        {/* Service & Booking Identification Card */}
        <Card variant="default" padding="md" className="space-y-4">
          <CardHeader className="pb-3 border-b border-neutral-100 flex flex-row items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 block">
                Booking #{data.bookingId}
              </span>
              <CardTitle className="text-lg">{data.serviceTitle}</CardTitle>
            </div>
            <PaymentStatusBadge status={data.paymentStatus} />
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Schedule & Location Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-neutral-50 text-xs text-neutral-700 border border-neutral-100">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-neutral-500 shrink-0" />
                <span><strong>Date:</strong> {data.scheduledDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-neutral-500 shrink-0" />
                <span><strong>Slot:</strong> {data.scheduledTimeSlot}</span>
              </div>
              <div className="sm:col-span-2 flex items-start gap-2 pt-1 border-t border-neutral-200/60">
                <MapPin size={14} className="text-neutral-500 shrink-0 mt-0.5" />
                <span><strong>Service Address:</strong> {data.serviceAddress}</span>
              </div>
            </div>

            {/* Provider Information (if available) */}
            {data.provider ? (
              <div className="flex items-center justify-between p-3 rounded-xl border border-neutral-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 font-bold text-sm">
                    {data.provider.avatarUrl ? (
                      <img
                        src={data.provider.avatarUrl}
                        alt={data.provider.fullName}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User size={18} />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs sm:text-sm text-neutral-900">
                        {data.provider.fullName}
                      </span>
                      {data.provider.verified && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded">
                          <CheckCircle2 size={10} /> Verified
                        </span>
                      )}
                    </div>
                    {data.provider.phoneMasked && (
                      <span className="text-[11px] text-neutral-500 font-mono">
                        Contact: {data.provider.phoneMasked}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-600">
                <span className="font-semibold text-neutral-800">Assigned Provider Matching:</span> A top-rated local technician will be confirmed upon payment authorization.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Method Selector */}
        <Card variant="default" padding="md">
          <CardContent>
            <PaymentMethodSelector
              selectedMethod={selectedMethod}
              onSelectMethod={onSelectMethod}
              disabled={isProcessing}
            />
          </CardContent>
        </Card>

        {/* Security & Buyer Protection Disclosures */}
        <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 text-xs text-emerald-900 flex items-start gap-2.5">
          <ShieldCheck size={18} className="text-emerald-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold block">SevaSetu Service Guarantee</span>
            <p className="text-emerald-800 leading-relaxed">
              Your payment is held safely until the requested service is completed to your satisfaction. Cancel anytime up to 2 hours before scheduled slot for a 100% refund.
            </p>
          </div>
        </div>
      </div>

      {/* Right Column: Price Breakdown & Sticky Action Card */}
      <div className="lg:col-span-5 space-y-4">
        {/* Price Breakdown Component */}
        <PriceBreakdown data={data.pricing} />

        {/* Action Card */}
        <Card variant="default" padding="md" className="space-y-4 bg-neutral-50/50">
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-xs text-neutral-600 pb-2 border-b border-neutral-200">
              <span>Selected Method:</span>
              <span className="font-semibold text-neutral-900 uppercase">
                {selectedMethod.replace(/_/g, ' ')}
              </span>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full text-sm font-semibold shadow-xs"
              leftIcon={<Lock size={15} />}
              isLoading={isProcessing}
              disabled={isProcessing}
              onClick={onProceedToPayment}
            >
              Authorize &amp; Pay {currencySymbol}{data.pricing.totalAmount.toFixed(2)}
            </Button>

            <p className="text-[11px] text-center text-neutral-500 leading-relaxed">
              By authorizing, you agree to SevaSetu Terms of Service, Cancellation Policy, and Fair Trade Standards.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
