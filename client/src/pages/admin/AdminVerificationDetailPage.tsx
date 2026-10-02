import React, { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import { PageHeader } from '../../layouts/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Textarea } from '../../components/ui/Textarea';
import { VerificationStatusBadge } from '../../components/admin/AdminStatusBadge';
import { AdminActionDialog } from '../../components/admin/AdminActionDialog';
import { AdminService } from '../../services/admin.service';
import type { VerificationState, AdminActionDialogConfig } from '../../types/admin';

export const AdminVerificationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [record, setRecord] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [reviewerNotes, setReviewerNotes] = useState<string>('');
  const [actionConfig, setActionConfig] = useState<AdminActionDialogConfig | null>(null);

  const loadRecord = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await AdminService.getVerificationDetail(id);
      setRecord(data);
      if (data.reviewerNotes) {
        setReviewerNotes(data.reviewerNotes);
      }
    } catch (err) {
      console.error('Failed to load verification record:', err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadRecord();
  }, [loadRecord]);

  const status: VerificationState = (record?.status?.toLowerCase() as VerificationState) || 'submitted';

  const handleTriggerAction = (type: 'approve' | 'reject' | 'request_info') => {
    if (type === 'approve') {
      setActionConfig({
        actionType: 'approve_verification',
        title: 'Confirm Partner Verification Approval',
        entityName: record?.providerProfile?.user?.fullName || `Applicant #${id}`,
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
        entityName: record?.providerProfile?.user?.fullName || `Applicant #${id}`,
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
        entityName: record?.providerProfile?.user?.fullName || `Applicant #${id}`,
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

  const handleConfirmAction = async (reason?: string) => {
    if (!actionConfig || !id) return;
    try {
      if (actionConfig.actionType === 'approve_verification') {
        await AdminService.reviewVerification(id, {
          status: 'APPROVED',
          reviewerNotes: reviewerNotes || 'Approved via admin console',
        });
      } else if (actionConfig.actionType === 'reject_verification') {
        await AdminService.reviewVerification(id, {
          status: 'REJECTED',
          rejectionReason: reason || 'Rejected via admin console',
          reviewerNotes,
        });
      } else if (actionConfig.actionType === 'request_verification_info') {
        await AdminService.reviewVerification(id, {
          status: 'NEEDS_INFORMATION',
          reviewerNotes: reason || reviewerNotes || 'Further information requested',
        });
      }
      setActionConfig(null);
      await loadRecord();
    } catch (err) {
      console.error('Failed to update verification status:', err);
    }
  };

  const phoneMasked = record?.providerProfile?.user?.phone
    ? `${record.providerProfile.user.phone.slice(0, 3)}****${record.providerProfile.user.phone.slice(-3)}`
    : 'N/A';

  const documents = Array.isArray(record?.documents) ? record.documents : [];

  if (isLoading) {
    return <div className="p-8 text-center text-neutral-500">Loading verification dossier...</div>;
  }

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
                <h2 className="text-lg font-bold text-neutral-900">
                  {record?.providerProfile?.user?.fullName || record?.providerProfile?.businessName || 'Partner Applicant Dossier'}
                </h2>
                <VerificationStatusBadge status={status} />
              </div>
              <p className="text-xs text-neutral-500 font-mono mt-0.5">Dossier ID: {id || 'VRF-PENDING'}</p>
            </div>
          </div>
          <div className="text-xs text-neutral-500 flex items-center gap-1.5">
            <Clock size={14} />
            <span>Submission received: {record?.submittedAt ? new Date(record.submittedAt).toLocaleDateString() : 'N/A'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
            <span className="text-xs text-neutral-500 font-medium flex items-center gap-1.5 mb-1">
              <Briefcase size={13} />
              <span>Declared Trade</span>
            </span>
            <div className="text-xs font-semibold text-neutral-800">
              {record?.verificationType || 'General Trade'}
            </div>
          </div>

          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
            <span className="text-xs text-neutral-500 font-medium flex items-center gap-1.5 mb-1">
              <Phone size={13} />
              <span>Contact (Masked)</span>
            </span>
            <div className="text-xs font-mono font-semibold text-neutral-800">
              {phoneMasked}
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
          <span className="text-xs text-neutral-400">{documents.length} Submitted Items</span>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          {documents.length > 0 ? (
            documents.map((doc: any, idx: number) => (
              <div
                key={idx}
                className="p-3.5 bg-neutral-50 rounded-lg border border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-neutral-200 text-neutral-700">
                    <FileText size={18} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-neutral-900">{doc.title || doc.name || `Document #${idx + 1}`}</span>
                    <p className="text-[11px] text-neutral-500">{doc.type || 'Compliance verification document'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="info" size="sm">Submitted Document</Badge>
                </div>
              </div>
            ))
          ) : (
            <div className="py-6 text-center text-xs text-neutral-500">
              Verification metadata on file. Specific document attachments are maintained under secure access controls.
            </div>
          )}
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
            {record?.reviewedAt
              ? `Reviewed on ${new Date(record.reviewedAt).toLocaleString()} by Admin UID ${record.reviewedByAdminId || 'Console'}`
              : 'Application submitted by provider. No prior rejection or deficiency events logged.'}
          </div>
        </CardContent>
      </Card>

      <AdminActionDialog
        isOpen={Boolean(actionConfig)}
        onClose={() => setActionConfig(null)}
        config={actionConfig}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
};
