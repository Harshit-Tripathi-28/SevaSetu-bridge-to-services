import React from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Check,
  X,
  Eye,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { RequestStatusBadge } from './ProviderStatusBadge';
import type { ProviderRequestItem } from '../../types';
import { cn } from '../../lib/utils';

export interface ProviderRequestCardProps {
  request: ProviderRequestItem;
  onAccept?: (requestId: string) => void;
  onDecline?: (requestId: string) => void;
  className?: string;
}

export const ProviderRequestCard: React.FC<ProviderRequestCardProps> = ({
  request,
  onAccept,
  onDecline,
  className,
}) => {
  const isPending = request.status === 'new' || request.status === 'pending';

  return (
    <Card variant="default" padding="md" className={cn('bg-white space-y-4 hover:border-neutral-300 transition-colors', className)}>
      <CardHeader className="pb-3 border-b border-neutral-100">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="info" size="sm">{request.category}</Badge>
            <span className="text-xs text-neutral-500 font-mono">Ref: {request.id}</span>
          </div>
          <RequestStatusBadge status={request.status} />
        </div>
        <CardTitle className="text-base sm:text-lg pt-1">
          {request.serviceTitle}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3.5 text-xs text-neutral-700">
        {/* Customer Need Statement */}
        <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200/80 space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 block">
            Customer Requirement
          </span>
          <p className="text-neutral-900 font-medium leading-relaxed">
            "{request.customerSummary}"
          </p>
        </div>

        {/* Schedule & Location Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <div className="flex items-center gap-2 text-neutral-800">
            <Calendar size={14} className="text-neutral-400 shrink-0" />
            <span className="font-semibold">{request.requestedDate}</span>
          </div>

          <div className="flex items-center gap-2 text-neutral-800 font-mono">
            <Clock size={14} className="text-neutral-400 shrink-0" />
            <span>{request.requestedTime} ({request.duration})</span>
          </div>

          <div className="sm:col-span-2 flex items-start gap-2 text-neutral-700">
            <MapPin size={14} className="text-neutral-400 shrink-0 mt-0.5" />
            <span className="truncate">{request.locationSummary}</span>
          </div>
        </div>

        {/* Customer Special Instructions */}
        {request.instructions && (
          <div className="flex items-start gap-1.5 text-neutral-600 bg-amber-50/60 p-2.5 rounded-lg border border-amber-200/60">
            <FileText size={14} className="text-amber-700 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong>Notes:</strong> {request.instructions}
            </p>
          </div>
        )}

        {/* Estimated Pricing if Available */}
        {request.estimatedPrice && (
          <div className="flex items-center justify-between pt-1 border-t border-neutral-100 text-xs">
            <span className="text-neutral-500">Estimated Job Value:</span>
            <span className="font-bold text-neutral-900">₹{request.estimatedPrice}</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-3 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-2.5">
        <Link to={`/provider/requests/${request.id}`}>
          <Button variant="ghost" size="sm" leftIcon={<Eye size={14} />} className="text-xs">
            View Full Breakdown
          </Button>
        </Link>

        {isPending && (
          <div className="flex items-center gap-2">
            {onDecline && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<X size={14} />}
                onClick={() => onDecline(request.id)}
                className="text-xs text-rose-700 hover:text-rose-800 hover:bg-rose-50 border-rose-200"
              >
                Decline
              </Button>
            )}

            {onAccept && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Check size={14} />}
                onClick={() => onAccept(request.id)}
                className="text-xs"
              >
                Accept Task
              </Button>
            )}
          </div>
        )}

        {!isPending && (
          <span className="text-[11px] text-neutral-500 italic flex items-center gap-1">
            <AlertCircle size={13} />
            <span>Action completed for this request</span>
          </span>
        )}
      </CardFooter>
    </Card>
  );
};
