import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Briefcase,
  CreditCard,
  MessageSquare,
  FileText,
  History,
  CheckCircle2,
  ShieldAlert,
  Clock,
} from 'lucide-react';
import { PageHeader } from '../../layouts/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Textarea } from '../../components/ui/Textarea';
import { DisputeStatusBadge, DisputePriorityBadge } from '../../components/admin/AdminStatusBadge';
import { AdminActionDialog } from '../../components/admin/AdminActionDialog';
import type { DisputeStatus, DisputePriority, AdminActionDialogConfig } from '../../types/admin';

export const AdminDisputeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [status] = useState<DisputeStatus>('under_review');
  const [priority] = useState<DisputePriority>('high');
  const [internalNote, setInternalNote] = useState<string>('');
  const [actionConfig, setActionConfig] = useState<AdminActionDialogConfig | null>(null);

  const handleTriggerAction = (type: 'resolve' | 'escalate') => {
    if (type === 'resolve') {
      setActionConfig({
        actionType: 'resolve_dispute',
        title: 'Confirm Dispute Resolution Decision',
        entityName: `Dispute Case #${id}`,
        entityId: id || 'N/A',
        consequenceNotice:
          'Resolving will close this investigation and disburse or refund escrow funds per the recorded resolution terms.',
        severity: 'primary',
        requireReason: true,
        reasonPlaceholder: 'Summarize the investigation findings and final ruling...',
        confirmLabel: 'Submit Final Resolution',
      });
    } else {
      setActionConfig({
        actionType: 'escalate_dispute',
        title: 'Escalate to Safety & Trust Senior Lead',
        entityName: `Dispute Case #${id}`,
        entityId: id || 'N/A',
        consequenceNotice:
          'Escalating alerts senior operations staff and reassigns this investigation for immediate review.',
        severity: 'warning',
        requireReason: true,
        reasonPlaceholder: 'State reason for executive escalation...',
        confirmLabel: 'Escalate Case',
      });
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader
        title="Dispute Case &amp; Investigation Dossier"
        description="Detailed review of claims, booking references, communication history, evidence submissions, and resolution governance."
        breadcrumbs={[
          { label: 'Admin' },
          { label: 'Disputes', href: '/admin/reports' },
          { label: id ? `Case ${id}` : 'Detail' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link to="/admin/reports">
              <Button variant="outline" size="sm" leftIcon={<ArrowLeft size={14} />}>
                Back to Cases
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ShieldAlert size={14} />}
              onClick={() => handleTriggerAction('escalate')}
            >
              Escalate
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<CheckCircle2 size={14} />}
              onClick={() => handleTriggerAction('resolve')}
            >
              Resolve Dispute
            </Button>
          </div>
        }
      />

      {/* Top Case Meta */}
      <Card variant="default" padding="md" className="bg-white border-neutral-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-neutral-900">Service Dispute Dossier</h2>
              <DisputePriorityBadge priority={priority} />
              <DisputeStatusBadge status={status} />
            </div>
            <p className="text-xs text-neutral-500 font-mono mt-0.5">Reference: {id || 'DSP-PENDING'}</p>
          </div>
          <div className="text-xs text-neutral-500 flex items-center gap-1.5">
            <Clock size={14} />
            <span>Assigned to Operations Reviewer</span>
          </div>
        </div>

        {/* Stakeholder Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
            <span className="text-xs text-neutral-500 font-medium flex items-center gap-1.5 mb-1">
              <User size={13} />
              <span>Filing Party (Customer)</span>
            </span>
            <div className="text-xs font-mono font-semibold text-neutral-800">
              c***@customer.sevasetu.internal
            </div>
          </div>

          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
            <span className="text-xs text-neutral-500 font-medium flex items-center gap-1.5 mb-1">
              <Briefcase size={13} />
              <span>Respondent (Provider)</span>
            </span>
            <div className="text-xs font-mono font-semibold text-neutral-800">
              p***@partner.sevasetu.internal
            </div>
          </div>

          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
            <span className="text-xs text-neutral-500 font-medium flex items-center gap-1.5 mb-1">
              <CreditCard size={13} />
              <span>Disputed Escrow Amount</span>
            </span>
            <div className="text-xs font-semibold text-neutral-800">
              ₹499.00 (Funds Locked)
            </div>
          </div>
        </div>
      </Card>

      {/* Description & Evidence Structure */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="default" padding="md" className="bg-white">
          <CardHeader className="pb-3 border-b border-neutral-100">
            <CardTitle className="text-sm font-bold text-neutral-900">
              Claim Description &amp; Issues
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-2 text-xs text-neutral-700">
            <p>
              The client reported that service completion was marked prematurely prior to full testing of repaired electrical fixtures.
            </p>
            <p className="text-neutral-500 pt-2 border-t border-neutral-100 text-[11px]">
              Customer claims refund of service fee; partner claims fixture replacement was verified with customer present.
            </p>
          </CardContent>
        </Card>

        <Card variant="default" padding="md" className="bg-white">
          <CardHeader className="pb-3 border-b border-neutral-100 flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-neutral-900">
              Submitted Photographic Evidence
            </CardTitle>
            <Badge variant="neutral" size="sm">Evidence Structure</Badge>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200 text-center">
              <FileText size={24} className="mx-auto text-neutral-400 mb-2" />
              <p className="text-xs font-medium text-neutral-700">Digital Evidence Secure Vault</p>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Evidence files are accessed via secure authenticated media storage during active case investigation.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Communication Log Reference & Internal Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="default" padding="md" className="bg-white">
          <CardHeader className="pb-3 border-b border-neutral-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare size={16} className="text-primary-600" />
              <CardTitle className="text-sm font-bold text-neutral-900">
                In-Platform Chat Transcript
              </CardTitle>
            </div>
            <Badge variant="info" size="sm">Available</Badge>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-xs text-neutral-600">
              Communication between customer and provider prior to dispute filing is logged in platform messaging logs for evidence audit.
            </p>
          </CardContent>
        </Card>

        <Card variant="default" padding="md" className="bg-white">
          <CardHeader className="pb-3 border-b border-neutral-100">
            <CardTitle className="text-sm font-bold text-neutral-900">
              Internal Investigation Notes
            </CardTitle>
            <p className="text-xs text-neutral-500">Confidential operator notes</p>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <Textarea
              rows={3}
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              placeholder="Record operational assessment, phone interview notes, or settlement terms..."
              className="text-xs"
            />
            <p className="text-[11px] text-neutral-400">
              Visible only to authorized operations staff.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Case Timeline */}
      <Card variant="default" padding="md" className="bg-white">
        <CardHeader className="pb-3 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History size={16} className="text-neutral-600" />
            <CardTitle className="text-sm font-bold text-neutral-900">
              Dispute Timeline
            </CardTitle>
          </div>
          <span className="text-xs text-neutral-400">Case chronology</span>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3 text-xs">
              <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
              <div>
                <span className="font-semibold text-neutral-800">Investigation Initiated</span>
                <p className="text-neutral-500 mt-0.5">Assigned to operations desk. Escrow funds frozen.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-xs">
              <div className="w-2 h-2 rounded-full bg-neutral-300 mt-1.5 shrink-0" />
              <div>
                <span className="font-semibold text-neutral-700">Dispute Filed by Customer</span>
                <p className="text-neutral-500 mt-0.5">Report submitted through customer activity portal.</p>
              </div>
            </div>
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
