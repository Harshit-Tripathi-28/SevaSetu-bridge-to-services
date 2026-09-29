import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, ArrowRight, CheckCircle2, Wrench } from 'lucide-react';
import { Card, CardContent } from '../../ui/Card';
import { Avatar } from '../../ui/Avatar';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { cn } from '../../../lib/utils';
import type { ProviderSearchResultItem, MatchReason } from '@sevasetu/shared';
import type { ProviderSummary } from '../../../types';

export interface ProviderResultCardProps {
  provider: ProviderSearchResultItem | ProviderSummary;
  onViewProfile?: (id: string) => void;
  onRequestService?: (id: string) => void;
  className?: string;
}

export const ProviderResultCard: React.FC<ProviderResultCardProps> = ({
  provider,
  className,
}) => {
  // Normalize provider data between ProviderSearchResultItem and ProviderSummary
  const isSearchResult = 'matchReasons' in provider;
  const pSearchResult = isSearchResult ? (provider as ProviderSearchResultItem) : null;
  const pSummary = !isSearchResult ? (provider as ProviderSummary) : null;

  const displayName =
    pSearchResult?.displayName ||
    pSummary?.fullName ||
    'Verified Specialist';

  const initials = displayName
    .split(' ')
    .map((part: string) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'SP';

  const matchedServiceTitle = pSearchResult?.matchedService?.serviceTitle;
  const categoryNames =
    pSummary?.categoryNames ||
    (pSearchResult?.matchedService ? [pSearchResult.matchedService.categorySlug] : []);

  const pricingDisplay =
    pSummary?.pricingDisplay ||
    (pSearchResult?.matchedService?.price
      ? `₹${pSearchResult.matchedService.price} (${pSearchResult.matchedService.pricingModel.replace('_', ' ')})`
      : pSearchResult?.matchedService?.pricingModel
      ? pSearchResult.matchedService.pricingModel.replace('_', ' ')
      : undefined);

  const skillsList: string[] = pSearchResult
    ? pSearchResult.skills.map((s) => s.name)
    : pSummary?.skills || [];

  const serviceArea =
    pSearchResult?.serviceAreaSummary ||
    pSearchResult?.serviceAreas?.[0]?.city ||
    '';

  const matchReasons: MatchReason[] = pSearchResult?.matchReasons || [];

  return (
    <Card
      variant="default"
      padding="none"
      className={cn(
        'overflow-hidden transition-all duration-200 hover:shadow-md hover:border-neutral-300 bg-white',
        className
      )}
    >
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
          {/* Provider Identity & Category */}
          <div className="flex items-center gap-3.5">
            <Avatar
              src={provider.avatarUrl || undefined}
              initials={initials}
              size="lg"
            />

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-base text-neutral-900 leading-tight">
                  {displayName}
                </h3>
                {pSearchResult?.businessName && pSearchResult.businessName !== displayName && (
                  <span className="text-xs text-neutral-500 font-normal">
                    ({pSearchResult.businessName})
                  </span>
                )}
                {pSearchResult?.matchScore !== undefined && (
                  <Badge variant="info" size="sm" className="text-[10px] font-mono font-bold">
                    {pSearchResult.matchScore}% Match
                  </Badge>
                )}
              </div>

              {matchedServiceTitle ? (
                <p className="text-xs text-primary-700 font-medium flex items-center gap-1">
                  <Wrench size={12} />
                  <span>{matchedServiceTitle}</span>
                </p>
              ) : categoryNames.length > 0 ? (
                <p className="text-xs text-neutral-600 font-medium">
                  {categoryNames.join(' • ')}
                </p>
              ) : null}
            </div>
          </div>

          {/* Pricing Info (Truthful, No Fake Ratings) */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2">
            {pricingDisplay && (
              <span className="font-bold text-sm sm:text-base text-neutral-900 font-mono">
                {pricingDisplay}
              </span>
            )}
            <Badge variant="success" size="sm" className="text-[10px]">
              Verified Onboarding
            </Badge>
          </div>
        </div>

        {/* Match Explanations (Explainable Matching) */}
        {matchReasons.length > 0 && (
          <div className="pt-3 pb-1 border-b border-neutral-100">
            <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
              Why this provider matches:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {matchReasons.map((r, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-50 text-primary-800 text-[11px] font-medium"
                >
                  <CheckCircle2 size={11} className="text-primary-600 shrink-0" />
                  <span>{r.message}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Skills & Auxiliary Metadata */}
        <div className="pt-3 space-y-2">
          {skillsList.length > 0 && (
            <div className="flex flex-wrap gap-1.5" aria-label="Provider Skills">
              {skillsList.map((skill: string) => (
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
            {provider.experienceYears !== undefined && provider.experienceYears > 0 && (
              <span className="font-medium text-neutral-700">
                {provider.experienceYears} {provider.experienceYears === 1 ? 'year' : 'years'} experience
              </span>
            )}

            {serviceArea && (
              <span className="flex items-center gap-1">
                <MapPin size={13} className="text-neutral-400" />
                <span>{serviceArea}</span>
              </span>
            )}

            {pSearchResult?.isAvailableForSchedule !== undefined ? (
              <span className="flex items-center gap-1 font-medium">
                <Clock
                  size={13}
                  className={pSearchResult.isAvailableForSchedule ? 'text-emerald-600' : 'text-neutral-400'}
                />
                <span className={pSearchResult.isAvailableForSchedule ? 'text-emerald-700 font-semibold' : 'text-neutral-600'}>
                  {pSearchResult.isAvailableForSchedule ? 'Available for Requested Schedule' : 'Schedule Conflict'}
                </span>
              </span>
            ) : (
              <span className="flex items-center gap-1 font-medium text-neutral-600">
                <Clock size={13} className="text-neutral-400" />
                <span>Schedule available upon request</span>
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

          <Link
            to={
              pSearchResult?.matchedService?.serviceId
                ? `/request?providerId=${provider.id}&serviceId=${pSearchResult.matchedService.serviceId}`
                : `/request?providerId=${provider.id}`
            }
          >
            <Button variant="primary" size="sm" rightIcon={<ArrowRight size={14} />}>
              Request Service
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
