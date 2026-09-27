import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, RefreshCw } from 'lucide-react';
import { PageHeader } from '../../layouts/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { AdminTable, ColumnDef } from '../../components/admin/AdminTable';
import { AdminFilterBar, AdminFilterConfig } from '../../components/admin/AdminFilterBar';
import { TransactionStatusBadge, PaymentStatusBadge } from '../../components/transaction';
import type { AdminBookingItem } from '../../types/admin';

export const AdminBookingsPage: React.FC = () => {
  const [bookings] = useState<AdminBookingItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('scheduledDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const filters: AdminFilterConfig[] = [
    {
      key: 'status',
      label: 'Dispatch Status',
      value: statusFilter,
      options: [
        { label: 'All Booking States', value: 'all' },
        { label: 'Requested', value: 'requested' },
        { label: 'Confirmed', value: 'confirmed' },
        { label: 'In Progress', value: 'in_progress' },
        { label: 'Completed', value: 'completed' },
        { label: 'Cancelled', value: 'cancelled' },
        { label: 'Disputed', value: 'disputed' },
      ],
    },
    {
      key: 'payment',
      label: 'Payment State',
      value: paymentFilter,
      options: [
        { label: 'All Payment States', value: 'all' },
        { label: 'Held in Escrow', value: 'held_in_escrow' },
        { label: 'Released', value: 'released' },
        { label: 'Pending', value: 'pending' },
        { label: 'Refunded', value: 'refunded' },
        { label: 'Failed', value: 'failed' },
      ],
    },
  ];

  const handleFilterChange = (key: string, value: string) => {
    if (key === 'status') setStatusFilter(value);
    if (key === 'payment') setPaymentFilter(value);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPaymentFilter('all');
  };

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortDirection('asc');
    }
  };

  const columns: ColumnDef<AdminBookingItem>[] = [
    {
      key: 'serviceTitle',
      header: 'Service & Category',
      sortable: true,
      render: (b) => (
        <div>
          <div className="font-semibold text-neutral-900">{b.serviceTitle}</div>
          <div className="text-xs text-neutral-500">{b.categoryName}</div>
        </div>
      ),
    },
    {
      key: 'customerNameMasked',
      header: 'Customer',
      render: (b) => (
        <span className="text-xs font-mono text-neutral-700">{b.customerNameMasked}</span>
      ),
    },
    {
      key: 'providerNameMasked',
      header: 'Provider',
      render: (b) => (
        <span className="text-xs font-mono text-neutral-700">{b.providerNameMasked || 'Unassigned'}</span>
      ),
    },
    {
      key: 'scheduledDate',
      header: 'Scheduled Slot',
      sortable: true,
      render: (b) => (
        <span className="text-xs text-neutral-700">
          {b.scheduledDate} &bull; {b.scheduledTime}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Booking Status',
      sortable: true,
      render: (b) => <TransactionStatusBadge status={b.status} />,
    },
    {
      key: 'paymentStatus',
      header: 'Payment State',
      sortable: true,
      render: (b) => <PaymentStatusBadge status={b.paymentStatus} />,
    },
    {
      key: 'totalAmount',
      header: 'Amount',
      sortable: true,
      render: (b) => (
        <span className="text-xs font-semibold text-neutral-900">
          ₹{b.totalAmount}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (b) => (
        <Link to={`/admin/bookings/${b.id}`}>
          <Button variant="outline" size="sm" leftIcon={<Eye size={13} />} className="text-xs h-7 px-2">
            Operations
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader
        title="Booking Dispatch &amp; Fulfillment Operations"
        description="Monitor end-to-end customer service bookings, provider dispatch assignments, and escrow transactions."
        breadcrumbs={[{ label: 'Admin' }, { label: 'Bookings' }]}
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
              0 Active Bookings
            </Badge>
          </div>
        }
      />

      <AdminFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search bookings by service, ID, or customer reference..."
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        totalFilteredCount={bookings.length}
      />

      <AdminTable<AdminBookingItem>
        columns={columns}
        data={bookings}
        keyExtractor={(b) => b.id}
        isLoading={isLoading}
        emptyTitle="No Bookings in Dispatch Pipeline"
        emptyDescription="There are currently no active or historical customer service bookings matching your filter criteria."
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSort={handleSort}
        totalItems={bookings.length}
      />
    </div>
  );
};
