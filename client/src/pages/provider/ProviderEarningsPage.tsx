import React, { useState } from 'react';
import {
  Wallet,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Filter,
} from 'lucide-react';
import { PageContainer } from '../../layouts/PageContainer';
import { PageHeader } from '../../layouts/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { NoEarningsState } from '../../components/provider/ProviderEmptyStates';
import type { ProviderEarningItem } from '../../types';

export const ProviderEarningsPage: React.FC = () => {
  const [filterPeriod, setFilterPeriod] = useState<'this_month' | 'last_month' | 'all'>('this_month');

  // Honest state: earnings records will be synchronized from the real backend settlement pipeline.
  const [earnings] = useState<ProviderEarningItem[]>([]);

  return (
    <PageContainer maxWidth="xl" className="space-y-6 pb-12">
      <PageHeader
        title="Earnings &amp; Settlement Account"
        description="Review job payouts, platform fee breakdown, pending clearing amounts, and scheduled direct bank transfers."
        breadcrumbs={[
          { label: 'Provider Console', href: '/provider' },
          { label: 'Earnings' },
        ]}
        actions={
          <Button
            variant="outline"
            size="sm"
            leftIcon={<ArrowUpRight size={14} />}
            onClick={() => {
              alert('Direct bank account transfer (NEFT/IMPS) configuration will connect in the financial integration phase.');
            }}
          >
            Bank Account Settings
          </Button>
        }
      />

      {/* Structural Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Available Balance */}
        <Card variant="default" padding="md" className="bg-white space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            Available Balance
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-neutral-900 font-mono">₹0.00</span>
          </div>
          <p className="text-[11px] text-neutral-500 pt-1">
            Ready for standard weekly payout transfer.
          </p>
        </Card>

        {/* Pending Clearance */}
        <Card variant="default" padding="md" className="bg-white space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 flex items-center gap-1">
            <Clock size={12} className="text-amber-500" />
            <span>Pending Clearance</span>
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-neutral-900 font-mono">₹0.00</span>
          </div>
          <p className="text-[11px] text-neutral-500 pt-1">
            Under 24-hr post-service customer satisfaction hold.
          </p>
        </Card>

        {/* Total Lifetime Earnings */}
        <Card variant="default" padding="md" className="bg-white space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 flex items-center gap-1">
            <Wallet size={12} className="text-primary-600" />
            <span>Total Disbursed</span>
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-neutral-900 font-mono">₹0.00</span>
          </div>
          <p className="text-[11px] text-neutral-500 pt-1">
            Cumulative settled amount transferred to bank.
          </p>
        </Card>
      </div>

      {/* Payout History & Filtering */}
      <Card variant="default" padding="md" className="bg-white space-y-4">
        <CardHeader className="pb-3 border-b border-neutral-100">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base sm:text-lg">Service Payout History</CardTitle>
            </div>

            <div className="flex items-center gap-2">
              <Filter size={13} className="text-neutral-400" />
              <select
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value as 'this_month' | 'last_month' | 'all')}
                className="h-8 px-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-medium text-neutral-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                aria-label="Filter period"
              >
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {earnings.length === 0 ? (
            <NoEarningsState />
          ) : (
            <div className="divide-y divide-neutral-100">
              {earnings.map((earn) => (
                <div key={earn.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-neutral-900 block">{earn.serviceTitle}</span>
                    <span className="text-[11px] text-neutral-500 font-mono">Date: {earn.date}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-neutral-900 block font-mono">₹{earn.netAmount}</span>
                    <span className="text-[10px] text-neutral-500 uppercase">{earn.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security & Financial Notice */}
      <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-600 flex items-start gap-2.5">
        <ShieldCheck size={16} className="text-emerald-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Payouts are processed directly via verified RBI-compliant settlement channels to your registered IFSC bank account. Platform service commissions (transparently shown on job invoices) are automatically deducted prior to net disbursement.
        </p>
      </div>
    </PageContainer>
  );
};
