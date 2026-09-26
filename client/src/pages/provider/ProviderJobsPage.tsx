import React, { useState } from 'react';
import { Filter } from 'lucide-react';
import { PageContainer } from '../../layouts/PageContainer';
import { PageHeader } from '../../layouts/PageHeader';
import { NoJobsState } from '../../components/provider/ProviderEmptyStates';
import { ProviderJobCard } from '../../components/provider/ProviderJobCard';
import type { ProviderJobItem } from '../../types';

export const ProviderJobsPage: React.FC = () => {
  const [filter, setFilter] = useState<'upcoming' | 'active' | 'completed' | 'cancelled' | 'all'>('upcoming');

  // Honest state: jobs array will be populated by confirmed bookings from the backend in subsequent phases.
  const [jobs] = useState<ProviderJobItem[]>([]);

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
        title="Jobs &amp; Dispatch Schedule"
        description="Track active on-site service appointments, manage upcoming dispatches, and log completed client handovers."
        breadcrumbs={[
          { label: 'Provider Console', href: '/provider' },
          { label: 'Jobs' },
        ]}
      />

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

      {/* Jobs Feed / Honest Empty State */}
      {filteredJobs.length === 0 ? (
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
