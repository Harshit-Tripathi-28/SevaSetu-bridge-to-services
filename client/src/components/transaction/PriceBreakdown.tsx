import React from 'react';
import { Tag, Info, Receipt } from 'lucide-react';
import type { PriceBreakdownData } from '../../types';
import { cn } from '../../lib/utils';

export interface PriceBreakdownProps {
  data: PriceBreakdownData;
  className?: string;
  compact?: boolean;
}

export const PriceBreakdown: React.FC<PriceBreakdownProps> = ({
  data,
  className,
  compact = false,
}) => {
  const currencySymbol = data.currency || '₹';

  return (
    <div
      className={cn(
        'rounded-xl border border-neutral-200 bg-white overflow-hidden',
        compact ? 'p-3 text-xs' : 'p-4 sm:p-5 text-sm',
        className
      )}
    >
      <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-3">
        <div className="flex items-center gap-1.5 font-semibold text-neutral-900">
          <Receipt size={compact ? 14 : 16} className="text-neutral-500" />
          <span>Fare &amp; Price Breakdown</span>
        </div>
        <span className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
          Model: {data.pricingModel.replace('_', ' ')}
        </span>
      </div>

      <div className="space-y-2 text-neutral-600">
        {/* Base Service Amount */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span>Base Service Rate</span>
            {data.quantityOrDuration && (
              <span className="text-neutral-400 text-xs">({data.quantityOrDuration})</span>
            )}
          </div>
          <span className="font-mono text-neutral-900 font-medium">
            {currencySymbol}{data.baseAmount.toFixed(2)}
          </span>
        </div>

        {/* Additional Charges / Fees (if provided) */}
        {data.additionalFees && data.additionalFees.length > 0 && (
          <>
            {data.additionalFees.map((fee) => (
              <div key={fee.id} className="flex items-center justify-between text-xs sm:text-sm">
                <span className="flex items-center gap-1">
                  <span>{fee.label}</span>
                  {fee.description && (
                    <span title={fee.description} className="text-neutral-400 cursor-help">
                      <Info size={12} />
                    </span>
                  )}
                </span>
                <span className="font-mono text-neutral-800">
                  {fee.isDeduction ? '-' : '+'}{currencySymbol}{fee.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </>
        )}

        {/* Taxes (if provided by data) */}
        {data.taxes && data.taxes.length > 0 && (
          <>
            {data.taxes.map((tax, index) => (
              <div key={index} className="flex items-center justify-between text-xs sm:text-sm text-neutral-500">
                <span>
                  {tax.label}
                  {tax.ratePercent !== undefined ? ` (${tax.ratePercent}%)` : ''}
                </span>
                <span className="font-mono text-neutral-800">
                  +{currencySymbol}{tax.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </>
        )}

        {/* Discounts (if provided by data) */}
        {data.discounts && data.discounts.length > 0 && (
          <>
            {data.discounts.map((discount, index) => (
              <div key={index} className="flex items-center justify-between text-xs sm:text-sm text-emerald-700 font-medium">
                <span className="flex items-center gap-1">
                  <Tag size={12} />
                  <span>{discount.label} ({discount.code})</span>
                </span>
                <span className="font-mono">
                  -{currencySymbol}{discount.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Total Amount */}
      <div className="pt-3 mt-3 border-t border-neutral-200 flex items-center justify-between">
        <div>
          <span className="font-bold text-neutral-900 block leading-tight">
            Total Payable
          </span>
          <span className="text-[11px] text-neutral-500">
            Inclusive of all taxes &amp; verified trade fees
          </span>
        </div>
        <div className="text-right">
          <span className="font-mono font-bold text-lg sm:text-xl text-neutral-900">
            {currencySymbol}{data.totalAmount.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};
