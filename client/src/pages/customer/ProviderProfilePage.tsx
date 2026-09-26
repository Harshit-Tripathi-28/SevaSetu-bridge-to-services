import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  MapPin,
  Clock,
  Calendar,
  CheckCircle2,
  ArrowRight,
  MessageSquare,
  Award,
  User,
} from 'lucide-react';
import { PageContainer } from '../../layouts/PageContainer';
import { PageHeader } from '../../layouts/PageHeader';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Alert } from '../../components/ui/Alert';

export const ProviderProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [showStructuralPreview, setShowStructuralPreview] = useState(false);
  const [requestNotice, setRequestNotice] = useState(false);

  // In this phase, no real provider records exist in the database yet.
  // We provide an honest empty state, plus a structural inspection mode for development verification.

  if (!showStructuralPreview && (!id || id === 'demo' || id.startsWith('unregistered'))) {
    return (
      <PageContainer maxWidth="md" className="space-y-6">
        <PageHeader
          title="Provider Profile"
          description="Verified local service professional profile and credentials."
          breadcrumbs={[
            { label: 'Services', href: '/services' },
            { label: 'Provider Profile' },
          ]}
        />

        <EmptyState
          icon={<User size={28} className="text-neutral-400" />}
          title={`No provider record registered for ID: ${id || 'unknown'}`}
          description="Provider onboarding and credential verification will be implemented in upcoming platform phases. Real provider profiles will be displayed here once registered."
          action={
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowStructuralPreview(true)}
              >
                Inspect Profile Layout Structure
              </Button>
              <Link to="/services">
                <Button variant="primary" size="sm">
                  Browse Services
                </Button>
              </Link>
            </div>
          }
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="lg" className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Professional Profile Presentation"
        description="Structural presentation framework for verified service providers."
        breadcrumbs={[
          { label: 'Services', href: '/services' },
          { label: `Provider (${id || 'Preview'})` },
        ]}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowStructuralPreview(!showStructuralPreview)}
          >
            {showStructuralPreview ? 'Show Unloaded State' : 'Layout Structure Mode'}
          </Button>
        }
      />

      {requestNotice && (
        <Alert
          variant="info"
          title="Direct Provider Assignment"
          onClose={() => setRequestNotice(false)}
        >
          <p className="text-xs sm:text-sm text-neutral-700">
            Targeting a specific provider will be available when provider onboarding and availability schedules are active.
          </p>
        </Alert>
      )}

      {/* Profile Overview Card */}
      <Card variant="default" padding="lg" className="bg-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-neutral-100">
          <div className="flex items-center gap-4">
            <Avatar size="xl" initials="PR" status="online" />
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 leading-tight">
                  Verified Service Professional
                </h2>
                <Badge variant="success" size="md" icon={<ShieldCheck size={14} />}>
                  Verified Identity
                </Badge>
              </div>
              <p className="text-sm text-neutral-600 font-medium">
                Primary Category: Home Maintenance &amp; Repair
              </p>
              <div className="flex items-center gap-3 text-xs text-neutral-600 pt-1">
                <span className="flex items-center gap-1">
                  <MapPin size={13} className="text-neutral-400" />
                  <span>Service Area: Local District</span>
                </span>
                <span className="flex items-center gap-1">
                  <Award size={13} className="text-neutral-400" />
                  <span>Certified Trade Skill</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
            <Link to={`/request?providerId=${id || 'target'}`} className="w-full sm:w-auto">
              <Button variant="primary" size="md" className="w-full sm:w-auto" rightIcon={<ArrowRight size={14} />}>
                Request This Provider
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
                Professional Bio &amp; Expertise
              </h3>
              <p className="text-sm text-neutral-700 leading-relaxed">
                Qualified service professional with standard trade credentials, technical equipment, and commitment to transparent service delivery. Specializes in rapid fault diagnosis, safe installation, and preventive maintenance.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider">
                Skills &amp; Capabilities
              </h3>
              <div className="flex flex-wrap gap-2">
                {['General Diagnostics', 'Installation & Fitting', 'Component Replacement', 'Safety Inspection', 'Emergency Repairs'].map((s) => (
                  <span key={s} className="px-3 py-1 rounded-md bg-neutral-100 text-neutral-800 text-xs font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Reviews Section Framework */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider">
                  Ratings &amp; Customer Feedback
                </h3>
                <span className="text-xs text-neutral-600">Verified Marketplace Reviews</span>
              </div>
              <Card variant="subtle" padding="md" className="text-center py-8">
                <MessageSquare size={24} className="mx-auto text-neutral-400 mb-2" />
                <p className="text-xs font-semibold text-neutral-900">No public customer reviews yet</p>
                <p className="text-[11px] text-neutral-600 mt-0.5 max-w-sm mx-auto">
                  Customer ratings and verified service reviews will be published upon completion of authenticated jobs.
                </p>
              </Card>
            </div>
          </div>

          {/* Availability & Service Area Framework */}
          <div className="space-y-4">
            <Card variant="subtle" padding="md" className="space-y-3">
              <h4 className="font-semibold text-xs text-neutral-900 uppercase tracking-wider">
                Availability Schedule
              </h4>
              <div className="space-y-2 text-xs text-neutral-700">
                <div className="flex items-center justify-between py-1 border-b border-neutral-200/60">
                  <span className="flex items-center gap-1.5 text-neutral-600">
                    <Calendar size={13} />
                    <span>Working Days</span>
                  </span>
                  <span className="font-medium">Monday – Saturday</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-neutral-200/60">
                  <span className="flex items-center gap-1.5 text-neutral-600">
                    <Clock size={13} />
                    <span>Working Hours</span>
                  </span>
                  <span className="font-medium">08:00 AM – 07:00 PM</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="flex items-center gap-1.5 text-neutral-600">
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    <span>Response Time</span>
                  </span>
                  <span className="font-medium text-emerald-700">Within 2 Hours</span>
                </div>
              </div>
            </Card>

            <Card variant="subtle" padding="md" className="space-y-2">
              <h4 className="font-semibold text-xs text-neutral-900 uppercase tracking-wider">
                Verification Standards
              </h4>
              <ul className="space-y-1.5 text-xs text-neutral-600">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                  <span>Government ID check verified</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                  <span>Service skill competency assessed</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                  <span>Platform code of conduct signed</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </Card>
    </PageContainer>
  );
};
