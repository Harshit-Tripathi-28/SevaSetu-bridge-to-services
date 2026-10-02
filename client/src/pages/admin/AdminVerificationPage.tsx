import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Eye, ShieldCheck, XCircle, FileQuestion, RefreshCw } from 'lucide-react';
import { PageHeader } from '../../layouts/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { AdminTable, ColumnDef } from '../../components/admin/AdminTable';
import { AdminFilterBar, AdminFilterConfig } from '../../components/admin/AdminFilterBar';
import { VerificationStatusBadge } from '../../components/admin/AdminStatusBadge';
import { AdminActionDialog } from '../../components/admin/AdminActionDialog';
import { AdminService } from '../../services/admin.service';
import type { VerificationRecord, AdminActionDialogConfig } from '../../types/admin';

export const AdminVerificationPage: React.FC = () => {
  const [queue, setQueue] = useState<VerificationRecord[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('submittedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [actionConfig, setActionConfig] = useState<AdminActionDialogConfig | null>(null);

  const loadVerifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const statusParam = statusFilter !== 'all' ? statusFilter.toUpperCase() : undefined;
      const res = await AdminService.listVerifications({ status: statusParam });

      const mapped: VerificationRecord[] = (res.verifications || []).map((v: any) => ({
        id: v.id,
        providerId: v.providerProfileId,
        providerName: v.providerProfile?.user?.fullName || v.providerProfile?.businessName || 'Provider',
        emailMasked: v.providerProfile?.user?.email ? `${v.providerProfile.user.email.slice(0, 2)}***@***` : undefined,
        phoneMasked: v.providerProfile?.user?.phone ? `${v.providerProfile.user.phone.slice(0, 3)}****${v.providerProfile.user.phone.slice(-3)}` : 'N/A',
        tradeCategory: v.verificationType || 'General Trade',
        experienceYears: v.providerProfile?.experienceYears || 0,
        serviceArea: v.providerProfile?.serviceAreas?.[0]?.name || 'Standard Zone',
        status: (v.status?.toLowerCase() as any) || 'submitted',
        submittedAt: v.submittedAt ? new Date(v.submittedAt).toLocaleDateString() : 'N/A',
        reviewedAt: v.reviewedAt ? new Date(v.reviewedAt).toLocaleDateString() : undefined,
        reviewerNotes: v.reviewerNotes,
        documents: Array.isArray(v.documents) ? v.documents : [],
      }));

      setQueue(mapped);
      setTotalCount(res.total || mapped.length);
    } catch (err) {
      console.error('Failed to load verifications queue:', err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadVerifications();
  }, [loadVerifications]);

  const filters: AdminFilterConfig[] = [
    {
      key: 'status',
      label: 'Review Status',
      value: statusFilter,
      options: [
        { label: 'All Review States', value: 'all' },
        { label: 'Submitted', value: 'submitted' },
        { label: 'Under Review', value: 'under_review' },
        { label: 'Needs Information', value: 'needs_information' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
      ],
    },
  ];

  const handleFilterChange = (key: string, value: string) => {
    if (key === 'status') setStatusFilter(value);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
  };

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortDirection('asc');
    }
  };

  const handleTriggerAction = (rec: VerificationRecord, type: 'approve' | 'reject' | 'request_info') => {
    if (type === 'approve') {
      setActionConfig({
        actionType: 'approve_verification',
        title: 'Approve Provider Verification Dossier',
        entityName: rec.providerName,
        entityId: rec.id,
        consequenceNotice:
          'Approving this application verifies the provider profile, displaying verified badges to clients and enabling dispatch matching.',
        severity: 'primary',
        requireReason: false,
        confirmLabel: 'Approve & Verify',
      });
    } else if (type === 'reject') {
      setActionConfig({
        actionType: 'reject_verification',
        title: 'Reject Provider Verification Application',
        entityName: rec.providerName,
        entityId: rec.id,
        consequenceNotice:
          'Rejecting this submission will notify the partner and decline dispatch authorization until re-application.',
        severity: 'destructive',
        requireReason: true,
        reasonPlaceholder: 'State reason for verification rejection (e.g. illegible ID, expired license)...',
        confirmLabel: 'Reject Submission',
      });
    } else {
      setActionConfig({
        actionType: 'request_verification_info',
        title: 'Request Additional Compliance Documents',
        entityName: rec.providerName,
        entityId: rec.id,
        consequenceNotice:
          'The application status will be placed on hold while the applicant submits requested clarification.',
        severity: 'warning',
        requireReason: true,
        reasonPlaceholder: 'Detail missing items required for approval...',
        confirmLabel: 'Request Info',
      });
    }
  };

  const handleConfirmAction = async (reason?: string) => {
    if (!actionConfig) return;
    try {
      if (actionConfig.actionType === 'approve_verification') {
        await AdminService.reviewVerification(actionConfig.entityId, {
          status: 'APPROVED',
          reviewerNotes: reason || 'Approved via admin console',
        });
      } else if (actionConfig.actionType === 'reject_verification') {
        await AdminService.reviewVerification(actionConfig.entityId, {
          status: 'REJECTED',
          rejectionReason: reason || 'Rejected via admin console',
        });
      } else if (actionConfig.actionType === 'request_verification_info') {
        await AdminService.reviewVerification(actionConfig.entityId, {
          status: 'NEEDS_INFORMATION',
          reviewerNotes: reason || 'Requested further information',
        });
      }
      setActionConfig(null);
      await loadVerifications();
    } catch (err) {
      console.error('Failed to submit verification review:', err);
    }
  };

  const columns: ColumnDef<VerificationRecord>[] = [
    {
      key: 'providerName',
      header: 'Applicant Partner',
      sortable: true,
      render: (rec) => (
        <div>
          <div className="font-semibold text-neutral-900">{rec.providerName}</div>
          <div className="text-xs text-neutral-500 font-mono mt-0.5">{rec.phoneMasked}</div>
        </div>
      ),
    },
    {
      key: 'tradeCategory',
      header: 'Trade & Experience',
      render: (rec) => (
        <div>
          <span className="text-xs font-semibold text-neutral-800">{rec.tradeCategory}</span>
          <div className="text-xs text-neutral-500">{rec.experienceYears} years exp.</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Review State',
      sortable: true,
      render: (rec) => <VerificationStatusBadge status={rec.status} />,
    },
    {
      key: 'documents',
      header: 'Documents',
      render: (rec) => (
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-neutral-100 text-neutral-700">
          {rec.documents.length} docs submitted
        </span>
      ),
    },
    {
      key: 'submittedAt',
      header: 'Submission Date',
      sortable: true,
      render: (rec) => <span className="text-xs text-neutral-600">{rec.submittedAt}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (rec) => (
        <div className="flex items-center justify-end gap-1.5">
          <Link to={`/admin/verification/${rec.id}`}>
            <Button variant="outline" size="sm" leftIcon={<Eye size={13} />} className="text-xs h-7 px-2">
              Review
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleTriggerAction(rec, 'request_info')}
            className="text-xs h-7 px-2 text-warning-700 hover:bg-warning-50"
            title="Request Info"
          >
            <FileQuestion size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleTriggerAction(rec, 'reject')}
            className="text-xs h-7 px-2 text-error-700 hover:bg-error-50"
            title="Reject Submission"
          >
            <XCircle size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleTriggerAction(rec, 'approve')}
            className="text-xs h-7 px-2 text-emerald-700 hover:bg-emerald-50"
            title="Approve Verification"
          >
            <ShieldCheck size={14} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader
        title="Provider Verification Center"
        description="Verify service partner credentials, government identification records, trade certificates, and police clearances."
        breadcrumbs={[{ label: 'Admin' }, { label: 'Verification' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />}
              onClick={loadVerifications}
            >
              Refresh
            </Button>
            <Badge variant="neutral" size="md">
              {totalCount} In Verification Queue
            </Badge>
          </div>
        }
      />

      <AdminFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search verification applications by name, phone, or trade..."
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        totalFilteredCount={queue.length}
      />

      <AdminTable<VerificationRecord>
        columns={columns}
        data={queue}
        keyExtractor={(r) => r.id}
        isLoading={isLoading}
        emptyTitle="Verification Queue Clear"
        emptyDescription="There are currently no partner verification dossiers pending administrative review."
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSort={handleSort}
        totalItems={totalCount}
      />

      <AdminActionDialog
        isOpen={Boolean(actionConfig)}
        onClose={() => setActionConfig(null)}
        config={actionConfig}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
};
