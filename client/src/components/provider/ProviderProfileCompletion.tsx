import React from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Circle,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
import type { ProviderProfileData } from '../../types';

export interface ProfileCompletionItem {
  id: string;
  title: string;
  isComplete: boolean;
  link: string;
  description: string;
}

export interface ProviderProfileCompletionProps {
  profile?: ProviderProfileData | null;
  hasServices?: boolean;
  hasSkills?: boolean;
  hasAvailability?: boolean;
  className?: string;
  compact?: boolean;
}

export const ProviderProfileCompletion: React.FC<ProviderProfileCompletionProps> = ({
  profile,
  hasServices = false,
  hasSkills = false,
  hasAvailability = false,
  className,
  compact = false,
}) => {
  const items: ProfileCompletionItem[] = [
    {
      id: 'basic',
      title: 'Basic Identity & Bio',
      isComplete: Boolean(profile?.fullName && profile?.bio && profile.bio.length >= 10),
      link: '/provider/profile',
      description: 'Add your professional name and bio description',
    },
    {
      id: 'photo',
      title: 'Profile Avatar',
      isComplete: Boolean(profile?.avatarUrl),
      link: '/provider/profile',
      description: 'Upload a recognizable, professional face photo',
    },
    {
      id: 'skills',
      title: 'Skills & Specialities',
      isComplete: hasSkills,
      link: '/provider/profile',
      description: 'Select your trade expertise and certifications',
    },
    {
      id: 'services',
      title: 'Service Offerings',
      isComplete: hasServices,
      link: '/provider/services',
      description: 'Define pricing models and task duration parameters',
    },
    {
      id: 'availability',
      title: 'Weekly Operating Hours',
      isComplete: hasAvailability,
      link: '/provider/availability',
      description: 'Set your regular schedule for incoming booking dispatches',
    },
    {
      id: 'area',
      title: 'Service Locality & PIN Codes',
      isComplete: Boolean(profile?.serviceArea && profile.serviceArea.trim().length > 0),
      link: '/provider/profile',
      description: 'Define your operating sectors and dispatch boundary',
    },
    {
      id: 'verification',
      title: 'Identity Verification (KYC)',
      isComplete: profile?.verificationStatus === 'verified',
      link: '/provider/profile',
      description: 'Government ID verification required before public listing',
    },
  ];

  const completedCount = items.filter((i) => i.isComplete).length;
  const totalCount = items.length;
  const isAllComplete = completedCount === totalCount;

  return (
    <Card variant="default" padding="md" className={cn('bg-white', className)}>
      <CardHeader className="pb-3 border-b border-neutral-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert size={16} className={isAllComplete ? 'text-emerald-600' : 'text-amber-600'} />
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-700">
              Onboarding Checklist
            </span>
          </div>
          <span className="text-xs font-mono font-semibold text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded-md">
            {completedCount} of {totalCount} Completed
          </span>
        </div>
        <CardTitle className="text-base sm:text-lg pt-1">
          {isAllComplete ? 'Partner Profile Fully Active' : 'Complete Your Provider Profile'}
        </CardTitle>
        <CardDescription>
          {isAllComplete
            ? 'Your profile satisfies all listing requirements for customer matching.'
            : 'Fulfill the pending prerequisites below to enable dispatch matching in your service locality.'}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-4 space-y-3">
        {/* Progress Bar */}
        <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full transition-all duration-300 rounded-full',
              isAllComplete ? 'bg-emerald-600' : 'bg-primary-600'
            )}
            style={{ width: `${Math.round((completedCount / totalCount) * 100)}%` }}
          />
        </div>

        {/* Checklist Items */}
        <div className="space-y-2 pt-1">
          {items.map((item) => (
            <Link
              key={item.id}
              to={item.link}
              className={cn(
                'flex items-center justify-between p-2.5 rounded-lg border text-xs transition-colors group',
                item.isComplete
                  ? 'bg-neutral-50/70 border-neutral-200 text-neutral-700 hover:bg-neutral-100/80'
                  : 'bg-white border-amber-200/80 text-neutral-900 hover:border-amber-300'
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {item.isComplete ? (
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                ) : (
                  <Circle size={15} className="text-amber-500 shrink-0" />
                )}
                <div className="min-w-0">
                  <span className={cn('font-semibold block truncate', item.isComplete ? 'text-neutral-700 line-through decoration-neutral-300' : 'text-neutral-900')}>
                    {item.title}
                  </span>
                  {!compact && (
                    <span className="text-[11px] text-neutral-500 block truncate">
                      {item.description}
                    </span>
                  )}
                </div>
              </div>

              {!item.isComplete && (
                <ArrowRight size={13} className="text-neutral-400 group-hover:text-primary-600 shrink-0 ml-2 transition-transform group-hover:translate-x-0.5" />
              )}
            </Link>
          ))}
        </div>

        {!isAllComplete && (
          <div className="pt-2">
            <Link to="/provider/profile">
              <Button variant="outline" size="sm" className="w-full text-xs">
                Continue Profile Setup
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
