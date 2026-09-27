import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  XCircle,
  FileQuestion,
  FileText,
  User,
  Phone,
  Briefcase,
  History,
  Lock,
  Clock,
  Eye,
} from 'lucide-react';
import { PageHeader } from '../../layouts/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Textarea } from '../../components/ui/Textarea';
import { VerificationStatusBadge } from '../../components/admin/AdminStatusBadge';
import { AdminActionDialog } from '../../components/admin/AdminActionDialog';
import type { VerificationState, AdminActionDialogConfig } from '../../types/admin';

export const AdminVerificationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [status] = useState<VerificationState>('submitted');
  const [reviewerNotes, setReviewerNotes] = useState<string>('');
  const [actionConfig, setActionConfig] = useState<AdminActionDialogConfig | null>(null);

  const handleTriggerAction = (type: 'approve' | 'reject' | 'request_info') => {
    if (type === 'approve') {
      setActionConfig({
        actionType: 'approve_verification',
        title: 'Confirm Partner Verification Approval',
        entityName: `Applicant #${id}`,
        entityId: id || 'N/A',
        consequenceNotice:
          'Authorizing verification activates this trade provider on SevaSetu, publishing their service catalog to consumers.',
        severity: 'primary',
        requireReason: false,
        confirmLabel: 'Approve & Verify',
      });
    } else if (type === 'reject') {
      setActionConfig({
        actionType: 'reject_verification',
        title: 'Reject Compliance Verification',
        entityName: `Applicant #${id}`,
        entityId: id || 'N/A',
        consequenceNotice:
          'Rejecting will notify the applicant of non-compliance and maintain dispatch restrictions.',
        severity: 'destructive',
        requireReason: true,
        reasonPlaceholder: 'Specify deficiency reason for rejection...',
        confirmLabel: 'Confirm Rejection',
      });
    } else {
      setActionConfig({
        actionType: 'request_verification_info',
        title: 'Request Missing Verification Documents',
        entityName: `Applicant #${id}`,
        entityId: id || 'N/A',
        consequenceNotice:
          'Places application in "Needs Information" state and sends formal notification.',
        severity: 'warning',
        requireReason: true,
        reasonPlaceholder: 'Outline required supplementary information or documents...',
        confirmLabel: 'Submit Request',
      });
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader
        title="Verification Review Dossier"
        description="Review submitted identity documents, trade credentials, and background clearances with privacy controls."
        breadcrumbs={[
          { label: 'Admin' },
          { label: 'Verification', href: '/admin/verification' },
          { label: id ? `Review ${id}` : 'Detail' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link to="/admin/verification">
              <Button variant="outline" size="sm" leftIcon={<ArrowLeft size={14} />}>
                Back to Queue
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<FileQuestion size={14} />}
              onClick={() => handleTriggerAction('request_info')}
            >
              Request Info
            </Button>
            <Button
              variant="destructive"
              size="sm"
              leftIcon={<XCircle size={14} />}
              onClick={() => handleTriggerAction('reject')}
            >
              Reject
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<ShieldCheck size={14} />}
              onClick={() => handleTriggerAction('approve')}
            >
              Approve Verification
            </Button>
          </div>
        }
      />

      {/* Applicant Meta Card */}
      <Card variant="default" padding="md" className="bg-white border-neutral-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-lg">
              <User size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-neutral-900">Partner Applicant Dossier</h2>
                <VerificationStatusBadge status={status} />
              </div>
              <p className="text-xs text-neutral-500 font-mono mt-0.5">Dossier ID: {id || 'VRF-PENDING'}</p>
            </div>
          </div>
          <div className="text-xs text-neutral-500 flex items-center gap-1.5">
            <Clock size={14} />
            <span>Submission received via partner portal</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
            <span className="text-xs text-neutral-500 font-medium flex items-center gap-1.5 mb-1">
              <Briefcase size={13} />
              <span>Declared Trade</span>
            </span>
            <div className="text-xs font-semibold text-neutral-800">
              Electrical Systems &amp; Fixtures
            </div>
          </div>

          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
            <span className="text-xs text-neutral-500 font-medium flex items-center gap-1.5 mb-1">
              <Phone size={13} />
              <span>Contact (Masked)</span>
            </span>
            <div className="text-xs font-mono font-semibold text-neutral-800">
              +91 &bull;&bull;&bull;&bull;&bull; &bull;&bull;882
            </div>
          </div>

          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
            <span className="text-xs text-neutral-500 font-medium flex items-center gap-1.5 mb-1">
              <Lock size={13} />
              <span>Data Protection</span>
            </span>
            <div className="text-xs font-semibold text-neutral-800">
              Administrative Confidentiality
            </div>
          </div>
        </div>
      </Card>

      {/* Submitted Documents Structure Area */}
      <Card variant="default" padding="md" className="bg-white">
        <CardHeader className="pb-3 border-b border-neutral-100 flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-neutral-900">
            Submitted Compliance Documents
          </CardTitle>
          <span className="text-xs text-neutral-400">4 Required Verification Categories</span>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          {/* Government ID Preview Structure */}
          <div className="p-3.5 bg-neutral-50 rounded-lg border border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-neutral-200 text-neutral-700">
                <FileText size={18} />
              </div>
              <div>
                <span className="text-xs font-bold text-neutral-900">1. National Government Photo ID</span>
                <p className="text-[11px] text-neutral-500">Aadhaar / Voter ID / Passport (Redacted)</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="info" size="sm">Pending Review</Badge>
              <Button variant="outline" size="sm" leftIcon={<Eye size={12} />} className="text-xs h-7 px-2">
                Preview Structure
              </Button>
            </div>
          </div>

          {/* Trade Certification Preview Structure */}
          <div className="p-3.5 bg-neutral-50 rounded-lg border border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-neutral-200 text-neutral-700">
                <FileText size={18} />
              </div>
              <div>
                <span className="text-xs font-bold text-neutral-900">2. Professional Trade Certification</span>
                <p className="text-[11px] text-neutral-500">ITI / Apprenticeship / State Electrician License</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="info" size="sm">Pending Review</Badge>
              <Button variant="outline" size="sm" leftIcon={<Eye size={12} />} className="text-xs h-7 px-2">
                Preview Structure
              </Button>
            </div>
          </div>

          {/* Police Verification / Background Clearance */}
          <div className="p-3.5 bg-neutral-50 rounded-lg border border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-neutral-200 text-neutral-700">
                <FileText size={18} />
              </div>
              <div>
                <span className="text-xs font-bold text-neutral-900">3. Police Verification Clearance</span>
                <p className="text-[11px] text-neutral-500">Local station character &amp; background verification certificate</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="info" size="sm">Pending Review</Badge>
              <Button variant="outline" size="sm" leftIcon={<Eye size={12} />} className="text-xs h-7 px-2">
                Preview Structure
              </Button>
            </div>
          </div>

          {/* Address Proof */}
          <div className="p-3.5 bg-neutral-50 rounded-lg border border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-neutral-200 text-neutral-700">
                <FileText size={18} />
              </div>
              <div>
                <span className="text-xs font-bold text-neutral-900">4. Proof of Address / Workshop</span>
                <p className="text-[11px] text-neutral-500">Utility bill or rent agreement validating operating base</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="info" size="sm">Pending Review</Badge>
              <Button variant="outline" size="sm" leftIcon={<Eye size={12} />} className="text-xs h-7 px-2">
                Preview Structure
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviewer Notes & Decision Area */}
      <Card variant="default" padding="md" className="bg-white">
        <CardHeader className="pb-3 border-b border-neutral-100">
          <CardTitle className="text-sm font-bold text-neutral-900">
            Operator Review Notes
          </CardTitle>
          <p className="text-xs text-neutral-500">Internal notes logged for operational audit history</p>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          <Textarea
            rows={3}
            value={reviewerNotes}
            onChange={(e) => setReviewerNotes(e.target.value)}
            placeholder="Add reviewer notes regarding document validity, expiry dates, or trade license checks..."
            className="text-xs"
          />
          <p className="text-[11px] text-neutral-400">
            Notes will be timestamped and linked to your administrative operator ID upon submission.
          </p>
        </CardContent>
      </Card>

      {/* Audit Trail */}
      <Card variant="default" padding="md" className="bg-white">
        <CardHeader className="pb-3 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History size={16} className="text-neutral-600" />
            <CardTitle className="text-sm font-bold text-neutral-900">
              Verification Audit History
            </CardTitle>
          </div>
          <span className="text-xs text-neutral-400">Read-oriented log</span>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="py-6 text-center text-xs text-neutral-500">
            Application submitted by provider. No prior rejection or deficiency events logged.
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
