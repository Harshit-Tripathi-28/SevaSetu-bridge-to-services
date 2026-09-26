import React, { useState } from 'react';
import { Filter, ShieldCheck } from 'lucide-react';
import { PageContainer } from '../../layouts/PageContainer';
import { PageHeader } from '../../layouts/PageHeader';
import { Alert } from '../../components/ui/Alert';
import { NoRequestsState } from '../../components/provider/ProviderEmptyStates';
import { ProviderRequestCard } from '../../components/provider/ProviderRequestCard';
import type { ProviderRequestItem } from '../../types';

export const ProviderRequestsPage: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'declined'>('pending');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // In this UI/UX foundation phase, requests will be populated by live backend matching in later phases.
  const [requests, setRequests] = useState<ProviderRequestItem[]>([]);

  const handleAccept = (requestId: string) => {
    setActionFeedback(`Request #${requestId} accepted. Real-time scheduling confirmation will be synchronized upon live backend dispatch.`);
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'accepted' } : r))
    );
  };

  const handleDecline = (requestId: string) => {
    setActionFeedback(`Request #${requestId} declined. Task released back to matching pool.`);
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'declined' } : r))
    );
  };

  const filteredRequests = requests.filter((r) => {
    if (filter === 'pending') return r.status === 'new' || r.status === 'pending';
    if (filter === 'accepted') return r.status === 'accepted';
    if (filter === 'declined') return r.status === 'declined';
    return true;
  });

  return (
    <PageContainer maxWidth="xl" className="space-y-6 pb-12">
      <PageHeader
        title="Incoming Service Requests"
        description="Review customer service inquiries, scope of work, requested appointment windows, and accept or decline matching dispatches."
        breadcrumbs={[
          { label: 'Provider Console', href: '/provider' },
          { label: 'Requests' },
        ]}
      />

      {actionFeedback && (
        <Alert variant="info" title="Dispatch Action Feedback" onClose={() => setActionFeedback(null)}>
          {actionFeedback}
        </Alert>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-3">
        <div className="flex items-center gap-1.5 p-1 bg-neutral-100 rounded-lg">
          {(['pending', 'all', 'accepted', 'declined'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all cursor-pointer ${
                filter === tab
                  ? 'bg-white text-neutral-900 shadow-2xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {tab === 'pending' ? 'Pending Action' : tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <Filter size={13} />
          <span>Showing: <strong className="capitalize text-neutral-800">{filter}</strong> requests</span>
        </div>
      </div>

      {/* Request Cards / Empty State */}
      {filteredRequests.length === 0 ? (
        <NoRequestsState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRequests.map((req) => (
            <ProviderRequestCard
              key={req.id}
              request={req}
              onAccept={handleAccept}
              onDecline={handleDecline}
            />
          ))}
        </div>
      )}

      {/* Safety & Protocol Banner */}
      <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-600 flex items-start gap-2.5">
        <ShieldCheck size={16} className="text-emerald-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Customer contact details and precise street location are revealed upon task acceptance to protect customer privacy and prevent unsolicited off-platform contact.
        </p>
      </div>
    </PageContainer>
  );
};
