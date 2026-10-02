import React, { useState, useEffect, useCallback } from 'react';
import { Eye, RefreshCw } from 'lucide-react';
import { PageHeader } from '../../layouts/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Textarea } from '../../components/ui/Textarea';
import { AdminTable, ColumnDef } from '../../components/admin/AdminTable';
import { AdminFilterBar, AdminFilterConfig } from '../../components/admin/AdminFilterBar';
import { SupportStatusBadge, DisputePriorityBadge } from '../../components/admin/AdminStatusBadge';
import { AdminService } from '../../services/admin.service';
import type { SupportTicket } from '../../types/admin';

export const AdminSupportPage: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [internalReply, setInternalReply] = useState<string>('');

  const loadTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      const statusParam = statusFilter !== 'all' ? statusFilter.toUpperCase() : undefined;
      const priorityParam = priorityFilter !== 'all' ? priorityFilter.toUpperCase() : undefined;

      const res = await AdminService.listSupportTickets({
        status: statusParam,
        priority: priorityParam,
      });

      const mapped: SupportTicket[] = (res.tickets || []).map((t: any) => ({
        id: t.id,
        ticketNumber: `TCK-${t.id.slice(-6).toUpperCase()}`,
        requesterNameMasked: t.requester?.fullName || 'Requester',
        requesterRole: (t.requester?.role?.toLowerCase() as any) || 'customer',
        contactEmailMasked: t.requester?.email ? `${t.requester.email.slice(0, 2)}***@***` : undefined,
        category: t.category || 'General',
        subject: t.subject,
        description: t.description,
        status: (t.status?.toLowerCase() as any) || 'open',
        priority: (t.priority?.toLowerCase() as any) || 'medium',
        createdAt: t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'N/A',
        lastUpdated: t.updatedAt ? new Date(t.updatedAt).toLocaleDateString() : 'N/A',
        assignedAgent: t.assignedAdmin?.fullName,
        bookingReference: t.bookingId ? `BKG-${t.bookingId.slice(-6).toUpperCase()}` : undefined,
      }));

      setTickets(mapped);
      setTotalCount(res.total || mapped.length);
    } catch (err) {
      console.error('Failed to load support tickets:', err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, priorityFilter]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const filters: AdminFilterConfig[] = [
    {
      key: 'status',
      label: 'Ticket Status',
      value: statusFilter,
      options: [
        { label: 'All Statuses', value: 'all' },
        { label: 'Open', value: 'open' },
        { label: 'Pending', value: 'pending' },
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

  const handleUpdateTicket = async (newStatus?: string) => {
    if (!selectedTicket) return;
    try {
      await AdminService.updateSupportTicket(selectedTicket.id, {
        status: (newStatus?.toUpperCase() as any) || undefined,
        internalNotes: internalReply || undefined,
      });
      setSelectedTicket(null);
      setInternalReply('');
      await loadTickets();
    } catch (err) {
      console.error('Failed to update ticket:', err);
    }
  };

  const columns: ColumnDef<SupportTicket>[] = [
    {
      key: 'ticketNumber',
      header: 'Ticket # & Subject',
      sortable: true,
      render: (t) => (
        <div>
          <div className="font-semibold text-neutral-900">{t.ticketNumber}</div>
          <div className="text-xs text-neutral-700 truncate max-w-xs">{t.subject}</div>
        </div>
      ),
    },
    {
      key: 'requesterNameMasked',
      header: 'Requester',
      render: (t) => (
        <div>
          <div className="text-xs font-mono text-neutral-800">{t.requesterNameMasked}</div>
          <div className="text-[11px] text-neutral-500 capitalize">{t.requesterRole}</div>
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      sortable: true,
      render: (t) => <DisputePriorityBadge priority={t.priority} />,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (t) => <SupportStatusBadge status={t.status} />,
    },
    {
      key: 'category',
      header: 'Category',
      render: (t) => <span className="text-xs text-neutral-600 capitalize">{t.category}</span>,
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (t) => <span className="text-xs text-neutral-600">{t.createdAt}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (t) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedTicket(t)}
          leftIcon={<Eye size={13} />}
          className="text-xs h-7 px-2"
        >
          Inspect
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader
        title="Support Operations &amp; Inquiries"
        description="Review inbound service inquiries, platform assistance requests, and customer support threads."
        breadcrumbs={[{ label: 'Admin' }, { label: 'Support' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />}
              onClick={loadTickets}
            >
              Refresh
            </Button>
            <Badge variant="neutral" size="md">
              {totalCount} Active Tickets
            </Badge>
          </div>
        }
      />

      <AdminFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search support tickets by ticket #, requester, or subject..."
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        totalFilteredCount={tickets.length}
      />

      <AdminTable<SupportTicket>
        columns={columns}
        data={tickets}
        keyExtractor={(t) => t.id}
        isLoading={isLoading}
        emptyTitle="Support Inbox Cleared"
        emptyDescription="There are currently no open support requests awaiting response from operations."
        totalItems={totalCount}
      />

      {/* Ticket Inspection Modal Structure */}
      {selectedTicket && (
        <Modal
          isOpen={Boolean(selectedTicket)}
          onClose={() => setSelectedTicket(null)}
          title={`Support Ticket ${selectedTicket.ticketNumber}`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-neutral-800">{selectedTicket.subject}</span>
                <p className="text-neutral-500 mt-0.5">Requester: {selectedTicket.requesterNameMasked}</p>
              </div>
              <div className="flex items-center gap-2">
                <SupportStatusBadge status={selectedTicket.status} />
              </div>
            </div>

            <div className="p-3 bg-white rounded-lg border border-neutral-200 text-xs text-neutral-700">
              <span className="font-semibold block mb-1">Inquiry Description:</span>
              <p>{selectedTicket.description}</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Internal Operator Note / Response Draft
              </label>
              <Textarea
                rows={3}
                value={internalReply}
                onChange={(e) => setInternalReply(e.target.value)}
                placeholder="Draft response or add internal handling notes..."
                className="text-xs"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-neutral-200">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUpdateTicket('resolved')}
                >
                  Mark Resolved
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUpdateTicket('closed')}
                >
                  Close Ticket
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedTicket(null)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleUpdateTicket()}
                >
                  Save Notes
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
