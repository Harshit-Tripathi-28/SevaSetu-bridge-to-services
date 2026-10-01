import React from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Repeat,
  Receipt,
  MessageSquare,
  Star,
  CreditCard,
  XCircle,
  FileText,
} from 'lucide-react';
import { Card, CardContent } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { PaymentStatusBadge } from '../../transaction/PaymentStatusBadge';
import { Link } from 'react-router-dom';
import type { CustomerActivityItem, ActivityStatus, PaymentStatus } from '../../../types';

export interface ActivityItemCardProps {
  item: CustomerActivityItem & {
    paymentStatus?: PaymentStatus;
    invoiceId?: string;
    hasReviewed?: boolean;
  };
  onRebook?: (item: CustomerActivityItem) => void;
  onCancelBooking?: (item: CustomerActivityItem) => void;
  onReschedule?: (item: CustomerActivityItem) => void;
}

const statusBadgeConfig: Record<
  ActivityStatus,
  { variant: 'info' | 'warning' | 'success' | 'error' | 'neutral'; label: string }
> = {
  requested: { variant: 'info', label: 'Requested' },
  upcoming: { variant: 'warning', label: 'Upcoming' },
  in_progress: { variant: 'warning', label: 'In Progress' },
  completed: { variant: 'success', label: 'Completed' },
  cancelled: { variant: 'neutral', label: 'Cancelled' },
};

export const ActivityItemCard: React.FC<ActivityItemCardProps> = ({
  item,
  onRebook,
  onCancelBooking,
  onReschedule,
}) => {

  const badge = statusBadgeConfig[item.status] || { variant: 'neutral', label: item.status };

  return (
    <Card variant="default" padding="none" className="hover:border-neutral-300 transition-colors">
      <CardContent className="p-4 sm:p-5 space-y-3">
        {/* Top Header: Title, Status Badge, Price & Payment Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-100">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Link to={`/activity/${item.id}`} className="hover:underline">
                <h4 className="font-semibold text-sm sm:text-base text-neutral-900 leading-tight">
                  {item.serviceTitle}
                </h4>
              </Link>
              <Badge variant={badge.variant} size="sm" withDot>
                {badge.label}
              </Badge>
              {item.paymentStatus && (
                <PaymentStatusBadge status={item.paymentStatus} size="sm" />
              )}
            </div>
            <p className="text-xs text-neutral-600 mt-0.5">
              {item.categoryName} • Ref #{item.id}
            </p>
          </div>

          {item.pricePaid !== undefined && (
            <div className="text-right">
              <span className="font-bold text-sm text-neutral-900 font-mono block">
                ₹{item.pricePaid.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {/* Schedule & Location Metadata */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-600">
          {item.providerName && (
            <span className="font-medium text-neutral-800">
              Provider: {item.providerName}
            </span>
          )}

          {item.scheduledDate && (
            <span className="flex items-center gap-1">
              <Calendar size={13} className="text-neutral-400" />
              <span>{item.scheduledDate}</span>
            </span>
          )}

          {item.scheduledTime && (
            <span className="flex items-center gap-1">
              <Clock size={13} className="text-neutral-400" />
              <span>{item.scheduledTime}</span>
            </span>
          )}

          {item.location && (
            <span className="flex items-center gap-1">
              <MapPin size={13} className="text-neutral-400" />
              <span>{item.location}</span>
            </span>
          )}
        </div>

        {/* Part 6 Integrated Action Row */}
        <div className="pt-2 flex flex-wrap items-center justify-end gap-2 border-t border-neutral-100">
          {/* Action: View Booking Details */}
          <Link to={`/activity/${item.id}`}>
            <Button size="sm" variant="outline" leftIcon={<FileText size={13} />}>
              Details
            </Button>
          </Link>

          {/* Action: Pay Now (if payment pending) */}
          {item.paymentStatus === 'pending' && item.status !== 'cancelled' && (
            <Link to={`/payment/${item.id}`}>
              <Button size="sm" variant="primary" leftIcon={<CreditCard size={13} />}>
                Complete Payment
              </Button>
            </Link>
          )}

          {/* Action: Message Provider */}
          {(item.status === 'upcoming' || item.status === 'in_progress') && (
            <Link to="/messages">
              <Button size="sm" variant="outline" leftIcon={<MessageSquare size={13} />}>
                Chat Provider
              </Button>
            </Link>
          )}

          {/* Action: Invoice (if completed or paid) */}
          {item.status === 'completed' && (
            <Link to={`/invoice/${item.invoiceId || 'INV-' + item.id}`}>
              <Button size="sm" variant="outline" leftIcon={<Receipt size={13} />}>
                Invoice
              </Button>
            </Link>
          )}

          {/* Action: Review (if completed) */}
          {item.status === 'completed' && !item.hasReviewed && (
            <Link to={`/reviews/${item.id}`}>
              <Button size="sm" variant="outline" leftIcon={<Star size={13} />}>
                Rate Service
              </Button>
            </Link>
          )}

          {/* Action: Rebook (if completed and canRebook) */}
          {item.canRebook && (
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Repeat size={13} />}
              onClick={() => onRebook?.(item)}
            >
              Rebook
            </Button>
          )}

          {/* Action: Reschedule Booking (if upcoming or requested) */}
          {(item.status === 'requested' || item.status === 'upcoming') && onReschedule && (
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Calendar size={13} />}
              onClick={() => onReschedule(item)}
            >
              Reschedule
            </Button>
          )}

          {/* Action: Cancel Booking (if upcoming or requested) */}
          {(item.status === 'requested' || item.status === 'upcoming') && onCancelBooking && (
            <Button
              size="sm"
              variant="ghost"
              leftIcon={<XCircle size={13} className="text-rose-600" />}
              onClick={() => onCancelBooking(item)}
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
            >
              Cancel
            </Button>
          )}
        </div>

      </CardContent>
    </Card>
  );
};
