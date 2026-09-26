import React, { useRef } from 'react';
import {
  Printer,
  Share2,
  Building,
  User,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { PaymentStatusBadge } from './PaymentStatusBadge';
import type { InvoiceData } from '../../types';

export interface InvoiceViewProps {
  invoice: InvoiceData;
  onShare?: () => void;
}

export const InvoiceView: React.FC<InvoiceViewProps> = ({ invoice, onShare }) => {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const currencySymbol = invoice.currency || '₹';

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    if (onShare) {
      onShare();
    } else {
      navigator.clipboard?.writeText(window.location.href);
      alert('Invoice link copied to clipboard.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Header (hidden in print) */}
      <div className="print:hidden flex flex-wrap items-center justify-between gap-3 p-4 bg-white rounded-xl border border-neutral-200">
        <div>
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">
            Official Tax Invoice
          </span>
          <span className="font-mono text-sm font-bold text-neutral-900">
            {invoice.invoiceNumber}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Share2 size={13} />}
            onClick={handleCopyLink}
          >
            Share Link
          </Button>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Printer size={13} />}
            onClick={handlePrint}
          >
            Print / Save PDF
          </Button>
        </div>
      </div>

      {/* Printable Invoice Container */}
      <Card
        ref={invoiceRef}
        variant="default"
        padding="none"
        className="bg-white border-neutral-300 shadow-sm print:border-none print:shadow-none max-w-4xl mx-auto"
      >
        <CardContent className="p-6 sm:p-10 space-y-8">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-neutral-200">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white font-bold flex items-center justify-center text-sm">
                  S
                </div>
                <span className="text-xl font-bold tracking-tight text-neutral-900">
                  SevaSetu
                </span>
              </div>
              <p className="text-xs text-neutral-500">
                Bridge to Services Platform Services Pvt. Ltd.
              </p>
              <p className="text-xs text-neutral-500 font-mono">
                GSTIN / Tax ID: 27AABCS1234F1Z8 (Platform Intermediary)
              </p>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <span className="text-xs font-bold uppercase tracking-widest text-neutral-400 block">
                TAX INVOICE
              </span>
              <span className="font-mono font-bold text-lg text-neutral-900 block">
                {invoice.invoiceNumber}
              </span>
              <div className="pt-1">
                <PaymentStatusBadge status={invoice.paymentStatus} />
              </div>
            </div>
          </div>

          {/* Dates & Reference Meta */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-neutral-50 text-xs text-neutral-600">
            <div>
              <span className="text-neutral-400 block text-[11px] uppercase">Invoice Date</span>
              <span className="font-medium text-neutral-900 font-mono">{invoice.issueDate}</span>
            </div>
            <div>
              <span className="text-neutral-400 block text-[11px] uppercase">Service Date</span>
              <span className="font-medium text-neutral-900 font-mono">{invoice.serviceDate}</span>
            </div>
            <div>
              <span className="text-neutral-400 block text-[11px] uppercase">Booking Ref</span>
              <span className="font-medium text-neutral-900 font-mono">
                {invoice.bookingReference || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-neutral-400 block text-[11px] uppercase">Payment Mode</span>
              <span className="font-medium text-neutral-900 uppercase">
                {invoice.paymentMethodMasked || 'Verified Channel'}
              </span>
            </div>
          </div>

          {/* Parties Grid: Customer & Service Provider */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            {/* Customer Details */}
            <div className="space-y-1.5 p-4 rounded-xl border border-neutral-100 bg-neutral-50/50 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-neutral-900 pb-1 border-b border-neutral-200">
                <User size={13} className="text-neutral-500" />
                <span>Billed To (Client)</span>
              </div>
              <p className="font-bold text-neutral-900 text-sm">{invoice.customerInfo.nameMasked}</p>
              {invoice.customerInfo.addressSummary && (
                <p className="text-neutral-600 leading-relaxed">
                  {invoice.customerInfo.addressSummary}
                </p>
              )}
              {invoice.customerInfo.phoneMasked && (
                <p className="text-neutral-500 font-mono">
                  Phone: {invoice.customerInfo.phoneMasked}
                </p>
              )}
            </div>

            {/* Provider Details */}
            <div className="space-y-1.5 p-4 rounded-xl border border-neutral-100 bg-neutral-50/50 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-neutral-900 pb-1 border-b border-neutral-200">
                <Building size={13} className="text-neutral-500" />
                <span>Service Partner</span>
              </div>
              <p className="font-bold text-neutral-900 text-sm">{invoice.providerInfo.nameMasked}</p>
              {invoice.providerInfo.tradeOrRole && (
                <p className="text-neutral-600">
                  Trade: {invoice.providerInfo.tradeOrRole}
                </p>
              )}
              {invoice.providerInfo.taxRegistrationMasked && (
                <p className="text-neutral-500 font-mono">
                  Partner Tax ID: {invoice.providerInfo.taxRegistrationMasked}
                </p>
              )}
              <div className="pt-1 flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                <ShieldCheck size={13} />
                <span>Verified Independent Service Partner</span>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Service Particulars
            </h4>
            <div className="border border-neutral-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-neutral-50 text-neutral-600 border-b border-neutral-200">
                  <tr>
                    <th scope="col" className="py-2.5 px-4 font-semibold">Description</th>
                    <th scope="col" className="py-2.5 px-4 font-semibold text-center w-20">Qty / Unit</th>
                    <th scope="col" className="py-2.5 px-4 font-semibold text-right w-28">Rate</th>
                    <th scope="col" className="py-2.5 px-4 font-semibold text-right w-32">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {invoice.lineItems.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3 px-4 text-neutral-900 font-medium">
                        {item.description}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-neutral-600">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-neutral-600">
                        {currencySymbol}{item.unitPrice.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-medium text-neutral-900">
                        {currencySymbol}{item.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Subtotals & Final Financial Breakdown */}
          <div className="flex flex-col sm:flex-row justify-between gap-6 pt-2">
            <div className="text-xs text-neutral-500 max-w-sm space-y-1">
              <span className="font-semibold text-neutral-700 block">Terms &amp; Disclosures</span>
              <p className="leading-relaxed">
                This document serves as an electronic tax invoice for local home and trade services booked through SevaSetu Platform. All applicable statutory taxes and convenience fees are included as displayed.
              </p>
            </div>

            <div className="w-full sm:w-72 space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal:</span>
                <span className="font-mono text-neutral-900">{currencySymbol}{invoice.subtotal.toFixed(2)}</span>
              </div>

              {invoice.platformFees !== undefined && (
                <div className="flex justify-between text-neutral-600">
                  <span>Platform &amp; Safety Fee:</span>
                  <span className="font-mono text-neutral-900">+{currencySymbol}{invoice.platformFees.toFixed(2)}</span>
                </div>
              )}

              {invoice.taxes !== undefined && (
                <div className="flex justify-between text-neutral-600">
                  <span>Statutory GST / Taxes:</span>
                  <span className="font-mono text-neutral-900">+{currencySymbol}{invoice.taxes.toFixed(2)}</span>
                </div>
              )}

              {invoice.discount !== undefined && invoice.discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Discount Applied:</span>
                  <span className="font-mono">-{currencySymbol}{invoice.discount.toFixed(2)}</span>
                </div>
              )}

              <div className="pt-2 border-t border-neutral-300 flex justify-between font-bold text-base text-neutral-900">
                <span>Invoice Total:</span>
                <span className="font-mono">{currencySymbol}{invoice.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Authenticity Watermark / Signature */}
          <div className="pt-6 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-neutral-400 gap-2">
            <div className="flex items-center gap-1.5 text-neutral-600">
              <CheckCircle2 size={13} className="text-emerald-600" />
              <span>Digitally authenticated through SevaSetu Financial Clearing</span>
            </div>
            <span>Page 1 of 1</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
