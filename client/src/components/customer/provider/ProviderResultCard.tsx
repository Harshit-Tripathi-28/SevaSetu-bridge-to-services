import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Star, MapPin, Clock, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '../../ui/Card';
import { Avatar } from '../../ui/Avatar';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { cn } from '../../../lib/utils';
import type { ProviderSummary } from '../../../types';

export interface ProviderResultCardProps {
  provider: ProviderSummary;
  onViewProfile?: (id: string) => void;
  onRequestService?: (id: string) => void;
  className?: string;
}

export const ProviderResultCard: React.FC<ProviderResultCardProps> = ({
  provider,
  className,
}) => {
  // Extract initials from fullName
  const initials = provider.fullName
    ? provider.fullName
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'SP';

  return (
    <Card
      variant="default"
      padding="none"
      className={cn(
        'overflow-hidden transition-all duration-200 hover:shadow-md hover:border-neutral-300',
        className
      )}
    >
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
          {/* Provider Identity & Category */}
          <div className="flex items-center gap-3.5">
            <Avatar
              src={provider.avatarUrl}
              initials={initials}
              size="lg"
              status={provider.isAvailableNow ? 'online' : undefined}
            />

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-base text-neutral-900 leading-tight">
                  {provider.fullName}
                </h3>
                {provider.verified && (
                  <Badge variant="success" size="sm" icon={<ShieldCheck size={12} />}>
                    Verified
                  </Badge>
                )}
              </div>

              {provider.categoryNames && provider.categoryNames.length > 0 && (
                <p className="text-xs text-neutral-600 font-medium">
                  {provider.categoryNames.join(' • ')}
                </p>
              )}
            </div>
          </div>

          {/* Pricing & Rating Info */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2">
            {provider.pricingDisplay && (
              <span className="font-bold text-sm sm:text-base text-neutral-900 font-mono">
                {provider.pricingDisplay}
              </span>
            )}

            {provider.averageRating !== undefined && (
              <div className="flex items-center gap-1 text-xs text-neutral-700 font-medium">
                <Star size={13} className="text-amber-500 fill-amber-500" aria-hidden="true" />
                <span>{provider.averageRating.toFixed(1)}</span>
                {provider.totalReviews !== undefined && (
                  <span className="text-neutral-600">({provider.totalReviews})</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Skills & Auxiliary Metadata */}
        <div className="pt-4 space-y-3">
          {provider.skills && provider.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5" aria-label="Provider Skills">
              {provider.skills.map((skill) => (
                <span
                  key={skill}
                  className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 text-xs font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-600 pt-1">
            {provider.experienceYears !== undefined && (
              <span className="font-medium text-neutral-700">
                {provider.experienceYears}+ years experience
              </span>
            )}

            {provider.distanceKm !== undefined && (
              <span className="flex items-center gap-1">
                <MapPin size={13} className="text-neutral-400" />
                <span>{provider.distanceKm} km away</span>
              </span>
            )}

            {provider.isAvailableNow !== undefined && (
              <span className="flex items-center gap-1 font-medium">
                <Clock size={13} className={provider.isAvailableNow ? 'text-emerald-600' : 'text-neutral-400'} />
                <span className={provider.isAvailableNow ? 'text-emerald-700' : 'text-neutral-600'}>
                  {provider.isAvailableNow ? 'Available Today' : 'Schedule in advance'}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Actions Bar */}
        <div className="pt-4 mt-4 border-t border-neutral-100 flex items-center justify-between gap-3">
          <Link to={`/provider/${provider.id}`}>
            <Button variant="outline" size="sm">
              View Profile
            </Button>
          </Link>

          <Link to={`/request?providerId=${provider.id}`}>
            <Button variant="primary" size="sm" rightIcon={<ArrowRight size={14} />}>
              Request Service
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
