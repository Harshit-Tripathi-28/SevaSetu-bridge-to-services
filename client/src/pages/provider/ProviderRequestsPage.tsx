import React, { useState, useEffect } from 'react';
import { Filter, ShieldCheck, RefreshCw } from 'lucide-react';
import { PageContainer } from '../../layouts/PageContainer';
import { PageHeader } from '../../layouts/PageHeader';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { NoRequestsState } from '../../components/provider/ProviderEmptyStates';
import { ProviderRequestCard } from '../../components/provider/ProviderRequestCard';
import { bookingService } from '../../services/booking.service';
import type { ProviderRequestItem } from '../../types';
import type { BookingRecord } from '@sevasetu/shared';

export const ProviderRequestsPage: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'declined'>('pending');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [requests, setRequests] = useState<ProviderRequestItem[]>([]);

  const loadRequests = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await bookingService.getProviderBookings({ limit: 50 });
      const mapped = (res.bookings || []).map((b: BookingRecord) => {
        let status: ProviderRequestItem['status'] = 'pending';
        if (b.status === 'PENDING_PROVIDER') status = 'pending';
        else if (b.status === 'ACCEPTED' || b.status === 'SCHEDULED' || b.status === 'ON_THE_WAY' || b.status === 'ARRIVED' || b.status === 'IN_PROGRESS' || b.status === 'COMPLETED') status = 'accepted';
        else if (b.status === 'DECLINED') status = 'declined';
        else if (b.status === 'CANCELLED' || b.status === 'EXPIRED') status = 'cancelled';

        const clientName = b.customerSnapshot?.fullName || b.customer?.fullName || 'Client';
        const contactMasked = b.status === 'PENDING_PROVIDER' ? `${clientName.charAt(0)}. (Verified Client)` : clientName;

        return {
          id: b.id,
          serviceTitle: b.serviceTitleSnapshot || b.service?.title || 'Service Request',
          category: b.service?.category?.name || 'General',
          customerSummary: b.serviceRequest?.description || b.notes || 'Service requested by customer.',
          requestedDate: b.scheduledDate,
          requestedTime: `${b.scheduledStartTime} – ${b.scheduledEndTime}`,
          duration: `${b.durationHours} Hours`,
          locationSummary: `${b.locationSnapshot.flatNumber}, ${b.locationSnapshot.streetArea}, ${b.locationSnapshot.city} (${b.locationSnapshot.postalCode})`,
          instructions: b.notes || undefined,
          status,
          createdAt: b.createdAt,
          estimatedPrice: b.priceSnapshot || undefined,
          contactMasked,
        };
      });
      setRequests(mapped);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load requests';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleAccept = async (requestId: string) => {
    setErrorMessage(null);
    setActionFeedback(null);
    try {
      await bookingService.acceptBooking(requestId, 'Accepted by service specialist.');
      setActionFeedback(`Request #${requestId} successfully accepted and scheduled.`);
      await loadRequests();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to accept booking';
      setErrorMessage(msg);
    }
  };

  const handleDecline = async (requestId: string) => {
    setErrorMessage(null);
    setActionFeedback(null);
    try {
      await bookingService.declineBooking(requestId, 'Provider unavailable for requested slot.');
      setActionFeedback(`Request #${requestId} declined and released.`);
      await loadRequests();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to decline booking';
      setErrorMessage(msg);
    }
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
        actions={
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />}
            onClick={loadRequests}
            disabled={isLoading}
            className="text-xs h-8"
          >
            Refresh
          </Button>
        }
      />

      {actionFeedback && (
        <Alert variant="success" title="Success" onClose={() => setActionFeedback(null)}>
          {actionFeedback}
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="error" title="Action Error" onClose={() => setErrorMessage(null)}>
          {errorMessage}
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
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-48 rounded-xl bg-neutral-100 animate-pulse" />
          <div className="h-48 rounded-xl bg-neutral-100 animate-pulse" />
        </div>
      ) : filteredRequests.length === 0 ? (
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

