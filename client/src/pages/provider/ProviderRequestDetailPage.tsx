import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Check,
  X,
  MessageSquare,
  Tag,
  ShieldCheck,
  ArrowLeft,
  Info,
} from 'lucide-react';
import { PageContainer } from '../../layouts/PageContainer';
import { PageHeader } from '../../layouts/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { RequestStatusBadge } from '../../components/provider/ProviderStatusBadge';
import type { ProviderRequestItem } from '../../types';

export const ProviderRequestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  // In this foundation phase, we represent the request structure based on the URL ID
  // without fabricating false production customer records.
  const [requestStatus, setRequestStatus] = useState<'pending' | 'accepted' | 'declined'>('pending');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [quoteAmount, setQuoteAmount] = useState<string>('450');

  const requestRef = id || 'REQ-SAMPLE';

  const sampleRequestData: ProviderRequestItem = {
    id: requestRef,
    serviceTitle: 'Ceiling Fan Installation & Switchboard Check',
    category: 'Electrical',
    customerSummary: 'I need a qualified electrician to install a new ceiling fan in the master bedroom and inspect an intermittent socket switchboard in the hallway.',
    requestedDate: '2026-09-28',
    requestedTime: '10:00 AM – 01:00 PM',
    duration: '1–2 Hours',
    locationSummary: 'Flat 402, Block B, Sector 62, Noida (201301)',
    instructions: 'Ring buzzer at main security gate, service elevator available. Master bedroom has fan hook ready.',
    status: requestStatus,
    createdAt: '2026-09-26T10:30:00Z',
    estimatedPrice: 450,
  };

  const handleAccept = () => {
    setRequestStatus('accepted');
    setFeedback(`Request #${requestRef} accepted. Client notification dispatch will be synchronized upon live backend integration.`);
  };

  const handleDecline = () => {
    setRequestStatus('declined');
    setFeedback(`Request #${requestRef} declined. This task has been released from your matching queue.`);
  };

  return (
    <PageContainer maxWidth="lg" className="space-y-6 pb-12">
      <PageHeader
        title={`Request Details #${requestRef}`}
        description="Comprehensive task parameters, customer instructions, schedule requirements, and quote submission."
        breadcrumbs={[
          { label: 'Provider Console', href: '/provider' },
          { label: 'Requests', href: '/provider/requests' },
          { label: `#${requestRef}` },
        ]}
        actions={
          <Link to="/provider/requests">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft size={14} />}>
              Back to Requests
            </Button>
          </Link>
        }
      />

      {feedback && (
        <Alert variant="info" title="Status Update" onClose={() => setFeedback(null)}>
          {feedback}
        </Alert>
      )}

      {/* Main Request Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Core Need & Parameters */}
        <div className="lg:col-span-8 space-y-6">
          <Card variant="default" padding="md" className="bg-white space-y-4">
            <CardHeader className="pb-3 border-b border-neutral-100">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge variant="info" size="sm">{sampleRequestData.category}</Badge>
                <RequestStatusBadge status={sampleRequestData.status} />
              </div>
              <CardTitle className="text-lg pt-1">{sampleRequestData.serviceTitle}</CardTitle>
              <CardDescription>Requested on {new Date(sampleRequestData.createdAt).toLocaleDateString()}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 text-xs text-neutral-700">
              {/* Customer Need Statement */}
              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 block">
                  Customer Requirement Summary
                </span>
                <p className="text-neutral-900 font-medium text-sm leading-relaxed">
                  "{sampleRequestData.customerSummary}"
                </p>
              </div>

              {/* Schedule and Timing */}
              <div className="p-4 rounded-xl border border-neutral-200/80 space-y-2">
                <span className="font-semibold text-neutral-800 text-xs uppercase tracking-wider block">
                  Schedule &amp; Arrival Window
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-neutral-400" />
                    <span className="font-medium text-neutral-900">{sampleRequestData.requestedDate}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <Clock size={14} className="text-neutral-400" />
                    <span>{sampleRequestData.requestedTime} ({sampleRequestData.duration})</span>
                  </div>
                </div>
              </div>

              {/* Location Summary */}
              <div className="p-4 rounded-xl border border-neutral-200/80 space-y-2">
                <span className="font-semibold text-neutral-800 text-xs uppercase tracking-wider block">
                  Service Address &amp; Sector
                </span>
                <div className="flex items-start gap-2 pt-1">
                  <MapPin size={14} className="text-neutral-400 shrink-0 mt-0.5" />
                  <p className="font-medium text-neutral-900 leading-snug">
                    {sampleRequestData.locationSummary}
                  </p>
                </div>
              </div>

              {/* Customer Instructions */}
              {sampleRequestData.instructions && (
                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-1">
                  <span className="font-semibold text-amber-900 text-xs block">
                    Access &amp; Entry Instructions
                  </span>
                  <p className="text-neutral-800 text-xs leading-relaxed">
                    {sampleRequestData.instructions}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Trust and Safety Banner */}
          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-600 flex items-start gap-2.5">
            <ShieldCheck size={16} className="text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-neutral-800">Platform Safety &amp; On-Site Conduct</p>
              <p className="leading-relaxed">
                Always carry valid government identification and wear company ID badges. Full payment must be handled through SevaSetu to guarantee service warranty and liability coverage.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing & Actions */}
        <div className="lg:col-span-4 space-y-6">
          {/* Action Decision Card */}
          <Card variant="default" padding="md" className="bg-white space-y-4">
            <CardHeader className="pb-3 border-b border-neutral-100">
              <CardTitle className="text-base">Dispatch Actions</CardTitle>
              <CardDescription>
                Decide whether to accept, adjust quote, or decline this inquiry.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Quote Adjustment Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-neutral-800">
                  Proposed Service Fee (₹)
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      value={quoteAmount}
                      onChange={(e) => setQuoteAmount(e.target.value)}
                      className="w-full h-10 pl-8 pr-3 bg-white border border-neutral-300 rounded-lg text-sm font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
                      aria-label="Quote amount"
                    />
                    <Tag size={14} className="absolute left-2.5 top-3 text-neutral-400" />
                  </div>
                </div>
                <p className="text-[11px] text-neutral-500">
                  Standard baseline rate for this category is ₹450.
                </p>
              </div>

              {/* Action Buttons */}
              {sampleRequestData.status === 'pending' ? (
                <div className="space-y-2 pt-2">
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full"
                    leftIcon={<Check size={16} />}
                    onClick={handleAccept}
                  >
                    Accept &amp; Schedule
                  </Button>

                  <Button
                    variant="outline"
                    size="md"
                    className="w-full text-rose-700 hover:bg-rose-50 border-rose-200"
                    leftIcon={<X size={16} />}
                    onClick={handleDecline}
                  >
                    Decline Task
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-neutral-600"
                    leftIcon={<MessageSquare size={14} />}
                    onClick={() => {
                      alert('In-app clarification messaging with the customer will connect in subsequent phases.');
                    }}
                  >
                    Request Clarification
                  </Button>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-neutral-100 text-center text-xs text-neutral-600">
                  Status: <strong className="capitalize text-neutral-900">{sampleRequestData.status}</strong>
                </div>
              )}
            </CardContent>

            <CardFooter className="pt-3 border-t border-neutral-100 text-[11px] text-neutral-500 flex items-center gap-1.5">
              <Info size={13} className="shrink-0" />
              <span>Responses are dispatched instantly to customer activity.</span>
            </CardFooter>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
};
