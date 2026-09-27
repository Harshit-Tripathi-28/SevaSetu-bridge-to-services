import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, ShieldAlert, CheckCircle2, RefreshCw } from 'lucide-react';
import { PageHeader } from '../../layouts/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { AdminTable, ColumnDef } from '../../components/admin/AdminTable';
import { AdminFilterBar, AdminFilterConfig } from '../../components/admin/AdminFilterBar';
import { DisputeStatusBadge, DisputePriorityBadge } from '../../components/admin/AdminStatusBadge';
import { AdminActionDialog } from '../../components/admin/AdminActionDialog';
import type { DisputeCase, AdminActionDialogConfig } from '../../types/admin';

export const AdminDisputesPage: React.FC = () => {
  const [cases] = useState<DisputeCase[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [actionConfig, setActionConfig] = useState<AdminActionDialogConfig | null>(null);

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
    {
      key: 'category',
      label: 'Dispute Category',
      value: categoryFilter,
      options: [
        { label: 'All Categories', value: 'all' },
        { label: 'Payment Issue', value: 'payment_issue' },
        { label: 'Service Quality', value: 'service_quality' },
        { label: 'Cancellation / Refund', value: 'cancellation_refund' },
        { label: 'Safety & Trust', value: 'safety_trust' },
        { label: 'Property Damage', value: 'property_damage' },
      ],
    },
  ];

  const handleFilterChange = (key: string, value: string) => {
    if (key === 'status') setStatusFilter(value);
    if (key === 'priority') setPriorityFilter(value);
    if (key === 'category') setCategoryFilter(value);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setCategoryFilter('all');
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
              onClick={() => {
                setIsLoading(true);
                setTimeout(() => setIsLoading(false), 300);
              }}
            >
              Refresh
            </Button>
            <Badge variant="neutral" size="md">
              0 Active Cases
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
        totalItems={cases.length}
      />

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
