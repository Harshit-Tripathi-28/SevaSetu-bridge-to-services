import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Briefcase,
  ShieldCheck,
  ShieldAlert,
  Star,
  AlertTriangle,
  History,
  Lock,
  Phone,
  MapPin,
  Clock,
  CheckCircle,
  FileCheck,
} from 'lucide-react';
import { PageHeader } from '../../layouts/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { AccountStatusBadge, VerificationStatusBadge } from '../../components/admin/AdminStatusBadge';
import { AdminActionDialog } from '../../components/admin/AdminActionDialog';
import type { AdminAccountStatus, VerificationState, AdminActionDialogConfig } from '../../types/admin';

export const AdminProviderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [accountStatus] = useState<AdminAccountStatus>('active');
  const [verificationStatus] = useState<VerificationState>('submitted');
  const [actionConfig, setActionConfig] = useState<AdminActionDialogConfig | null>(null);

  const handleTriggerAction = (type: 'verify' | 'restrict' | 'suspend' | 'request_info') => {
    if (type === 'verify') {
      setActionConfig({
        actionType: 'approve_verification',
        title: 'Approve Partner Verification & Onboarding',
        entityName: `Provider #${id}`,
        entityId: id || 'N/A',
        consequenceNotice:
          'Approving verification will officially activate this partner profile, granting visibility in search results and permitting job assignments.',
        severity: 'primary',
        requireReason: false,
        confirmLabel: 'Approve & Activate',
      });
    } else if (type === 'restrict') {
      setActionConfig({
        actionType: 'restrict_provider',
        title: 'Restrict Partner Dispatch Access',
        entityName: `Provider #${id}`,
        entityId: id || 'N/A',
        consequenceNotice:
          'Restricting this partner will temporarily hold new customer job requests while review is ongoing.',
        severity: 'warning',
        requireReason: true,
        reasonPlaceholder: 'State reason for partner dispatch hold...',
        confirmLabel: 'Apply Restriction',
      });
    } else if (type === 'suspend') {
      setActionConfig({
        actionType: 'suspend_provider',
        title: 'Confirm Provider Suspension',
        entityName: `Provider #${id}`,
        entityId: id || 'N/A',
        consequenceNotice:
          'Suspending this provider will immediately cancel all pending bookings and block console access.',
        severity: 'destructive',
        requireReason: true,
        reasonPlaceholder: 'Specify legal or policy violation reason...',
        confirmLabel: 'Suspend Partner',
      });
    } else {
      setActionConfig({
        actionType: 'request_verification_info',
        title: 'Request Missing Verification Documents',
        entityName: `Provider #${id}`,
        entityId: id || 'N/A',
        consequenceNotice:
          'A formal inquiry notification will be routed to the provider requesting supplementary documentation.',
        severity: 'warning',
        requireReason: true,
        reasonPlaceholder: 'Specify documents required (e.g. valid trade license, police clearance)...',
        confirmLabel: 'Send Request',
      });
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader
        title="Partner Operations &amp; Compliance Profile"
        description="Comprehensive operational dossier separating identity profile, dispatch performance, verification records, and governance controls."
        breadcrumbs={[
          { label: 'Admin' },
          { label: 'Providers', href: '/admin/providers' },
          { label: id ? `Provider ${id}` : 'Detail' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link to="/admin/providers">
              <Button variant="outline" size="sm" leftIcon={<ArrowLeft size={14} />}>
                Back to Providers
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<FileCheck size={14} />}
              onClick={() => handleTriggerAction('request_info')}
            >
              Request Info
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ShieldAlert size={14} />}
              onClick={() => handleTriggerAction('restrict')}
            >
              Restrict
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<ShieldCheck size={14} />}
              onClick={() => handleTriggerAction('verify')}
            >
              Verify Partner
            </Button>
          </div>
        }
      />

      {/* ======================================================== */}
      {/* 1. PROFILE INFORMATION                                   */}
      {/* ======================================================== */}
      <Card variant="default" padding="md" className="bg-white border-neutral-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-lg">
              <Briefcase size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-neutral-900">Partner Record</h2>
                <AccountStatusBadge status={accountStatus} />
                <VerificationStatusBadge status={verificationStatus} />
              </div>
              <p className="text-xs text-neutral-500 font-mono mt-0.5">PID: {id || 'PRV-PENDING'}</p>
            </div>
          </div>
          <div className="text-xs text-neutral-500 flex items-center gap-1.5">
            <Clock size={14} />
            <span>Profile created via partner onboarding flow</span>
          </div>
        </div>

        {/* Masked Contact & Location */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
            <span className="text-xs text-neutral-500 font-medium flex items-center gap-1.5 mb-1">
              <Phone size={13} />
              <span>Masked Phone</span>
            </span>
            <div className="text-xs font-mono font-semibold text-neutral-800">
              +91 &bull;&bull;&bull;&bull;&bull; &bull;&bull;456
            </div>
          </div>

          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
            <span className="text-xs text-neutral-500 font-medium flex items-center gap-1.5 mb-1">
              <MapPin size={13} />
              <span>Service Area</span>
            </span>
            <div className="text-xs font-semibold text-neutral-800">
              Active Regional Zone
            </div>
          </div>

          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
            <span className="text-xs text-neutral-500 font-medium flex items-center gap-1.5 mb-1">
              <Lock size={13} />
              <span>Privacy Boundary</span>
            </span>
            <div className="text-xs font-semibold text-neutral-800">
              Identity Masking Enabled
            </div>
          </div>
        </div>
      </Card>

      {/* ======================================================== */}
      {/* 2. OPERATIONAL INFORMATION                               */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="default" padding="md" className="bg-white">
          <CardHeader className="pb-3 border-b border-neutral-100 flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-neutral-900">
              Service Offerings &amp; Catalog
            </CardTitle>
            <Badge variant="neutral" size="sm">0 Listed</Badge>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="py-8 text-center text-xs text-neutral-500">
              No services currently published in catalog for this provider.
            </div>
          </CardContent>
        </Card>

        <Card variant="default" padding="md" className="bg-white">
          <CardHeader className="pb-3 border-b border-neutral-100 flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-neutral-900">
              Availability &amp; Operating Hours
            </CardTitle>
            <Badge variant="neutral" size="sm">Standard Slots</Badge>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="py-8 text-center text-xs text-neutral-500">
              Operating hours scheduled per regional standard (9:00 AM – 6:00 PM).
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ======================================================== */}
      {/* 3. TRUST & SAFETY INFORMATION                            */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card variant="default" padding="md" className="bg-white">
          <CardHeader className="pb-3 border-b border-neutral-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-amber-600" />
              <CardTitle className="text-sm font-bold text-neutral-900">
                Verification Records
              </CardTitle>
            </div>
            <Link to="/admin/verification" className="text-xs text-primary-600 hover:underline">
              Queue
            </Link>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="py-6 text-center text-xs text-neutral-500">
              Pending document submission review.
            </div>
          </CardContent>
        </Card>

        <Card variant="default" padding="md" className="bg-white">
          <CardHeader className="pb-3 border-b border-neutral-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star size={16} className="text-amber-500" />
              <CardTitle className="text-sm font-bold text-neutral-900">
                Client Reviews
              </CardTitle>
            </div>
            <span className="text-xs text-neutral-400">0 reviews</span>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="py-6 text-center text-xs text-neutral-500">
              No customer ratings or reviews logged yet.
            </div>
          </CardContent>
        </Card>

        <Card variant="default" padding="md" className="bg-white">
          <CardHeader className="pb-3 border-b border-neutral-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-error-600" />
              <CardTitle className="text-sm font-bold text-neutral-900">
                Disputes &amp; Reports
              </CardTitle>
            </div>
            <span className="text-xs text-neutral-400">0 reports</span>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="py-6 text-center text-xs text-neutral-500">
              Clean trust record. No customer disputes.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ======================================================== */}
      {/* 4. AUDIT TIMELINE                                        */}
      {/* ======================================================== */}
      <Card variant="default" padding="md" className="bg-white">
        <CardHeader className="pb-3 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History size={16} className="text-neutral-600" />
            <CardTitle className="text-sm font-bold text-neutral-900">
              Partner Governance Audit Trail
            </CardTitle>
          </div>
          <span className="text-xs text-neutral-400">Read-oriented log</span>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="py-8 text-center text-xs text-neutral-500">
            No administrative status mutations recorded for this provider.
          </div>
        </CardContent>
      </Card>

      <AdminActionDialog
        isOpen={Boolean(actionConfig)}
        onClose={() => setActionConfig(null)}
        config={actionConfig}
        onConfirm={() => {
          // Acknowledged in local session
        }}
      />
    </div>
  );
};
