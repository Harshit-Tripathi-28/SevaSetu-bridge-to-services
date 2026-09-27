import React, { useState } from 'react';
import { Eye, RefreshCw } from 'lucide-react';
import { PageHeader } from '../../layouts/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { AdminTable, ColumnDef } from '../../components/admin/AdminTable';
import { AdminFilterBar, AdminFilterConfig } from '../../components/admin/AdminFilterBar';
import type { AuditLogEntry } from '../../types/admin';

export const AdminAuditLogsPage: React.FC = () => {
  const [logs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);

  const filters: AdminFilterConfig[] = [
    {
      key: 'entity',
      label: 'Target Entity',
      value: entityFilter,
      options: [
        { label: 'All Entities', value: 'all' },
        { label: 'User', value: 'User' },
        { label: 'Provider', value: 'Provider' },
        { label: 'Booking', value: 'Booking' },
        { label: 'Verification', value: 'Verification' },
        { label: 'Dispute', value: 'Dispute' },
        { label: 'Service', value: 'Service' },
      ],
    },
  ];

  const handleFilterChange = (key: string, value: string) => {
    if (key === 'entity') setEntityFilter(value);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setEntityFilter('all');
  };

  const columns: ColumnDef<AuditLogEntry>[] = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      sortable: true,
      render: (log) => <span className="text-xs font-mono text-neutral-600">{log.timestamp}</span>,
    },
    {
      key: 'actor',
      header: 'Operator / Actor',
      render: (log) => (
        <div>
          <span className="text-xs font-semibold text-neutral-900">{log.actor.name}</span>
          <div className="text-[11px] text-neutral-500 capitalize">{log.actor.role}</div>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action Executed',
      render: (log) => (
        <span className="text-xs font-medium px-2 py-0.5 rounded bg-neutral-100 text-neutral-800 font-mono">
          {log.action}
        </span>
      ),
    },
    {
      key: 'entity',
      header: 'Entity Ref',
      render: (log) => (
        <div>
          <span className="text-xs font-semibold text-neutral-800">{log.entity}</span>
          <div className="text-[11px] text-neutral-500 font-mono">{log.entityId}</div>
        </div>
      ),
    },
    {
      key: 'details',
      header: 'Audit Summary',
      render: (log) => <span className="text-xs text-neutral-600 truncate max-w-xs">{log.details}</span>,
    },
    {
      key: 'ipAddressMasked',
      header: 'IP (Masked)',
      render: (log) => (
        <span className="text-xs font-mono text-neutral-500">{log.ipAddressMasked || 'Internal'}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Audit View',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (log) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedEntry(log)}
          leftIcon={<Eye size={12} />}
          className="text-xs h-7 px-2"
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader
        title="Administrative Audit &amp; Event Logs"
        description="Immutable read-oriented audit trail tracking administrative actions, status mutations, and security events."
        breadcrumbs={[{ label: 'Admin' }, { label: 'Audit Logs' }]}
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
              0 Logged Events
            </Badge>
          </div>
        }
      />

      <AdminFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search audit logs by actor, action name, or entity ID..."
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        totalFilteredCount={logs.length}
      />

      <AdminTable<AuditLogEntry>
        columns={columns}
        data={logs}
        keyExtractor={(l) => l.id}
        isLoading={isLoading}
        emptyTitle="No Audit Events Recorded"
        emptyDescription="Audit records will automatically be logged when operational mutations or governance actions are executed."
        totalItems={logs.length}
      />

      {selectedEntry && (
        <Modal
          isOpen={Boolean(selectedEntry)}
          onClose={() => setSelectedEntry(null)}
          title="Audit Log Event Inspection"
          size="md"
        >
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
              <span className="text-neutral-500 font-medium block">Action:</span>
              <span className="font-mono font-bold text-neutral-900">{selectedEntry.action}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                <span className="text-neutral-500 font-medium block">Actor:</span>
                <span className="font-semibold text-neutral-900">{selectedEntry.actor.name}</span>
                <span className="text-[11px] text-neutral-500 block capitalize">Role: {selectedEntry.actor.role}</span>
              </div>

              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                <span className="text-neutral-500 font-medium block">Target Entity:</span>
                <span className="font-semibold text-neutral-900">{selectedEntry.entity}</span>
                <span className="text-[11px] font-mono text-neutral-500 block">ID: {selectedEntry.entityId}</span>
              </div>
            </div>

            <div className="p-3 bg-white rounded-lg border border-neutral-200">
              <span className="text-neutral-500 font-medium block mb-1">Details:</span>
              <p className="text-neutral-800">{selectedEntry.details}</p>
            </div>

            <div className="flex justify-end pt-3 border-t border-neutral-200">
              <Button variant="outline" size="sm" onClick={() => setSelectedEntry(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
