import React from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  User,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { JobStatusBadge } from './ProviderStatusBadge';
import { JobTimeline } from './JobTimeline';
import type { ProviderJobItem } from '../../types';
import { cn } from '../../lib/utils';

export interface ProviderJobCardProps {
  job: ProviderJobItem;
  showTimeline?: boolean;
  className?: string;
}

export const ProviderJobCard: React.FC<ProviderJobCardProps> = ({
  job,
  showTimeline = true,
  className,
}) => {
  return (
    <Card variant="default" padding="md" className={cn('bg-white space-y-4 hover:border-neutral-300 transition-colors', className)}>
      <CardHeader className="pb-3 border-b border-neutral-100">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="info" size="sm">{job.category}</Badge>
            <span className="text-xs text-neutral-500 font-mono">Job #{job.id}</span>
          </div>
          <JobStatusBadge status={job.status} />
        </div>
        <CardTitle className="text-base sm:text-lg pt-1">
          {job.serviceTitle}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 text-xs text-neutral-700">
        {/* Date, Time, Client info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="flex items-center gap-2 text-neutral-800">
            <Calendar size={14} className="text-neutral-400 shrink-0" />
            <span className="font-semibold">{job.scheduledDate}</span>
          </div>

          <div className="flex items-center gap-2 text-neutral-800 font-mono">
            <Clock size={14} className="text-neutral-400 shrink-0" />
            <span>{job.scheduledTime} ({job.duration})</span>
          </div>

          <div className="flex items-center gap-2 text-neutral-700">
            <User size={14} className="text-neutral-400 shrink-0" />
            <span>Client: <strong>{job.customerNameMasked || 'Verified Customer'}</strong></span>
          </div>

          <div className="flex items-center gap-2 text-neutral-700">
            <MapPin size={14} className="text-neutral-400 shrink-0" />
            <span className="truncate">{job.location}</span>
          </div>
        </div>

        {/* Visual Step Timeline */}
        {showTimeline && job.status !== 'cancelled' && (
          <div className="pt-2 border-t border-neutral-100">
            <JobTimeline currentStatus={job.status} />
          </div>
        )}

        {/* Pricing if Available */}
        {job.price !== undefined && (
          <div className="flex items-center justify-between pt-1 border-t border-neutral-100 text-xs">
            <span className="text-neutral-500">Service Fee:</span>
            <span className="font-bold text-neutral-900 text-sm">₹{job.price}</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-3 border-t border-neutral-100 flex items-center justify-between">
        <span className="text-[11px] text-neutral-500">
          Ref: {job.requestId || 'Standard Booking'}
        </span>

        <Link to={`/provider/jobs/${job.id}`}>
          <Button variant="primary" size="sm" rightIcon={<ArrowRight size={14} />} className="text-xs">
            Manage Service
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};
