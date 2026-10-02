import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  MapPin,
  CheckCircle2,
  ArrowRight,
  MessageSquare,
  Award,
  Loader2,
  AlertCircle,
  Briefcase,
  Sparkles,
} from 'lucide-react';
import { PageContainer } from '../../layouts/PageContainer';
import { PageHeader } from '../../layouts/PageHeader';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Alert } from '../../components/ui/Alert';
import { AiReviewSummaryCard } from '../../components/customer/reviews/AiReviewSummaryCard';
import { providerService } from '../../services/provider.service';
import type { PublicProviderProfile, ProviderServiceAreaRecord, AvailabilityCheckResponse } from '@sevasetu/shared';

export const ProviderProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<PublicProviderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestNotice, setRequestNotice] = useState(false);

  // Real Availability Check State
  const [checkDate, setCheckDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [checkingAvail, setCheckingAvail] = useState(false);
  const [availResult, setAvailResult] = useState<AvailabilityCheckResponse | null>(null);

  const handleCheckAvailability = async () => {
    if (!id || !checkDate) return;
    setCheckingAvail(true);
    try {
      const res = await providerService.checkAvailability(id, { date: checkDate });
      setAvailResult(res);
    } catch (err: unknown) {
      setAvailResult({
        providerId: id,
        date: checkDate,
        isAvailable: false,
        reason: err instanceof Error ? err.message : 'Availability inquiry failed',
      });
    } finally {
      setCheckingAvail(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function loadPublicProfile() {
      if (!id) {
        setError('No provider identifier specified.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await providerService.getPublicProfile(id);
        if (isMounted) {
          setProfile(data);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const message =
            err instanceof Error
              ? err.message
              : 'Provider profile not found or onboarding incomplete.';
          setError(message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    loadPublicProfile();
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <PageContainer maxWidth="md" className="py-16 text-center space-y-4">
        <Loader2 size={32} className="animate-spin text-primary-600 mx-auto" />
        <p className="text-sm text-neutral-600">Loading verified provider profile...</p>
      </PageContainer>
    );
  }

  if (error || !profile) {
    return (
      <PageContainer maxWidth="md" className="space-y-6 py-12">
        <PageHeader
          title="Provider Profile"
          description="Verified local service professional profile and credentials."
          breadcrumbs={[
            { label: 'Services', href: '/services' },
            { label: 'Provider Profile' },
          ]}
        />

        <EmptyState
          icon={<AlertCircle size={28} className="text-neutral-400" />}
          title="Provider Profile Unavailable"
          description={
            error ||
            'This provider profile does not exist, has not satisfied onboarding requirements, or is not currently listed for public discovery.'
          }
          action={
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <Link to="/services">
                <Button variant="primary" size="sm">
                  Browse Available Services
                </Button>
              </Link>
              <Link to="/request">
                <Button variant="outline" size="sm">
                  Submit Service Request
                </Button>
              </Link>
            </div>
          }
        />
      </PageContainer>
    );
  }

  const initials = profile.displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <PageContainer maxWidth="lg" className="space-y-8 pb-12">
      {/* Page Header */}
      <PageHeader
        title={profile.displayName}
        description="Verified local service professional registered on SevaSetu."
        breadcrumbs={[
          { label: 'Services', href: '/services' },
          { label: profile.displayName },
        ]}
      />

      {requestNotice && (
        <Alert
          variant="info"
          title="Direct Provider Assignment"
          onClose={() => setRequestNotice(false)}
        >
          <p className="text-xs sm:text-sm text-neutral-700">
            Targeting a specific provider will be available when scheduling and matching algorithms are active in upcoming platform phases.
          </p>
        </Alert>
      )}

      {/* Profile Overview Card */}
      <Card variant="default" padding="lg" className="bg-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-neutral-100">
          <div className="flex items-center gap-4">
            <Avatar size="xl" initials={initials || 'PR'} status="online" />
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 leading-tight">
                  {profile.displayName}
                </h2>
                <Badge variant="success" size="md" icon={<ShieldCheck size={14} />}>
                  Onboarding Complete
                </Badge>
              </div>
              <p className="text-sm text-neutral-600 font-medium">
                {profile.experienceYears} Years Professional Experience
              </p>
              <div className="flex items-center gap-3 text-xs text-neutral-600 pt-1 flex-wrap">
                {profile.serviceAreaSummary && (
                  <span className="flex items-center gap-1">
                    <MapPin size={13} className="text-neutral-400" />
                    <span>{profile.serviceAreaSummary}</span>
                  </span>
                )}
                {profile.languages.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Award size={13} className="text-neutral-400" />
                    <span>Languages: {profile.languages.join(', ')}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
            <Link to={`/request?providerId=${profile.id}`} className="w-full sm:w-auto">
              <Button variant="primary" size="md" className="w-full sm:w-auto" rightIcon={<ArrowRight size={14} />}>
                Request Service
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => setRequestNotice(true)}
            >
              Direct Message Info
            </Button>
          </div>
        </div>

        {/* Profile Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          {/* Main Info */}
          <div className="md:col-span-2 space-y-6">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider">
                Professional Bio &amp; Background
              </h3>
              <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-line">
                {profile.bio || 'Verified service professional on the SevaSetu platform.'}
              </p>
            </div>

            {/* Skills */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Sparkles size={16} className="text-primary-600" />
                <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider">
                  Verified Skills &amp; Capabilities ({profile.skills.length})
                </h3>
              </div>
              {profile.skills.length === 0 ? (
                <p className="text-xs text-neutral-500">No specific skills listed.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((s, idx) => {
                    const skillName = typeof s === 'string' ? s : s.name;
                    const skillCategory = typeof s === 'string' ? '' : s.category;
                    return (
                      <span
                        key={typeof s === 'string' ? `${s}-${idx}` : s.id}
                        className="px-3 py-1 rounded-md bg-neutral-100 text-neutral-800 text-xs font-medium"
                      >
                        {skillName} {skillCategory ? `(${skillCategory})` : ''}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Offered Services */}
            <div className="space-y-3">
              <div className="flex items-center gap-1.5">
                <Briefcase size={16} className="text-primary-600" />
                <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider">
                  Service Offerings ({profile.services.length})
                </h3>
              </div>
              {profile.services.length === 0 ? (
                <p className="text-xs text-neutral-500">No service packages currently configured.</p>
              ) : (
                <div className="space-y-2">
                  {profile.services.map((svc) => (
                    <div
                      key={svc.id}
                      className="p-3.5 rounded-lg border border-neutral-200 bg-neutral-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-neutral-900">{svc.title || svc.name || 'Service Offering'}</span>
                          <Badge variant="info" size="sm" className="text-[10px] uppercase">
                            {svc.pricingModel.replace('_', ' ')}
                          </Badge>
                        </div>
                        {svc.description && (
                          <p className="text-xs text-neutral-600">{svc.description}</p>
                        )}
                      </div>
                      <Link to={`/service/${svc.slug || svc.id}`}>
                        <Button variant="ghost" size="sm" className="text-xs h-7">
                          Service Details
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Honest Reviews Notice (No fake reviews) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider">
                  Ratings &amp; Customer Feedback
                </h3>
                <span className="text-xs text-neutral-600">Verified Marketplace Reviews</span>
              </div>
              {id && <AiReviewSummaryCard providerProfileId={id} />}
              <Card variant="subtle" padding="md" className="text-center py-6">
                <MessageSquare size={22} className="mx-auto text-neutral-400 mb-2" />
                <p className="text-xs font-semibold text-neutral-900">No public customer reviews yet</p>
                <p className="text-[11px] text-neutral-600 mt-0.5 max-w-sm mx-auto">
                  Customer ratings and verified service reviews will be published upon completion of authenticated appointments in Phase 3+.
                </p>
              </Card>
            </div>
          </div>

          {/* Right Column: Service Area, Availability & Standards */}
          <div className="space-y-4">
            {/* Service Area */}
            <Card variant="subtle" padding="md" className="space-y-3">
              <h4 className="font-semibold text-xs text-neutral-900 uppercase tracking-wider">
                Operating Territory
              </h4>
              <div className="space-y-2 text-xs text-neutral-700">
                <div className="flex items-center justify-between py-1 border-b border-neutral-200/60">
                  <span className="text-neutral-600">Service Coverage</span>
                  <span className="font-medium text-neutral-900">{profile.serviceAreaSummary || 'Local District'}</span>
                </div>
                {profile.serviceAreas && profile.serviceAreas.length > 0 && (
                  <div className="py-1">
                    <span className="text-neutral-500 block mb-1">Serving Municipalities:</span>
                    <div className="flex flex-wrap gap-1">
                      {profile.serviceAreas.map((sa: ProviderServiceAreaRecord) => (
                        <span key={sa.id} className="px-2 py-0.5 rounded bg-white border border-neutral-200 text-[11px]">
                          {sa.city} ({sa.locality})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Real Operating Availability Check */}
            <Card variant="subtle" padding="md" className="space-y-3">
              <h4 className="font-semibold text-xs text-neutral-900 uppercase tracking-wider">
                Operating Schedule
              </h4>
              <p className="text-xs text-neutral-600">
                Check this provider's verified availability for an intended appointment date.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={checkDate}
                    onChange={(e) => setCheckDate(e.target.value)}
                    className="px-2 py-1.5 bg-white border border-neutral-300 rounded text-xs text-neutral-900 w-full"
                    aria-label="Check Date"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCheckAvailability}
                    disabled={checkingAvail || !checkDate}
                    className="text-xs shrink-0"
                  >
                    {checkingAvail ? <Loader2 size={12} className="animate-spin" /> : 'Check'}
                  </Button>
                </div>

                {availResult && (
                  <div className={`p-2.5 rounded-lg text-xs border ${
                    availResult.isAvailable
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}>
                    <div className="flex items-center gap-1.5 font-semibold">
                      {availResult.isAvailable ? (
                        <>
                          <CheckCircle2 size={14} className="text-emerald-600" />
                          <span>Available on {checkDate}</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle size={14} className="text-rose-600" />
                          <span>Not Available on {checkDate}</span>
                        </>
                      )}
                    </div>
                    {availResult.workingHours && (
                      <p className="text-[11px] mt-1 text-neutral-700">
                        Operating Hours: <span className="font-mono">{availResult.workingHours.startTime} - {availResult.workingHours.endTime}</span>
                      </p>
                    )}
                    {availResult.reason && (
                      <p className="text-[11px] mt-0.5 opacity-80">{availResult.reason}</p>
                    )}
                  </div>
                )}
              </div>
            </Card>

            <Card variant="subtle" padding="md" className="space-y-2">
              <h4 className="font-semibold text-xs text-neutral-900 uppercase tracking-wider">
                Platform Standards
              </h4>
              <ul className="space-y-2 text-xs text-neutral-600">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                  <span>Onboarding profile completed</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                  <span>Trade skills cataloged</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                  <span>Transparent catalog pricing model</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </Card>
    </PageContainer>
  );
};
