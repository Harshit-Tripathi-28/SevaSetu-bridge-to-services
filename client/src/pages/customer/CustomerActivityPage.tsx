import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, LifeBuoy } from 'lucide-react';
import { PageContainer } from '../../layouts/PageContainer';
import { PageHeader } from '../../layouts/PageHeader';
import { Button } from '../../components/ui/Button';
import { ActivityList } from '../../components/customer/activity/ActivityList';
import {
  RebookModal,
  CancellationDialog,
  SupportEntry,
} from '../../components/transaction';
import type {
  CustomerActivityItem,
  PaymentStatus,
  RebookSummaryData,
  CancellationReason,
} from '../../types';

export const CustomerActivityPage: React.FC = () => {
  // Activity state with integrated transaction & booking statuses
  const [activityItems, setActivityItems] = useState<
    (CustomerActivityItem & {
      paymentStatus?: PaymentStatus;
      invoiceId?: string;
      hasReviewed?: boolean;
    })[]
  >([
    {
      id: '847291',
      serviceTitle: 'Electrical Fixture & Switchboard Repair',
      categoryName: 'Electrician Services',
      providerName: 'Ramesh Sharma',
      status: 'in_progress',
      scheduledDate: 'Today, 10:30 AM',
      scheduledTime: 'Morning Slot',
      location: 'Sector 14, Main Road',
      pricePaid: 455.04,
      paymentStatus: 'paid',
      invoiceId: 'INV-847291',
      canRebook: false,
      createdAt: '26 Sep 2026',
    },
    {
      id: '847110',
      serviceTitle: 'Bathroom Tap Leakage & Valve Repair',
      categoryName: 'Plumbing Services',
      providerName: 'Suresh Kumar',
      status: 'upcoming',
      scheduledDate: 'Tomorrow, 02:00 PM',
      scheduledTime: 'Afternoon Slot',
      location: 'Sector 14, Main Road',
      pricePaid: 349.0,
      paymentStatus: 'pending',
      canRebook: false,
      createdAt: '25 Sep 2026',
    },
    {
      id: '846950',
      serviceTitle: 'Split AC Deep Foam Jet Cleaning',
      categoryName: 'AC & Appliance Repair',
      providerName: 'Manoj Tiwari',
      status: 'completed',
      scheduledDate: '22 Sep 2026',
      scheduledTime: '11:00 AM',
      location: 'Sector 14, Main Road',
      pricePaid: 899.0,
      paymentStatus: 'paid',
      invoiceId: 'INV-846950',
      hasReviewed: false,
      canRebook: true,
      createdAt: '22 Sep 2026',
    },
  ]);

  // Modal control states
  const [rebookData, setRebookData] = useState<RebookSummaryData | null>(null);
  const [cancellingItem, setCancellingItem] = useState<CustomerActivityItem | null>(null);
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  const handleOpenRebook = (item: CustomerActivityItem) => {
    setRebookData({
      previousBookingId: item.id,
      serviceTitle: item.serviceTitle,
      categoryName: item.categoryName,
      providerName: item.providerName,
      previousAddressSummary: item.location || '',
      lastServicedDate: item.scheduledDate,
    });
  };

  const handleConfirmCancellation = (_reason: CancellationReason, _notes?: string) => {
    if (!cancellingItem) return;
    setActivityItems((prev) =>
      prev.map((item) =>
        item.id === cancellingItem.id
          ? {
              ...item,
              status: 'cancelled',
              paymentStatus: item.pricePaid ? 'refunded' : undefined,
            }
          : item
      )
    );
    setCancellingItem(null);
  };

  return (
    <PageContainer maxWidth="lg" className="space-y-8 pb-12">
      {/* Page Header */}
      <PageHeader
        title="My Service Activity"
        description="Monitor submitted service requests, upcoming visits, in-progress jobs, and past completed services."
        breadcrumbs={[{ label: 'Activity' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<LifeBuoy size={14} />}
              onClick={() => setIsSupportOpen(true)}
              className="text-xs h-8"
            >
              Activity Help
            </Button>

            <Link to="/request">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<PlusCircle size={14} />}
                className="text-xs h-8"
              >
                Request Service
              </Button>
            </Link>
          </div>
        }
      />

      {/* Activity List Component */}
      <ActivityList
        items={activityItems}
        onRebook={handleOpenRebook}
        onCancelBooking={(item) => setCancellingItem(item)}
      />

      {/* Rebook Modal */}
      {rebookData && (
        <RebookModal
          isOpen={Boolean(rebookData)}
          onClose={() => setRebookData(null)}
          data={rebookData}
        />
      )}

      {/* Cancellation Dialog */}
      {cancellingItem && (
        <CancellationDialog
          isOpen={Boolean(cancellingItem)}
          onClose={() => setCancellingItem(null)}
          bookingId={cancellingItem.id}
          serviceTitle={cancellingItem.serviceTitle}
          onConfirmCancellation={handleConfirmCancellation}
        />
      )}

      {/* General Activity Support Entry */}
      <SupportEntry
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
        defaultTopic="booking_issue"
      />
    </PageContainer>
  );
};
