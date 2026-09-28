import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Inbox,
  Briefcase,
  Wallet,
  Star,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { PageContainer } from '../../layouts/PageContainer';
import { PageHeader } from '../../layouts/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ProviderProfileCompletion } from '../../components/provider/ProviderProfileCompletion';
import {
  NoRequestsState,
  NoJobsState,
  NoEarningsState,
  NoReviewsState,
} from '../../components/provider/ProviderEmptyStates';
import { providerService } from '../../services/provider.service';
import type { ProviderProfileData as UIProviderProfileData } from '../../types';
import type { ProviderOnboardingState } from '@sevasetu/shared';

export const ProviderOverviewPage: React.FC = () => {
  const [profile, setProfile] = useState<UIProviderProfileData | null>(null);
  const [hasSkills, setHasSkills] = useState(false);
  const [hasServices, setHasServices] = useState(false);
  const [onboarding, setOnboarding] = useState<ProviderOnboardingState | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [profData, skillsData, servicesData, onboardingData] = await Promise.all([
          providerService.getProfile(),
          providerService.getSkills(),
          providerService.getServices(),
          providerService.getOnboardingState(),
        ]);
        if (isMounted) {
          const name = profData.displayName || profData.businessName || 'Service Provider';
          setProfile({
            fullName: name,
            bio: profData.bio || '',
            experienceYears: profData.experienceYears || 1,
            serviceArea: profData.serviceAreaSummary || '',
            languages: profData.languages,
            profileStatus: profData.onboardingStatus === 'COMPLETED' ? 'active' : 'incomplete',
            visibility: profData.isPubliclyListed ? 'public' : 'unlisted',
            verificationStatus: 'unverified',
          });
          setHasSkills(skillsData.length > 0);
          setHasServices(servicesData.length > 0);
          setOnboarding(onboardingData);
        }
      } catch (_err) {
        // Handled silently for dashboard
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const isOnboardingComplete =
    onboarding?.status === 'COMPLETED' || onboarding?.onboardingStatus === 'COMPLETED';
  const progressPercentage =
    onboarding?.completionPercentage ?? onboarding?.progressPercentage ?? 0;
  const currentStatus =
    onboarding?.status || onboarding?.onboardingStatus || 'NOT_STARTED';

  return (
    <PageContainer maxWidth="xl" className="space-y-6 pb-12">
      {/* Provider Page Header */}
      <PageHeader
        title="Partner Console Overview"
        description="Monitor incoming client requests, dispatch schedules, operational availability, and account status."
        breadcrumbs={[
          { label: 'Provider Console' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link to="/provider/availability">
              <Button variant="outline" size="sm" leftIcon={<Clock size={14} />}>
                Operating Hours
              </Button>
            </Link>
            <Link to="/provider/requests">
              <Button variant="primary" size="sm" leftIcon={<Inbox size={14} />}>
                View Requests
              </Button>
            </Link>
          </div>
        }
      />

      {/* Top Status & Profile Completion Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Availability & Quick Status Card */}
        <div className="lg:col-span-4 space-y-6">
          <Card variant="default" padding="md" className="bg-white space-y-4">
            <CardHeader className="pb-3 border-b border-neutral-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Onboarding &amp; Status
                </span>
                <Badge variant={isOnboardingComplete ? 'success' : 'warning'} size="sm" withDot>
                  {isOnboardingComplete ? 'Active & Ready' : 'Onboarding Pending'}
                </Badge>
              </div>
              <CardTitle className="text-base pt-1">
                {isOnboardingComplete ? 'Ready for Customer Discovery' : 'Setup In Progress'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-neutral-700">
              <p className="leading-relaxed">
                {isOnboardingComplete
                  ? 'Your profile setup is complete. You are ready to accept appointments in your selected service territory.'
                  : 'Please complete your bio, skills, service offerings, and service area to become publicly discoverable.'}
              </p>
              <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Onboarding State:</span>
                  <span className="font-semibold text-neutral-900 font-mono">
                    {currentStatus}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Progress:</span>
                  <span className="font-semibold text-neutral-900 font-mono">
                    {progressPercentage}%
                  </span>
                </div>
              </div>
              <Link to="/provider/profile" className="block pt-1">
                <Button variant="outline" size="sm" className="w-full text-xs" rightIcon={<ArrowRight size={13} />}>
                  {isOnboardingComplete ? 'Manage Profile & Skills' : 'Continue Onboarding'}
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Honest Profile Completion Checklist */}
          <ProviderProfileCompletion
            compact
            profile={profile}
            hasSkills={hasSkills}
            hasServices={hasServices}
            hasAvailability={true}
          />
        </div>

        {/* Main Operational Feed: Requests & Jobs */}
        <div className="lg:col-span-8 space-y-6">
          {/* Incoming Service Requests Summary */}
          <Card variant="default" padding="md" className="bg-white space-y-3">
            <CardHeader className="pb-3 border-b border-neutral-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Inbox size={16} className="text-primary-600" />
                  <CardTitle className="text-base">Incoming Service Requests</CardTitle>
                </div>
                <Link to="/provider/requests" className="text-xs text-primary-700 hover:text-primary-800 font-semibold flex items-center gap-1">
                  <span>View All</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
              <CardDescription>
                Customer tasks awaiting partner acceptance, quotes, or scheduling confirmation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NoRequestsState />
            </CardContent>
          </Card>

          {/* Upcoming & Active Scheduled Jobs */}
          <Card variant="default" padding="md" className="bg-white space-y-3">
            <CardHeader className="pb-3 border-b border-neutral-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase size={16} className="text-primary-600" />
                  <CardTitle className="text-base">Confirmed Appointments &amp; Active Jobs</CardTitle>
                </div>
                <Link to="/provider/jobs" className="text-xs text-primary-700 hover:text-primary-800 font-semibold flex items-center gap-1">
                  <span>View All Jobs</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
              <CardDescription>
                Accepted bookings scheduled for on-site execution.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NoJobsState filter="upcoming" />
            </CardContent>
          </Card>

          {/* Earnings & Feedback Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Earnings Structure */}
            <Card variant="default" padding="md" className="bg-white space-y-3">
              <CardHeader className="pb-3 border-b border-neutral-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet size={15} className="text-emerald-600" />
                    <CardTitle className="text-sm">Earnings Overview</CardTitle>
                  </div>
                  <Link to="/provider/earnings" className="text-xs text-primary-700 hover:text-primary-800 font-medium">
                    Details
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <NoEarningsState />
              </CardContent>
            </Card>

            {/* Ratings & Reviews Structure */}
            <Card variant="default" padding="md" className="bg-white space-y-3">
              <CardHeader className="pb-3 border-b border-neutral-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star size={15} className="text-amber-500" />
                    <CardTitle className="text-sm">Client Reviews &amp; Ratings</CardTitle>
                  </div>
                  <Link to="/provider/reviews" className="text-xs text-primary-700 hover:text-primary-800 font-medium">
                    All Reviews
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <NoReviewsState />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
