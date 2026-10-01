import React, { useState } from 'react';
import { CalendarClock, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../../ui/EmptyState';
import { Button } from '../../ui/Button';
import { ActivityItemCard } from './ActivityItemCard';
import { cn } from '../../../lib/utils';
import type { CustomerActivityItem, ActivityStatus, PaymentStatus } from '../../../types';

export interface ActivityListProps {
  items?: (CustomerActivityItem & {
    paymentStatus?: PaymentStatus;
    invoiceId?: string;
    hasReviewed?: boolean;
  })[];
  isLoading?: boolean;
  onRebook?: (item: CustomerActivityItem) => void;
  onCancelBooking?: (item: CustomerActivityItem) => void;
  onReschedule?: (item: CustomerActivityItem) => void;
}

type FilterTab = 'all' | ActivityStatus;

export const ActivityList: React.FC<ActivityListProps> = ({
  items = [],
  isLoading = false,
  onRebook,
  onCancelBooking,
  onReschedule,
}) => {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const tabs: { id: FilterTab; label: string }[] = [
    { id: 'all', label: 'All Activity' },
    { id: 'requested', label: 'Requested' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  const filteredItems = items.filter((item) => {
    if (activeTab === 'all') return true;
    return item.status === activeTab;
  });

  return (
    <div className="space-y-6">
      {/* Activity Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-neutral-200 scrollbar-none" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-3.5 py-2 text-xs font-semibold rounded-lg transition-all shrink-0 cursor-pointer select-none',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
              activeTab === tab.id
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="space-y-3">
          <div className="h-28 rounded-xl bg-neutral-100 animate-pulse" />
          <div className="h-28 rounded-xl bg-neutral-100 animate-pulse" />
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <ActivityItemCard
              key={item.id}
              item={item}
              onRebook={onRebook}
              onCancelBooking={onCancelBooking}
              onReschedule={onReschedule}
            />
          ))}
        </div>

      ) : (
        <EmptyState
          icon={<CalendarClock size={24} />}
          title={`No ${activeTab === 'all' ? '' : activeTab + ' '}activity recorded`}
          description="When you request or schedule local services on SevaSetu, your service timeline, status changes, and provider assignments will appear here."
          action={
            <Link to="/request">
              <Button size="sm" variant="primary" leftIcon={<PlusCircle size={14} />}>
                Request a Service
              </Button>
            </Link>
          }
        />
      )}
    </div>
  );
};
