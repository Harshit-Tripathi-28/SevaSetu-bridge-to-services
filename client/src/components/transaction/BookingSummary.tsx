import React from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Briefcase,
  FileText,
  CalendarClock,
  XCircle,
  History,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import type { BookingRecord, BookingStatus } from '@sevasetu/shared';

export interface BookingSummaryProps {
  booking: BookingRecord;
  userRole?: 'customer' | 'provider' | 'admin';
  onCancel?: () => void;
  onReschedule?: () => void;
  className?: string;
}

function getStatusBadgeConfig(status: BookingStatus): {
  variant: 'info' | 'warning' | 'success' | 'error' | 'neutral';
  label: string;
} {
  switch (status) {
    case 'PENDING_PROVIDER':
      return { variant: 'warning', label: 'Pending Provider Review' };
    case 'ACCEPTED':
    case 'SCHEDULED':
      return { variant: 'info', label: 'Scheduled' };
    case 'ON_THE_WAY':
      return { variant: 'info', label: 'Partner On The Way' };
    case 'ARRIVED':
      return { variant: 'info', label: 'Partner Arrived' };
    case 'IN_PROGRESS':
      return { variant: 'warning', label: 'Service In Progress' };
    case 'COMPLETED':
      return { variant: 'success', label: 'Completed' };
    case 'CANCELLED':
      return { variant: 'error', label: 'Cancelled' };
    case 'DECLINED':
      return { variant: 'neutral', label: 'Declined' };
    case 'EXPIRED':
      return { variant: 'neutral', label: 'Expired' };
    default:
      return { variant: 'neutral', label: status };
  }
}

export const BookingSummary: React.FC<BookingSummaryProps> = ({
  booking,
  userRole = 'customer',
  onCancel,
  onReschedule,
  className,
}) => {
  const badgeConfig = getStatusBadgeConfig(booking.status);
  const isCancellable =
    booking.status === 'PENDING_PROVIDER' ||
    booking.status === 'ACCEPTED' ||
    booking.status === 'SCHEDULED';
  const isReschedulable =
    booking.status === 'PENDING_PROVIDER' ||
    booking.status === 'ACCEPTED' ||
    booking.status === 'SCHEDULED';

  const providerName =
    booking.providerSnapshot?.businessName ||
    booking.providerSnapshot?.fullName ||
    booking.providerProfile?.businessName ||
    booking.providerProfile?.user?.fullName ||
    'Assigned Partner';

  const customerName =
    booking.customerSnapshot?.fullName ||
    booking.customer?.fullName ||
    'Customer';

  const locationStr = booking.locationSnapshot
    ? `${booking.locationSnapshot.flatNumber}, ${booking.locationSnapshot.streetArea}, ${booking.locationSnapshot.city} ${booking.locationSnapshot.postalCode}`
    : 'Service Location';

  return (
    <Card variant="default" padding="md" className={`bg-white space-y-4 ${className || ''}`}>
      <CardHeader className="pb-3 border-b border-neutral-100">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-neutral-500 font-semibold">
              Ref #{booking.referenceCode}
            </span>
            <Badge variant={badgeConfig.variant} size="sm" withDot>
              {badgeConfig.label}
            </Badge>
          </div>
          <span className="text-xs text-neutral-400 font-mono">
            ID: {booking.id.slice(0, 8)}...
          </span>
        </div>
        <CardTitle className="text-lg pt-1">
          {booking.serviceTitleSnapshot || booking.service?.title || 'Service Booking'}
        </CardTitle>
        <CardDescription>
          Requested on {new Date(booking.createdAt).toLocaleDateString()}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 text-xs text-neutral-700">
        {/* Stakeholder and Appointment Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-lg border border-neutral-200 bg-neutral-50/50 space-y-1">
            <div className="flex items-center gap-1.5 text-neutral-500 font-medium">
              {userRole === 'provider' ? <User size={13} /> : <Briefcase size={13} />}
              <span>{userRole === 'provider' ? 'Customer' : 'Service Partner'}</span>
            </div>
            <p className="font-semibold text-neutral-900 text-sm">
              {userRole === 'provider' ? customerName : providerName}
            </p>
          </div>

          <div className="p-3 rounded-lg border border-neutral-200 bg-neutral-50/50 space-y-1">
            <div className="flex items-center gap-1.5 text-neutral-500 font-medium">
              <Calendar size={13} />
              <span>Scheduled Time</span>
            </div>
            <p className="font-semibold text-neutral-900 text-sm">{booking.scheduledDate}</p>
            <p className="text-neutral-500 font-mono text-[11px] flex items-center gap-1">
              <Clock size={11} /> {booking.scheduledStartTime} – {booking.scheduledEndTime} ({booking.durationHours}h)
            </p>
          </div>
        </div>

        {/* Location Snapshot */}
        <div className="p-3 rounded-lg border border-neutral-200 flex items-start gap-2.5">
          <MapPin size={15} className="text-neutral-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-neutral-900 block">Service Address:</span>
            <span className="text-neutral-600 leading-relaxed">{locationStr}</span>
          </div>
        </div>

        {/* Request description / instructions if present */}
        {booking.serviceRequest?.description && (
          <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200 space-y-1">
            <div className="flex items-center gap-1.5 text-neutral-700 font-semibold">
              <FileText size={13} />
              <span>Service Request Notes:</span>
            </div>
            <p className="text-neutral-600 leading-relaxed">{booking.serviceRequest.description}</p>
          </div>
        )}

        {/* Cancellation Reason if cancelled */}
        {booking.status === 'CANCELLED' && booking.cancellationReason && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 space-y-1">
            <span className="font-semibold text-rose-900 block">Cancellation Note:</span>
            <p className="text-rose-800">{booking.cancellationReason}</p>
          </div>
        )}

        {/* Status History Timeline */}
        {booking.statusHistory && booking.statusHistory.length > 0 && (
          <div className="pt-2 border-t border-neutral-100 space-y-2">
            <div className="flex items-center gap-1.5 text-neutral-800 font-semibold">
              <History size={13} />
              <span>Status Audit Log</span>
            </div>
            <div className="space-y-1.5 font-mono text-[11px]">
              {booking.statusHistory.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between text-neutral-600 bg-neutral-50 p-2 rounded border border-neutral-150"
                >
                  <div>
                    <span className="font-semibold text-neutral-900">{item.newStatus}</span>
                    <span className="text-neutral-500 text-[10px] ml-1.5">({item.actorType})</span>
                    {item.reason && <span className="text-neutral-500 ml-1.5 italic">— {item.reason}</span>}
                  </div>
                  <span className="text-neutral-400 text-[10px]">
                    {new Date(item.createdAt).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      {/* Action Controls for Customer */}
      {userRole === 'customer' && (isCancellable || isReschedulable) && (
        <CardFooter className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-2">
          {isReschedulable && onReschedule && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<CalendarClock size={13} />}
              onClick={onReschedule}
            >
              Reschedule
            </Button>
          )}
          {isCancellable && onCancel && (
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<XCircle size={13} className="text-rose-600" />}
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              onClick={onCancel}
            >
              Cancel Booking
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
};
