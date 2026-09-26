import React from 'react';
import { Calendar, Clock, MapPin, Repeat, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Link } from 'react-router-dom';
import type { CustomerActivityItem, ActivityStatus } from '../../../types';

export interface ActivityItemCardProps {
  item: CustomerActivityItem;
  onRebook?: (item: CustomerActivityItem) => void;
}

const statusBadgeConfig: Record<ActivityStatus, { variant: 'info' | 'warning' | 'success' | 'error' | 'neutral'; label: string }> = {
  requested: { variant: 'info', label: 'Requested' },
  upcoming: { variant: 'warning', label: 'Upcoming' },
  in_progress: { variant: 'warning', label: 'In Progress' },
  completed: { variant: 'success', label: 'Completed' },
  cancelled: { variant: 'error', label: 'Cancelled' },
};

export const ActivityItemCard: React.FC<ActivityItemCardProps> = ({ item, onRebook }) => {
  const badge = statusBadgeConfig[item.status] || { variant: 'neutral', label: item.status };

  return (
    <Card variant="default" padding="none" className="hover:border-neutral-300 transition-colors">
      <CardContent className="p-4 sm:p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-100">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-sm sm:text-base text-neutral-900 leading-tight">
                {item.serviceTitle}
              </h4>
              <Badge variant={badge.variant} size="sm" withDot>
                {badge.label}
              </Badge>
            </div>
            <p className="text-xs text-neutral-600 mt-0.5">{item.categoryName}</p>
          </div>

          {item.pricePaid !== undefined && (
            <span className="font-bold text-sm text-neutral-900 font-mono">
              ₹{item.pricePaid}
            </span>
          )}
        </div>

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

        <div className="pt-2 flex items-center justify-end gap-2">
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

          <Link to={`/request`}>
            <Button size="sm" variant="ghost" rightIcon={<ArrowRight size={13} />}>
              Service Details
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
