import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  UserX,
  RefreshCw,
  Lock,
} from 'lucide-react';
import { PageHeader } from '../../layouts/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { AdminTable, ColumnDef } from '../../components/admin/AdminTable';
import { AdminFilterBar, AdminFilterConfig } from '../../components/admin/AdminFilterBar';
import { TrustSafetyBadge } from '../../components/admin/AdminStatusBadge';
import { AdminActionDialog } from '../../components/admin/AdminActionDialog';
import { AdminService } from '../../services/admin.service';
import type { TrustSafetyCase, AdminActionDialogConfig } from '../../types/admin';

export const AdminTrustSafetyPage: React.FC = () => {
  const [cases, setCases] = useState<TrustSafetyCase[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [actionConfig, setActionConfig] = useState<AdminActionDialogConfig | null>(null);

  const loadCases = useCallback(async () => {
    setIsLoading(true);
    try {
      const statusParam = statusFilter !== 'all' ? statusFilter.toUpperCase() : undefined;
      const severityParam = severityFilter !== 'all' ? severityFilter.toUpperCase() : undefined;

      const [casesRes, metricsRes] = await Promise.all([
        AdminService.listTrustSafetyCases({
          status: statusParam,
          severity: severityParam,
        }),
        AdminService.getDashboardMetrics(),
      ]);

      const mapped: TrustSafetyCase[] = (casesRes.cases || []).map((c: any) => ({
        id: c.id,
        caseReference: `TSC-${c.id.slice(-6).toUpperCase()}`,
        entityType: (c.entityType?.toLowerCase() as any) || 'customer',
        entityId: c.relatedUserId || c.relatedProviderId || c.relatedBookingId || 'N/A',
        entityNameMasked: c.relatedUser?.fullName || c.relatedProvider?.businessName || 'Entity',
        riskSignal: c.triggerReason || 'Platform Safety Alert',
        signalSeverity: (c.severity?.toLowerCase() as any) || 'medium',
        status: (c.status?.toLowerCase() as any) || 'flagged',
        flaggedAt: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'N/A',
        assignedInvestigator: c.assignedAdmin?.fullName,
        investigationNotes: c.internalNotes,
      }));

      setCases(mapped);
      setTotalCount(casesRes.total || mapped.length);
      setMetrics(metricsRes);
    } catch (err) {
      console.error('Failed to load trust & safety cases:', err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, severityFilter]);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  const filters: AdminFilterConfig[] = [
    {
      key: 'status',
      label: 'Investigation State',
      value: statusFilter,
      options: [
        { label: 'All Investigation States', value: 'all' },
        { label: 'Flagged', value: 'flagged' },
        { label: 'Under Review', value: 'under_review' },
        { label: 'Restricted', value: 'restricted' },
        { label: 'Escalated', value: 'escalated' },
        { label: 'Cleared', value: 'cleared' },
      ],
    },
    {
      key: 'severity',
      label: 'Signal Severity',
      value: severityFilter,
      options: [
        { label: 'All Severities', value: 'all' },
        { label: 'Critical', value: 'critical' },
        { label: 'High', value: 'high' },
        { label: 'Medium', value: 'medium' },
      ],
    },
  ];

  const handleFilterChange = (key: string, value: string) => {
    if (key === 'status') setStatusFilter(value);
    if (key === 'severity') setSeverityFilter(value);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setSeverityFilter('all');
  };

  const handleTriggerAction = (c: TrustSafetyCase, type: 'clear' | 'restrict' | 'escalate') => {
    if (type === 'clear') {
      setActionConfig({
        actionType: 'reactivate_user',
        title: 'Clear Risk Flag & Restore Standing',
        entityName: c.entityNameMasked,
        entityId: c.id,
        consequenceNotice:
          'Clearing removes the trust warning and acknowledges satisfactory review by safety operators.',
        severity: 'primary',
        requireReason: true,
        reasonPlaceholder: 'Summarize justification for clearing the safety flag...',
        confirmLabel: 'Clear Flag',
      });
    } else if (type === 'restrict') {
      setActionConfig({
        actionType: 'restrict_user',
        title: 'Apply Preventative Account Restriction',
        entityName: c.entityNameMasked,
        entityId: c.id,
        consequenceNotice:
          'Restricts dispatch access and request creation while active investigation is completed.',
        severity: 'destructive',
        requireReason: true,
        reasonPlaceholder: 'State safety justification for restriction...',
        confirmLabel: 'Restrict Account',
      });
    } else {
      setActionConfig({
        actionType: 'escalate_dispute',
        title: 'Escalate to Safety & Compliance Directorate',
        entityName: c.entityNameMasked,
        entityId: c.id,
        consequenceNotice:
          'Escalating transfers this safety case to senior platform risk officers.',
        severity: 'warning',
        requireReason: true,
        reasonPlaceholder: 'State reason for executive risk escalation...',
        confirmLabel: 'Escalate Case',
      });
    }
  };

  const handleConfirmAction = async (reason?: string) => {
    if (!actionConfig) return;
    try {
      if (actionConfig.actionType === 'reactivate_user') {
        await AdminService.updateTrustSafetyCase(actionConfig.entityId, {
          status: 'CLEARED',
          resolution: reason || 'Cleared by safety officer',
        });
      } else if (actionConfig.actionType === 'restrict_user') {
        await AdminService.updateTrustSafetyCase(actionConfig.entityId, {
          status: 'RESTRICTED',
          internalNotes: reason || 'Restricted under trust policy',
        });
      } else {
        await AdminService.updateTrustSafetyCase(actionConfig.entityId, {
          status: 'ESCALATED',
          internalNotes: reason || 'Escalated to risk officer',
        });
      }
      setActionConfig(null);
      await loadCases();
    } catch (err) {
      console.error('Failed to update trust & safety case:', err);
    }
  };

  const columns: ColumnDef<TrustSafetyCase>[] = [
    {
      key: 'caseReference',
      header: 'Case Ref & Entity',
      sortable: true,
      render: (c) => (
        <div>
          <div className="font-semibold text-neutral-900">{c.caseReference}</div>
          <div className="text-xs text-neutral-500 font-mono">
            {c.entityNameMasked} ({c.entityType})
          </div>
        </div>
      ),
    },
    {
      key: 'riskSignal',
      header: 'Observed Risk Signal',
      render: (c) => <span className="text-xs text-neutral-700">{c.riskSignal}</span>,
    },
    {
      key: 'signalSeverity',
      header: 'Severity',
      render: (c) => {
        const variant =
          c.signalSeverity === 'critical' ? 'error' : c.signalSeverity === 'high' ? 'warning' : 'neutral';
        return (
          <Badge variant={variant} size="sm">
            {c.signalSeverity.toUpperCase()}
          </Badge>
        );
      },
    },
    {
      key: 'status',
      header: 'Review State',
      sortable: true,
      render: (c) => <TrustSafetyBadge status={c.status} />,
    },
    {
      key: 'flaggedAt',
      header: 'Flagged Timestamp',
      sortable: true,
      render: (c) => <span className="text-xs text-neutral-600">{c.flaggedAt}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (c) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleTriggerAction(c, 'clear')}
            className="text-xs h-7 px-2 text-emerald-700 hover:bg-emerald-50"
            title="Clear Flag"
          >
            <ShieldCheck size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleTriggerAction(c, 'escalate')}
            className="text-xs h-7 px-2 text-warning-700 hover:bg-warning-50"
            title="Escalate"
          >
            <ShieldAlert size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleTriggerAction(c, 'restrict')}
            className="text-xs h-7 px-2 text-error-700 hover:bg-error-50"
            title="Restrict"
          >
            <UserX size={14} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader
        title="Trust, Safety &amp; Risk Governance Hub"
        description="Unified trust monitoring: identity verification pipelines, suspicious behavior signals, and account protection."
        breadcrumbs={[{ label: 'Admin' }, { label: 'Trust & Safety' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />}
              onClick={loadCases}
            >
              Refresh
            </Button>
            <Badge variant="neutral" size="md">
              {totalCount} Active Risk Flags
            </Badge>
          </div>
        }
      />

      {/* Trust & Safety Overview Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="default" padding="md" className="bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Verification Pipeline
            </span>
            <CheckCircle size={16} className="text-amber-500" />
          </div>
          <div className="text-xl font-bold text-neutral-900 mt-2">{metrics?.pendingVerifications ?? 0}</div>
          <p className="text-[11px] text-neutral-400 mt-1">Provider dossiers pending</p>
        </Card>

        <Card variant="default" padding="md" className="bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Dispute Escalations
            </span>
            <AlertTriangle size={16} className="text-red-500" />
          </div>
          <div className="text-xl font-bold text-neutral-900 mt-2">{metrics?.openDisputes ?? 0}</div>
          <p className="text-[11px] text-neutral-400 mt-1">Active customer disputes</p>
        </Card>

        <Card variant="default" padding="md" className="bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Suspicious Signals
            </span>
            <ShieldAlert size={16} className="text-orange-500" />
          </div>
          <div className="text-xl font-bold text-neutral-900 mt-2">{totalCount}</div>
          <p className="text-[11px] text-neutral-400 mt-1">Accounts flagged</p>
        </Card>

        <Card variant="default" padding="md" className="bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Open Support Inquiries
            </span>
            <Lock size={16} className="text-neutral-500" />
          </div>
          <div className="text-xl font-bold text-neutral-900 mt-2">{metrics?.openSupportTickets ?? 0}</div>
          <p className="text-[11px] text-neutral-400 mt-1">Awaiting operations desk</p>
        </Card>
      </div>

      {/* Filter and Cases Table */}
      <div>
        <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-3">
          Suspicious Activity &amp; Risk Review Queue
        </h3>
        <AdminFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search risk cases by ref, masked account, or signal..."
          filters={filters}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
          totalFilteredCount={cases.length}
        />

        <AdminTable<TrustSafetyCase>
          columns={columns}
          data={cases}
          keyExtractor={(c) => c.id}
          isLoading={isLoading}
          emptyTitle="Risk Signals Clean"
          emptyDescription="There are currently no suspicious accounts or fraud signals detected across the platform."
          totalItems={totalCount}
        />
      </div>

      <AdminActionDialog
        isOpen={Boolean(actionConfig)}
        onClose={() => setActionConfig(null)}
        config={actionConfig}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
};
