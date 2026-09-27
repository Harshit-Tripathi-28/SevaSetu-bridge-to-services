import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, ShieldAlert, UserX, RefreshCw } from 'lucide-react';
import { PageHeader } from '../../layouts/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { AdminTable, ColumnDef } from '../../components/admin/AdminTable';
import { AdminFilterBar, AdminFilterConfig } from '../../components/admin/AdminFilterBar';
import { AccountStatusBadge, VerificationStatusBadge } from '../../components/admin/AdminStatusBadge';
import { AdminActionDialog } from '../../components/admin/AdminActionDialog';
import type { AdminProviderItem, AdminActionDialogConfig } from '../../types/admin';

export const AdminProvidersPage: React.FC = () => {
  const [providers] = useState<AdminProviderItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [verificationFilter, setVerificationFilter] = useState<string>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('joinedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionConfig, setActionConfig] = useState<AdminActionDialogConfig | null>(null);

  const filters: AdminFilterConfig[] = [
    {
      key: 'verification',
      label: 'Verification Status',
      value: verificationFilter,
      options: [
        { label: 'All Verifications', value: 'all' },
        { label: 'Approved', value: 'approved' },
        { label: 'Under Review', value: 'under_review' },
        { label: 'Submitted', value: 'submitted' },
        { label: 'Needs Information', value: 'needs_information' },
        { label: 'Rejected', value: 'rejected' },
      ],
    },
    {
      key: 'account',
      label: 'Account Status',
      value: accountFilter,
      options: [
        { label: 'All Accounts', value: 'all' },
        { label: 'Active', value: 'active' },
        { label: 'Restricted', value: 'restricted' },
        { label: 'Suspended', value: 'suspended' },
        { label: 'Under Review', value: 'under_review' },
      ],
    },
    {
      key: 'category',
      label: 'Service Category',
      value: categoryFilter,
      options: [
        { label: 'All Categories', value: 'all' },
        { label: 'Electrician', value: 'electrician' },
        { label: 'Plumbing', value: 'plumbing' },
        { label: 'Carpentry', value: 'carpentry' },
        { label: 'Home Cleaning', value: 'cleaning' },
        { label: 'Appliance Repair', value: 'appliances' },
      ],
    },
  ];

  const handleFilterChange = (key: string, value: string) => {
    if (key === 'verification') setVerificationFilter(value);
    if (key === 'account') setAccountFilter(value);
    if (key === 'category') setCategoryFilter(value);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setVerificationFilter('all');
    setAccountFilter('all');
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

  const handleTriggerAction = (provider: AdminProviderItem, type: 'suspend' | 'restrict') => {
    if (type === 'suspend') {
      setActionConfig({
        actionType: 'suspend_provider',
        title: 'Confirm Service Partner Suspension',
        entityName: provider.fullName,
        entityId: provider.id,
        consequenceNotice:
          'Suspending this provider will delist them from customer discovery, cancel active job appointments, and freeze lead generation.',
        severity: 'destructive',
        requireReason: true,
        reasonPlaceholder: 'Specify compliance or service failure justification...',
        confirmLabel: 'Suspend Partner',
      });
    } else {
      setActionConfig({
        actionType: 'restrict_provider',
        title: 'Restrict Partner Dispatch Access',
        entityName: provider.fullName,
        entityId: provider.id,
        consequenceNotice:
          'Restricting this partner will temporarily hold new customer job requests while internal review is ongoing.',
        severity: 'warning',
        requireReason: true,
        reasonPlaceholder: 'State reason for partner dispatch hold...',
        confirmLabel: 'Apply Restriction',
      });
    }
  };

  const columns: ColumnDef<AdminProviderItem>[] = [
    {
      key: 'fullName',
      header: 'Partner / Identity',
      sortable: true,
      render: (p) => (
        <div>
          <div className="font-semibold text-neutral-900">{p.fullName}</div>
          <div className="text-xs text-neutral-500 font-mono mt-0.5">{p.phoneMasked}</div>
        </div>
      ),
    },
    {
      key: 'categoryNames',
      header: 'Primary Trade',
      render: (p) => (
        <div className="flex flex-wrap gap-1">
          {p.categoryNames.map((cat) => (
            <Badge key={cat} variant="neutral" size="sm">
              {cat}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'verificationStatus',
      header: 'Verification',
      sortable: true,
      render: (p) => <VerificationStatusBadge status={p.verificationStatus} />,
    },
    {
      key: 'accountStatus',
      header: 'Account',
      sortable: true,
      render: (p) => <AccountStatusBadge status={p.accountStatus} />,
    },
    {
      key: 'serviceArea',
      header: 'Service Zone',
      render: (p) => <span className="text-xs text-neutral-600">{p.serviceArea}</span>,
    },
    {
      key: 'completedJobsCount',
      header: 'Jobs Completed',
      sortable: true,
      render: (p) => <span className="text-xs font-semibold text-neutral-800">{p.completedJobsCount}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (p) => (
        <div className="flex items-center justify-end gap-1.5">
          <Link to={`/admin/providers/${p.id}`}>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Eye size={13} />}
              className="text-xs h-7 px-2"
            >
              Operations
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleTriggerAction(p, 'restrict')}
            className="text-xs h-7 px-2 text-warning-700 hover:bg-warning-50"
            title="Restrict Partner"
          >
            <ShieldAlert size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleTriggerAction(p, 'suspend')}
            className="text-xs h-7 px-2 text-error-700 hover:bg-error-50"
            title="Suspend Partner"
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
        title="Provider Network Management"
        description="Inspect registered trade professionals, monitor verification states, and manage dispatch permissions."
        breadcrumbs={[{ label: 'Admin' }, { label: 'Providers' }]}
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
              0 Service Partners
            </Badge>
          </div>
        }
      />

      <AdminFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search providers by name, trade category, or zone..."
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        totalFilteredCount={providers.length}
      />

      <AdminTable<AdminProviderItem>
        columns={columns}
        data={providers}
        keyExtractor={(p) => p.id}
        isLoading={isLoading}
        emptyTitle="No Service Providers Found"
        emptyDescription="There are currently no service partner profiles matching the applied filters."
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSort={handleSort}
        selectedIds={selectedIds}
        onSelectRow={(id) =>
          setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
          )
        }
        onSelectAll={() =>
          setSelectedIds((prev) =>
            prev.length === providers.length ? [] : providers.map((p) => p.id)
          )
        }
        totalItems={providers.length}
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
