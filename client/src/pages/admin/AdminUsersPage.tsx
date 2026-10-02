import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, ShieldAlert, UserX, RefreshCw } from 'lucide-react';
import { PageHeader } from '../../layouts/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { AdminTable, ColumnDef } from '../../components/admin/AdminTable';
import { AdminFilterBar, AdminFilterConfig } from '../../components/admin/AdminFilterBar';
import { AccountStatusBadge } from '../../components/admin/AdminStatusBadge';
import { AdminActionDialog } from '../../components/admin/AdminActionDialog';
import { AdminService } from '../../services/admin.service';
import type { AdminUserItem, AdminActionDialogConfig, AdminUserRole, AdminAccountStatus } from '../../types/admin';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionConfig, setActionConfig] = useState<AdminActionDialogConfig | null>(null);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const roleParam = roleFilter !== 'all' ? roleFilter.toUpperCase() : undefined;
      const statusParam = statusFilter !== 'all' ? statusFilter.toUpperCase() : undefined;
      const data = await AdminService.listUsers({
        search: searchQuery || undefined,
        role: roleParam,
        status: statusParam,
      });
      const mapped: AdminUserItem[] = (data.users || []).map((u: any) => ({
        id: u.id,
        fullName: u.fullName || 'User',
        emailMasked: u.email ? u.email.replace(/(.{2})(.*)(@.*)/, '$1***$3') : '',
        phoneMasked: u.phone ? u.phone.replace(/(\d{2})(\d{4})(\d{4})/, '$1****$3') : '—',
        role: (u.role?.toLowerCase() || 'customer') as AdminUserRole,
        status: (u.status?.toLowerCase() || 'active') as AdminAccountStatus,
        createdAt: u.createdAt,
        bookingsCount: u.activitySummary?.bookingsCount || 0,
        reportsCount: u.activitySummary?.reportsCount || 0,
        city: 'Kanpur',
      }));
      setUsers(mapped);
    } catch {
      // Keep empty on error
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    loadUsers();
  }, [searchQuery, statusFilter, roleFilter]);

  // Filter definitions
  const filters: AdminFilterConfig[] = [
    {
      key: 'status',
      label: 'Account Status',
      value: statusFilter,
      options: [
        { label: 'All Statuses', value: 'all' },
        { label: 'Active', value: 'active' },
        { label: 'Under Review', value: 'under_review' },
        { label: 'Restricted', value: 'restricted' },
        { label: 'Suspended', value: 'suspended' },
        { label: 'Inactive', value: 'inactive' },
      ],
    },
    {
      key: 'role',
      label: 'Account Role',
      value: roleFilter,
      options: [
        { label: 'All Roles', value: 'all' },
        { label: 'Customer', value: 'customer' },
        { label: 'Provider', value: 'provider' },
        { label: 'Operator', value: 'operator' },
        { label: 'Admin', value: 'admin' },
      ],
    },
  ];

  const handleFilterChange = (key: string, value: string) => {
    if (key === 'status') setStatusFilter(value);
    if (key === 'role') setRoleFilter(value);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setRoleFilter('all');
  };

  const handleSort = (columnKey: string) => {
    if (sortBy === columnKey) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(columnKey);
      setSortDirection('asc');
    }
  };

  const handleTriggerAction = (user: AdminUserItem, type: 'suspend' | 'restrict') => {
    if (type === 'suspend') {
      setActionConfig({
        actionType: 'suspend_user',
        title: 'Confirm User Account Suspension',
        entityName: user.fullName,
        entityId: user.id,
        consequenceNotice:
          'Suspending this user will immediately revoke login access, cancel all pending requests, and freeze active communication sessions.',
        severity: 'destructive',
        requireReason: true,
        reasonPlaceholder: 'Specify legal or terms-of-service violation reason...',
        confirmLabel: 'Suspend Account',
      });
    } else {
      setActionConfig({
        actionType: 'restrict_user',
        title: 'Restrict User Account Permissions',
        entityName: user.fullName,
        entityId: user.id,
        consequenceNotice:
          'Restricting this account will prevent creating new service requests and submitting ratings while an operational review is pending.',
        severity: 'warning',
        requireReason: true,
        reasonPlaceholder: 'State reason for restriction...',
        confirmLabel: 'Apply Restriction',
      });
    }
  };

  // Table Column Definitions
  const columns: ColumnDef<AdminUserItem>[] = [
    {
      key: 'fullName',
      header: 'User / Identity',
      sortable: true,
      render: (user) => (
        <div>
          <div className="font-semibold text-neutral-900">{user.fullName}</div>
          <div className="text-xs text-neutral-500 font-mono mt-0.5">{user.emailMasked}</div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      render: (user) => (
        <span className="capitalize text-xs font-semibold px-2 py-0.5 rounded bg-neutral-100 text-neutral-700">
          {user.role}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (user) => <AccountStatusBadge status={user.status} />,
    },
    {
      key: 'phoneMasked',
      header: 'Phone (Masked)',
      render: (user) => (
        <span className="text-xs font-mono text-neutral-600">{user.phoneMasked}</span>
      ),
    },
    {
      key: 'city',
      header: 'Location',
      render: (user) => <span className="text-xs text-neutral-600">{user.city || '—'}</span>,
    },
    {
      key: 'createdAt',
      header: 'Registered',
      sortable: true,
      render: (user) => <span className="text-xs text-neutral-600">{user.createdAt}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (user) => (
        <div className="flex items-center justify-end gap-1.5">
          <Link to={`/admin/users/${user.id}`}>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Eye size={13} />}
              className="text-xs h-7 px-2"
            >
              Details
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleTriggerAction(user, 'restrict')}
            className="text-xs h-7 px-2 text-warning-700 hover:bg-warning-50"
            title="Restrict User"
          >
            <ShieldAlert size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleTriggerAction(user, 'suspend')}
            className="text-xs h-7 px-2 text-error-700 hover:bg-error-50"
            title="Suspend User"
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
        title="User Account Management"
        description="Search, inspect, and govern platform customer, partner, and administrative accounts."
        breadcrumbs={[{ label: 'Admin' }, { label: 'Users' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />}
              onClick={loadUsers}
            >
              Refresh
            </Button>
            <Badge variant="neutral" size="md">
              {users.length} Total Accounts
            </Badge>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <AdminFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search users by name, masked email, or reference ID..."
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        totalFilteredCount={users.length}
      />

      {/* Data Table */}
      <AdminTable<AdminUserItem>
        columns={columns}
        data={users}
        keyExtractor={(u) => u.id}
        isLoading={isLoading}
        emptyTitle="No User Accounts Found"
        emptyDescription="There are currently no customer or provider user records registered in the platform database."
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
            prev.length === users.length ? [] : users.map((u) => u.id)
          )
        }
        totalItems={users.length}
      />

      {/* High-Impact Governance Action Modal */}
      <AdminActionDialog
        isOpen={Boolean(actionConfig)}
        onClose={() => setActionConfig(null)}
        config={actionConfig}
        onConfirm={async (reason) => {
          if (!actionConfig) return;
          try {
            if (actionConfig.actionType === 'suspend_user') {
              await AdminService.updateUserStatus(actionConfig.entityId, 'SUSPENDED', reason);
            } else if (actionConfig.actionType === 'restrict_user') {
              await AdminService.updateUserStatus(actionConfig.entityId, 'SUSPENDED', reason);
            }
            await loadUsers();
          } catch (err: unknown) {
            alert(err instanceof Error ? err.message : 'Action failed');
          } finally {
            setActionConfig(null);
          }
        }}
      />
    </div>
  );
};
