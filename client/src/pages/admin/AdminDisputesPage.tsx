import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Eye, ShieldAlert, CheckCircle2, RefreshCw } from 'lucide-react';
import { PageHeader } from '../../layouts/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { AdminTable, ColumnDef } from '../../components/admin/AdminTable';
import { AdminFilterBar, AdminFilterConfig } from '../../components/admin/AdminFilterBar';
import { DisputeStatusBadge, DisputePriorityBadge } from '../../components/admin/AdminStatusBadge';
import { AdminActionDialog } from '../../components/admin/AdminActionDialog';
import { AdminService } from '../../services/admin.service';
import type { DisputeCase, AdminActionDialogConfig } from '../../types/admin';

export const AdminDisputesPage: React.FC = () => {
  const [cases, setCases] = useState<DisputeCase[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [actionConfig, setActionConfig] = useState<AdminActionDialogConfig | null>(null);

  const loadDisputes = useCallback(async () => {
    setIsLoading(true);
    try {
      const statusParam = statusFilter !== 'all' ? statusFilter.toUpperCase() : undefined;
      const priorityParam = priorityFilter !== 'all' ? priorityFilter.toUpperCase() : undefined;

      const res = await AdminService.listDisputes({
        status: statusParam,
        priority: priorityParam,
      });

      const mapped: DisputeCase[] = (res.disputes || []).map((d: any) => ({
        id: d.id,
        caseNumber: `DSP-${d.id.slice(-6).toUpperCase()}`,
        bookingId: d.bookingId,
        bookingRef: d.booking?.id ? `BKG-${d.booking.id.slice(-6).toUpperCase()}` : undefined,
        serviceTitle: d.booking?.serviceTitleSnapshot || 'Service',
        reporterRole: (d.openedBy?.role?.toLowerCase() as any) || 'customer',
        reporterNameMasked: d.openedBy?.fullName || 'Client',
        respondentNameMasked: d.booking?.provider?.user?.fullName || 'Service Provider',
        category: (d.category?.toLowerCase() as any) || 'service_quality',
        priority: (d.priority?.toLowerCase() as any) || 'medium',
        status: (d.status?.toLowerCase() as any) || 'open',
        issueSummary: d.description?.slice(0, 100) || 'Service dispute filed',
        detailedDescription: d.description || '',
        amountInvolved: d.amountInvolvedPaise ? d.amountInvolvedPaise / 100 : undefined,
        createdAt: d.createdAt ? new Date(d.createdAt).toLocaleDateString() : 'N/A',
        updatedAt: d.updatedAt ? new Date(d.updatedAt).toLocaleDateString() : 'N/A',
        assignedOperator: d.assignedAdmin?.fullName,
        resolutionSummary: d.resolution,
      }));

      setCases(mapped);
      setTotalCount(res.total || mapped.length);
    } catch (err) {
      console.error('Failed to load disputes:', err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, priorityFilter]);

  useEffect(() => {
    loadDisputes();
  }, [loadDisputes]);

  const filters: AdminFilterConfig[] = [
    {
      key: 'status',
      label: 'Case Status',
      value: statusFilter,
      options: [
        { label: 'All Statuses', value: 'all' },
        { label: 'Open', value: 'open' },
        { label: 'Under Review', value: 'under_review' },
        { label: 'Waiting for Info', value: 'waiting_for_info' },
        { label: 'Resolved', value: 'resolved' },
        { label: 'Closed', value: 'closed' },
      ],
    },
    {
      key: 'priority',
      label: 'Priority Level',
      value: priorityFilter,
      options: [
        { label: 'All Priorities', value: 'all' },
        { label: 'Urgent', value: 'urgent' },
        { label: 'High', value: 'high' },
        { label: 'Medium', value: 'medium' },
        { label: 'Low', value: 'low' },
      ],
    },
  ];

  const handleFilterChange = (key: string, value: string) => {
    if (key === 'status') setStatusFilter(value);
    if (key === 'priority') setPriorityFilter(value);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPriorityFilter('all');
  };

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortDirection('asc');
    }
  };

  const handleTriggerAction = (c: DisputeCase, type: 'resolve' | 'escalate') => {
    if (type === 'resolve') {
      setActionConfig({
        actionType: 'resolve_dispute',
        title: 'Confirm Dispute Resolution',
        entityName: `Case ${c.caseNumber}`,
        entityId: c.id,
        consequenceNotice:
          'Resolving this dispute marks investigation complete and closes escrow holds according to the determined resolution.',
        severity: 'primary',
        requireReason: true,
        reasonPlaceholder: 'Summarize resolution findings and refund/release decisions...',
        confirmLabel: 'Resolve Case',
      });
    } else {
      setActionConfig({
        actionType: 'escalate_dispute',
        title: 'Escalate Dispute to Legal / Trust Lead',
        entityName: `Case ${c.caseNumber}`,
        entityId: c.id,
        consequenceNotice:
          'Escalating transfers this dossier to senior operations management with urgent priority flag.',
        severity: 'warning',
        requireReason: true,
        reasonPlaceholder: 'State reason for managerial escalation...',
        confirmLabel: 'Escalate Case',
      });
    }
  };

  const handleConfirmAction = async (reason?: string) => {
    if (!actionConfig) return;
    try {
      if (actionConfig.actionType === 'resolve_dispute') {
        await AdminService.transitionDispute(actionConfig.entityId, {
          status: 'RESOLVED',
          resolution: reason || 'Dispute resolved via admin console',
        });
      } else if (actionConfig.actionType === 'escalate_dispute') {
        await AdminService.transitionDispute(actionConfig.entityId, {
          status: 'UNDER_REVIEW',
          internalNotes: reason || 'Escalated to senior operations review',
        });
      }
      setActionConfig(null);
      await loadDisputes();
    } catch (err) {
      console.error('Failed to update dispute:', err);
    }
  };

  const columns: ColumnDef<DisputeCase>[] = [
    {
      key: 'caseNumber',
      header: 'Case # & Category',
      sortable: true,
      render: (c) => (
        <div>
          <div className="font-semibold text-neutral-900">{c.caseNumber}</div>
          <div className="text-xs text-neutral-500 capitalize">{c.category.replace('_', ' ')}</div>
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      sortable: true,
      render: (c) => <DisputePriorityBadge priority={c.priority} />,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (c) => <DisputeStatusBadge status={c.status} />,
    },
    {
      key: 'reporterNameMasked',
      header: 'Reporter',
      render: (c) => (
        <span className="text-xs font-mono text-neutral-700">
          {c.reporterNameMasked} ({c.reporterRole})
        </span>
      ),
    },
    {
      key: 'bookingRef',
      header: 'Related Booking',
      render: (c) => (
        <span className="text-xs font-mono text-neutral-600">{c.bookingRef || 'None'}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Opened Date',
      sortable: true,
      render: (c) => <span className="text-xs text-neutral-600">{c.createdAt}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (c) => (
        <div className="flex items-center justify-end gap-1.5">
          <Link to={`/admin/reports/${c.id}`}>
            <Button variant="outline" size="sm" leftIcon={<Eye size={13} />} className="text-xs h-7 px-2">
              Dossier
            </Button>
          </Link>
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
            onClick={() => handleTriggerAction(c, 'resolve')}
            className="text-xs h-7 px-2 text-emerald-700 hover:bg-emerald-50"
            title="Resolve"
          >
            <CheckCircle2 size={14} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader
        title="Disputes &amp; Reports Center"
        description="Investigate service complaints, payment discrepancies, property damage claims, and platform conduct violations."
        breadcrumbs={[{ label: 'Admin' }, { label: 'Disputes' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />}
              onClick={loadDisputes}
            >
              Refresh
            </Button>
            <Badge variant="neutral" size="md">
              {totalCount} Active Cases
            </Badge>
          </div>
        }
      />

      <AdminFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search disputes by case #, customer, or provider..."
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        totalFilteredCount={cases.length}
      />

      <AdminTable<DisputeCase>
        columns={columns}
        data={cases}
        keyExtractor={(c) => c.id}
        isLoading={isLoading}
        emptyTitle="No Active Disputes or Reports"
        emptyDescription="There are currently no open service disputes, payment conflicts, or safety incidents in the queue."
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
