import React from 'react';
import {
  Inbox,
  Briefcase,
  Wrench,
  Sparkles,
  CalendarX,
  CreditCard,
  Star,
  Loader2,
  WifiOff,
  UserCheck,
} from 'lucide-react';
import { EmptyState } from '../ui/EmptyState';
import { Card, CardContent } from '../ui/Card';
import { cn } from '../../lib/utils';

export interface ProviderStateProps {
  action?: React.ReactNode;
  className?: string;
}

export const NoRequestsState: React.FC<ProviderStateProps> = ({ action, className }) => (
  <EmptyState
    icon={<Inbox size={26} className="text-neutral-500" />}
    title="No Incoming Service Requests"
    description="When customers in your service area request tasks matching your categories, they will appear here for your review and quote."
    action={action}
    className={cn('py-12 bg-white rounded-xl border border-neutral-200', className)}
  />
);

export const NoJobsState: React.FC<{ filter?: string } & ProviderStateProps> = ({
  filter = 'current',
  action,
  className,
}) => (
  <EmptyState
    icon={<Briefcase size={26} className="text-neutral-500" />}
    title={`No ${filter === 'all' ? '' : filter} jobs found`}
    description={
      filter === 'upcoming'
        ? 'You have no confirmed upcoming service appointments scheduled.'
        : filter === 'active'
        ? 'There are currently no active or in-progress jobs requiring on-site execution.'
        : filter === 'completed'
        ? 'No completed job history has been recorded yet.'
        : 'Confirmed and scheduled client jobs will be listed here.'
    }
    action={action}
    className={cn('py-12 bg-white rounded-xl border border-neutral-200', className)}
  />
);

export const NoServicesState: React.FC<ProviderStateProps> = ({ action, className }) => (
  <EmptyState
    icon={<Wrench size={26} className="text-neutral-500" />}
    title="No Services Configured"
    description="Define the specific service offerings, pricing models, and time durations you provide to become matchable by customers."
    action={action}
    className={cn('py-12 bg-white rounded-xl border border-neutral-200', className)}
  />
);

export const NoSkillsState: React.FC<ProviderStateProps> = ({ action, className }) => (
  <EmptyState
    icon={<Sparkles size={26} className="text-neutral-500" />}
    title="No Skills Added Yet"
    description="Highlight your technical proficiencies, equipment certifications, and specialities to build customer confidence."
    action={action}
    className={cn('py-12 bg-white rounded-xl border border-neutral-200', className)}
  />
);

export const NoAvailabilityState: React.FC<ProviderStateProps> = ({ action, className }) => (
  <EmptyState
    icon={<CalendarX size={26} className="text-neutral-500" />}
    title="Working Hours Not Configured"
    description="Set your standard weekly operating days and dispatch time slots to allow customers to schedule within your available hours."
    action={action}
    className={cn('py-12 bg-white rounded-xl border border-neutral-200', className)}
  />
);

export const NoEarningsState: React.FC<ProviderStateProps> = ({ action, className }) => (
  <EmptyState
    icon={<CreditCard size={26} className="text-neutral-500" />}
    title="No Earnings Recorded"
    description="Earnings and payout statements will automatically populate here upon successful completion of your first client service."
    action={action}
    className={cn('py-12 bg-white rounded-xl border border-neutral-200', className)}
  />
);

export const NoReviewsState: React.FC<ProviderStateProps> = ({ action, className }) => (
  <EmptyState
    icon={<Star size={26} className="text-neutral-500" />}
    title="No Client Reviews Yet"
    description="Verified feedback and ratings from customers you service will be displayed here."
    action={action}
    className={cn('py-12 bg-white rounded-xl border border-neutral-200', className)}
  />
);

export const ProfileIncompleteState: React.FC<ProviderStateProps> = ({ action, className }) => (
  <EmptyState
    icon={<UserCheck size={26} className="text-amber-600" />}
    title="Provider Profile Incomplete"
    description="Please complete your profile details, service area, and identity verification checklist to activate public visibility."
    action={action}
    className={cn('py-12 bg-white rounded-xl border border-amber-200', className)}
  />
);

export const ProviderLoadingState: React.FC<{
  title?: string;
  description?: string;
  className?: string;
}> = ({
  title = 'Loading provider data...',
  description = 'Fetching information from the service network',
  className,
}) => (
  <Card variant="default" padding="lg" className={cn('bg-white text-center py-12', className)}>
    <CardContent className="flex flex-col items-center justify-center space-y-3">
      <Loader2 size={32} className="animate-spin text-primary-600" />
      <div className="space-y-1">
        <h4 className="font-semibold text-sm text-neutral-900">{title}</h4>
        <p className="text-xs text-neutral-500 max-w-sm mx-auto">{description}</p>
      </div>
    </CardContent>
  </Card>
);

export const ProviderErrorState: React.FC<{
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}> = ({
  title = 'Unable to Load Provider Data',
  description = 'We encountered a connection issue fetching your provider records. Please verify your connection and try again.',
  onRetry,
  className,
}) => (
  <EmptyState
    icon={<WifiOff size={26} className="text-rose-500" />}
    title={title}
    description={description}
    action={
      onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="text-xs font-semibold text-primary-700 hover:text-primary-800 underline cursor-pointer"
        >
          Retry Connection
        </button>
      ) : undefined
    }
    className={cn('py-12 bg-white rounded-xl border border-rose-200', className)}
  />
);
