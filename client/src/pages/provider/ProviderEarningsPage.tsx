import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Filter,
  Loader2,
  DollarSign,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { PageContainer } from '../../layouts/PageContainer';
import { PageHeader } from '../../layouts/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { NoEarningsState } from '../../components/provider/ProviderEmptyStates';
import { paymentService } from '../../services/payment.service';
import type {
  ProviderFinancialSummary,
  ProviderEarningRecord,
  ProviderPayoutRecord,
} from '@sevasetu/shared';

export const ProviderEarningsPage: React.FC = () => {
  const [filterPeriod, setFilterPeriod] = useState<'this_month' | 'last_month' | 'all'>('this_month');
  const [summary, setSummary] = useState<ProviderFinancialSummary | null>(null);
  const [earnings, setEarnings] = useState<ProviderEarningRecord[]>([]);
  const [payouts, setPayouts] = useState<ProviderPayoutRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Payout request modal state
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmountRupees, setPayoutAmountRupees] = useState('');
  const [requestingPayout, setRequestingPayout] = useState(false);
  const [payoutSuccessMsg, setPayoutSuccessMsg] = useState<string | null>(null);

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const [sum, earn, po] = await Promise.all([
        paymentService.getProviderEarningsSummary(),
        paymentService.getProviderEarnings(),
        paymentService.getProviderPayouts(),
      ]);
      setSummary(sum);
      setEarnings(earn);
      setPayouts(po);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load earnings records.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinancialData();
  }, []);

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary) return;

    const amountRupees = parseFloat(payoutAmountRupees);
    if (isNaN(amountRupees) || amountRupees <= 0) {
      alert('Please enter a valid payout amount.');
      return;
    }

    const amountPaise = Math.round(amountRupees * 100);
    if (amountPaise > summary.availableBalance) {
      alert(`Amount exceeds available balance of ₹${(summary.availableBalance / 100).toFixed(2)}.`);
      return;
    }

    try {
      setRequestingPayout(true);
      setPayoutSuccessMsg(null);
      await paymentService.requestPayout(amountPaise);
      setPayoutSuccessMsg(`Payout request of ₹${amountRupees.toFixed(2)} submitted successfully.`);
      setPayoutAmountRupees('');
      setShowPayoutModal(false);
      await loadFinancialData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to request payout.';
      alert(msg);
    } finally {
      setRequestingPayout(false);
    }
  };

  const availableRupees = (summary?.availableBalance || 0) / 100;
  const pendingRupees = (summary?.pendingBalance || 0) / 100;
  const disbursedRupees = (summary?.disbursedTotal || 0) / 100;
  const grossRupees = (summary?.totalGrossEarnings || 0) / 100;

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
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<DollarSign size={14} />}
              onClick={() => setShowPayoutModal(true)}
              disabled={availableRupees <= 0}
            >
              Request Payout
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ArrowUpRight size={14} />}
              onClick={() => {
                alert('Bank transfer details can be reviewed in your profile and provider settings.');
              }}
            >
              Bank Settings
            </Button>
          </div>
        }
      />

      {payoutSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{payoutSuccessMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
          <AlertCircle size={16} className="text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center space-y-3">
          <Loader2 className="animate-spin mx-auto text-primary-600" size={32} />
          <p className="text-xs text-neutral-500 font-medium">Synchronizing provider earnings ledger...</p>
        </div>
      ) : (
        <>
          {/* Structural Balance Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {/* Available Balance */}
            <Card variant="default" padding="md" className="bg-white space-y-1 border-primary-200">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                Available Balance
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-primary-900 font-mono">
                  ₹{availableRupees.toFixed(2)}
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 pt-1">
                Eligible for immediate withdrawal.
              </p>
            </Card>

            {/* Pending Clearance */}
            <Card variant="default" padding="md" className="bg-white space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 flex items-center gap-1">
                <Clock size={12} className="text-amber-500" />
                <span>Pending Clearance</span>
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-neutral-900 font-mono">
                  ₹{pendingRupees.toFixed(2)}
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 pt-1">
                Under service review or clearing hold.
              </p>
            </Card>

            {/* Total Lifetime Gross */}
            <Card variant="default" padding="md" className="bg-white space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 flex items-center gap-1">
                <Wallet size={12} className="text-neutral-600" />
                <span>Gross Revenue</span>
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-neutral-900 font-mono">
                  ₹{grossRupees.toFixed(2)}
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 pt-1">
                Across {summary?.completedJobsCount || 0} completed jobs.
              </p>
            </Card>

            {/* Total Disbursed */}
            <Card variant="default" padding="md" className="bg-white space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 flex items-center gap-1">
                <CheckCircle2 size={12} className="text-emerald-600" />
                <span>Total Disbursed</span>
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-neutral-900 font-mono">
                  ₹{disbursedRupees.toFixed(2)}
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 pt-1">
                Settled to your registered bank account.
              </p>
            </Card>
          </div>

          {/* Earnings Ledger Table */}
          <Card variant="default" padding="md" className="bg-white space-y-4">
            <CardHeader className="pb-3 border-b border-neutral-100">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base sm:text-lg">Service Earnings Ledger</CardTitle>
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
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-neutral-50 text-neutral-600 uppercase text-[10px] tracking-wider border-b border-neutral-200">
                      <tr>
                        <th className="py-2.5 px-3">Service / Booking</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Gross</th>
                        <th className="py-2.5 px-3">Platform Fee (10%)</th>
                        <th className="py-2.5 px-3">Net Earning</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {earnings.map((earn) => (
                        <tr key={earn.id} className="hover:bg-neutral-50/50">
                          <td className="py-3 px-3">
                            <span className="font-semibold text-neutral-900 block">
                              {earn.booking?.serviceTitleSnapshot || 'Service Execution'}
                            </span>
                            <span className="text-[11px] text-neutral-500 font-mono">
                              #{earn.booking?.referenceCode || earn.bookingId.slice(0, 8)}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-neutral-600">
                            {new Date(earn.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="py-3 px-3 font-mono font-medium text-neutral-700">
                            ₹{(earn.grossAmount / 100).toFixed(2)}
                          </td>
                          <td className="py-3 px-3 font-mono text-red-600">
                            -₹{(earn.platformFee / 100).toFixed(2)}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-emerald-700">
                            ₹{(earn.netEarning / 100).toFixed(2)}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                earn.status === 'AVAILABLE'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : earn.status === 'PENDING'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-neutral-100 text-neutral-700'
                              }`}
                            >
                              {earn.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payout History Table */}
          {payouts.length > 0 && (
            <Card variant="default" padding="md" className="bg-white space-y-4">
              <CardHeader className="pb-3 border-b border-neutral-100">
                <CardTitle className="text-base sm:text-lg">Recent Payout Disbursements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-neutral-50 text-neutral-600 uppercase text-[10px] tracking-wider border-b border-neutral-200">
                      <tr>
                        <th className="py-2.5 px-3">Payout Reference</th>
                        <th className="py-2.5 px-3">Requested At</th>
                        <th className="py-2.5 px-3">Amount</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {payouts.map((po) => (
                        <tr key={po.id} className="hover:bg-neutral-50/50">
                          <td className="py-3 px-3 font-mono font-medium text-neutral-900">
                            {po.payoutReference}
                          </td>
                          <td className="py-3 px-3 text-neutral-600">
                            {new Date(po.requestedAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-neutral-900">
                            ₹{(po.amount / 100).toFixed(2)}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                po.status === 'PAID'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : po.status === 'PROCESSING' || po.status === 'PENDING'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {po.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security & Financial Notice */}
          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-600 flex items-start gap-2.5">
            <ShieldCheck size={16} className="text-emerald-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Payouts are processed directly via verified RBI-compliant settlement channels to your registered IFSC bank account. Platform service commissions (transparently shown on job invoices) are automatically deducted prior to net disbursement.
            </p>
          </div>
        </>
      )}

      {/* Payout Request Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-neutral-900">Request Bank Payout</h3>
            <p className="text-xs text-neutral-600">
              Transfer funds from your available balance directly to your registered bank account.
            </p>
            <form onSubmit={handleRequestPayout} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Payout Amount (INR) — Available: ₹{availableRupees.toFixed(2)}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-neutral-500 font-bold">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max={availableRupees}
                    value={payoutAmountRupees}
                    onChange={(e) => setPayoutAmountRupees(e.target.value)}
                    required
                    placeholder="e.g. 500.00"
                    className="w-full pl-7 pr-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-1 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPayoutModal(false)}
                  disabled={requestingPayout}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={requestingPayout || availableRupees <= 0}
                  leftIcon={requestingPayout ? <Loader2 className="animate-spin" size={14} /> : undefined}
                >
                  {requestingPayout ? 'Submitting...' : 'Confirm Payout'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
};
