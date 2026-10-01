import React, { useState, useEffect } from 'react';
import { Filter, RefreshCw, AlertCircle } from 'lucide-react';
import { PageContainer } from '../../layouts/PageContainer';
import { PageHeader } from '../../layouts/PageHeader';
import { NoJobsState } from '../../components/provider/ProviderEmptyStates';
import { ProviderJobCard } from '../../components/provider/ProviderJobCard';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { bookingService } from '../../services/booking.service';
import type { ProviderJobItem, ProviderJobStatus } from '../../types';
import type { BookingRecord } from '@sevasetu/shared';

function mapBookingToJobItem(b: BookingRecord): ProviderJobItem {
  let mappedStatus: ProviderJobStatus = 'scheduled';
  if (b.status === 'SCHEDULED' || b.status === 'ACCEPTED') mappedStatus = 'scheduled';
  else if (b.status === 'ON_THE_WAY') mappedStatus = 'on_the_way';
  else if (b.status === 'ARRIVED') mappedStatus = 'arrived';
  else if (b.status === 'IN_PROGRESS') mappedStatus = 'in_progress';
  else if (b.status === 'COMPLETED') mappedStatus = 'completed';
  else if (b.status === 'CANCELLED') mappedStatus = 'cancelled';

  const loc = b.locationSnapshot
    ? `${b.locationSnapshot.flatNumber}, ${b.locationSnapshot.streetArea}, ${b.locationSnapshot.city}`
    : 'Customer Address';

  const customerName =
    b.customerSnapshot?.fullName ||
    b.customer?.fullName ||
    'Verified Client';

  return {
    id: b.id,
    requestId: b.referenceCode || b.id,
    serviceTitle: b.serviceTitleSnapshot || b.service?.title || 'Service',
    category: b.service?.category?.name || 'General',
    customerNameMasked: customerName,
    location: loc,
    scheduledDate: b.scheduledDate,
    scheduledTime: `${b.scheduledStartTime} – ${b.scheduledEndTime}`,
    duration: `${b.durationHours} ${b.durationHours === 1 ? 'Hour' : 'Hours'}`,
    status: mappedStatus,
    price: b.priceSnapshot ?? undefined,
    timeline: (b.statusHistory || []).map((h) => ({
      status: (h.newStatus === 'SCHEDULED' || h.newStatus === 'ACCEPTED'
        ? 'scheduled'
        : h.newStatus.toLowerCase()) as ProviderJobStatus,
      label: h.newStatus.replace(/_/g, ' '),
      timestamp: new Date(h.createdAt).toLocaleString(),
      note: h.reason || undefined,
    })),
    workNotes: b.notes || undefined,
  };
}

export const ProviderJobsPage: React.FC = () => {
  const [filter, setFilter] = useState<'upcoming' | 'active' | 'completed' | 'cancelled' | 'all'>('upcoming');
  const [jobs, setJobs] = useState<ProviderJobItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchJobs = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      // Exclude pure pending requests from the job board (those belong in requests page)
      const res = await bookingService.getProviderBookings({ limit: 50 });
      const nonRequestBookings = (res.bookings || []).filter(
        (b) => b.status !== 'PENDING_PROVIDER' && b.status !== 'DECLINED'
      );
      setJobs(nonRequestBookings.map(mapBookingToJobItem));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load dispatch jobs';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const filteredJobs = jobs.filter((job) => {
    if (filter === 'upcoming') return job.status === 'scheduled';
    if (filter === 'active') return job.status === 'on_the_way' || job.status === 'arrived' || job.status === 'in_progress';
    if (filter === 'completed') return job.status === 'completed';
    if (filter === 'cancelled') return job.status === 'cancelled';
    return true;
  });

  return (
    <PageContainer maxWidth="xl" className="space-y-6 pb-12">
      <PageHeader
        title="Jobs & Dispatch Schedule"
        description="Track active on-site service appointments, manage upcoming dispatches, and log completed client handovers."
        breadcrumbs={[
          { label: 'Provider Console', href: '/provider' },
          { label: 'Jobs' },
        ]}
        actions={
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />}
            onClick={fetchJobs}
            disabled={isLoading}
          >
            Refresh Jobs
          </Button>
        }
      />

      {errorMessage && (
        <Alert variant="error" title="Failed to load jobs" onClose={() => setErrorMessage(null)}>
          <div className="flex items-center gap-2">
            <AlertCircle size={15} />
            <span>{errorMessage}</span>
          </div>
        </Alert>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-3">
        <div className="flex items-center gap-1.5 p-1 bg-neutral-100 rounded-lg">
          {(['upcoming', 'active', 'completed', 'cancelled', 'all'] as const).map((tab) => (
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
              {tab === 'active' ? 'Active On-Site' : tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <Filter size={13} />
          <span>Filter: <strong className="capitalize text-neutral-800">{filter}</strong></span>
        </div>
      </div>

      {/* Loading Skeleton / Feed / Empty State */}
      {isLoading ? (
        <div className="py-16 text-center space-y-3">
          <RefreshCw size={28} className="animate-spin mx-auto text-primary-600" />
          <p className="text-sm text-neutral-600">Loading jobs from dispatch server...</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <NoJobsState filter={filter} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredJobs.map((job) => (
            <ProviderJobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </PageContainer>
  );
};
