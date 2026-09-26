import React from 'react';
import { Smartphone, CreditCard, Building2, Banknote, ShieldCheck } from 'lucide-react';
import type { PaymentMethodType, PaymentMethodOption } from '../../types';
import { cn } from '../../lib/utils';

export interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethodType;
  onSelectMethod: (method: PaymentMethodType) => void;
  options?: PaymentMethodOption[];
  disabled?: boolean;
}

const DEFAULT_PAYMENT_METHODS: PaymentMethodOption[] = [
  {
    id: 'upi',
    type: 'upi',
    title: 'UPI (Instant App Payment)',
    subtitle: 'Google Pay, PhonePe, Paytm, BHIM or any UPI VPA',
    isAvailable: true,
    notes: 'Zero transaction fee, immediate booking guarantee',
  },
  {
    id: 'card',
    type: 'card',
    title: 'Credit / Debit Cards',
    subtitle: 'Visa, MasterCard, RuPay & Diners Club',
    isAvailable: true,
    notes: 'Secured via 256-bit SSL encrypted gateway',
  },
  {
    id: 'netbanking',
    type: 'netbanking',
    title: 'Net Banking',
    subtitle: 'State Bank of India, HDFC, ICICI, Axis and 50+ Banks',
    isAvailable: true,
    notes: 'Direct account authorization',
  },
  {
    id: 'cash_after_service',
    type: 'cash_after_service',
    title: 'Pay After Service (Cash / QR on-site)',
    subtitle: 'Settle directly with provider after job verification',
    isAvailable: true,
    notes: 'Inspect completed work before handing over payment',
  },
];

const getMethodIcon = (type: PaymentMethodType) => {
  switch (type) {
    case 'upi':
      return <Smartphone size={18} className="text-primary-600 shrink-0" />;
    case 'card':
      return <CreditCard size={18} className="text-primary-600 shrink-0" />;
    case 'netbanking':
      return <Building2 size={18} className="text-primary-600 shrink-0" />;
    case 'cash_after_service':
      return <Banknote size={18} className="text-emerald-600 shrink-0" />;
    default:
      return <CreditCard size={18} className="text-neutral-500 shrink-0" />;
  }
};

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  onSelectMethod,
  options = DEFAULT_PAYMENT_METHODS,
  disabled = false,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-neutral-900">
          Select Payment Method
        </label>
        <span className="text-xs text-neutral-500 flex items-center gap-1">
          <ShieldCheck size={13} className="text-emerald-600" />
          <span>PCI-DSS Secured</span>
        </span>
      </div>

      <div className="space-y-2.5" role="radiogroup" aria-label="Payment method selection">
        {options.map((option) => {
          const isSelected = selectedMethod === option.type;

          return (
            <div
              key={option.id}
              role="radio"
              aria-checked={isSelected}
              tabIndex={disabled || !option.isAvailable ? -1 : 0}
              onClick={() => {
                if (!disabled && option.isAvailable) {
                  onSelectMethod(option.type);
                }
              }}
              onKeyDown={(e) => {
                if ((e.key === ' ' || e.key === 'Enter') && !disabled && option.isAvailable) {
                  e.preventDefault();
                  onSelectMethod(option.type);
                }
              }}
              className={cn(
                'relative flex items-start gap-3.5 p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer select-none',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                isSelected
                  ? 'border-neutral-900 bg-neutral-900/5 shadow-xs'
                  : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50/50',
                (!option.isAvailable || disabled) && 'opacity-50 cursor-not-allowed pointer-events-none'
              )}
            >
              {/* Radio Circle Indicator */}
              <div
                className={cn(
                  'mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors',
                  isSelected
                    ? 'border-neutral-900 bg-neutral-900'
                    : 'border-neutral-300 bg-white'
                )}
              >
                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>

              {/* Method Icon */}
              <div className="mt-0.5">{getMethodIcon(option.type)}</div>

              {/* Method Text Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-sm text-neutral-900">
                    {option.title}
                  </span>
                  {option.type === 'upi' && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary-100 text-primary-800">
                      Popular
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-600 mt-0.5">{option.subtitle}</p>
                {option.notes && (
                  <p className="text-[11px] text-neutral-500 mt-1 font-mono">{option.notes}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-neutral-500 pt-1">
        * Payment gateway integration is prepared for RBI-compliant tokenized payment processors. No card credentials are stored locally.
      </p>
    </div>
  );
};
