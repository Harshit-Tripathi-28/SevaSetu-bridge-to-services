import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, LifeBuoy, RefreshCw } from 'lucide-react';
import { PageContainer } from '../../layouts/PageContainer';
import { PageHeader } from '../../layouts/PageHeader';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { ActivityList } from '../../components/customer/activity/ActivityList';
import {
  RebookModal,
  CancellationDialog,
  RescheduleDialog,
  SupportEntry,
} from '../../components/transaction';
import { bookingService } from '../../services/booking.service';
import type {
  CustomerActivityItem,
  PaymentStatus,
  RebookSummaryData,
  CancellationReason,
} from '../../types';
import type { BookingRecord, BookingStatus } from '@sevasetu/shared';

function mapBookingStatusToActivityStatus(status: BookingStatus): CustomerActivityItem['status'] {
  switch (status) {
    case 'PENDING_PROVIDER':
      return 'requested';
    case 'ACCEPTED':
    case 'SCHEDULED':
      return 'upcoming';
    case 'ON_THE_WAY':
    case 'ARRIVED':
    case 'IN_PROGRESS':
      return 'in_progress';
    case 'COMPLETED':
      return 'completed';
    case 'CANCELLED':
    case 'DECLINED':
    case 'EXPIRED':
    default:
      return 'cancelled';
  }
}

export const CustomerActivityPage: React.FC = () => {
  const [activityItems, setActivityItems] = useState<
    (CustomerActivityItem & {
      paymentStatus?: PaymentStatus;
      invoiceId?: string;
      hasReviewed?: boolean;
    })[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Modal control states
  const [rebookData, setRebookData] = useState<RebookSummaryData | null>(null);
  const [cancellingItem, setCancellingItem] = useState<CustomerActivityItem | null>(null);
  const [reschedulingItem, setReschedulingItem] = useState<CustomerActivityItem | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  const loadBookings = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await bookingService.getCustomerBookings({ limit: 50 });
      const mapped = (res.bookings || []).map((b: BookingRecord) => {
        const providerName =
          b.providerSnapshot?.businessName ||
          b.providerSnapshot?.fullName ||
          b.providerProfile?.businessName ||
          b.providerProfile?.user?.fullName ||
          'Assigned Professional';

        const locationStr = b.locationSnapshot
          ? `${b.locationSnapshot.flatNumber}, ${b.locationSnapshot.streetArea}, ${b.locationSnapshot.city}`
          : 'Service Location';

        return {
          id: b.id,
          serviceTitle: b.serviceTitleSnapshot || b.service?.title || 'Home Service',
          categoryName: b.service?.category?.name || 'Service',
          providerName,
          status: mapBookingStatusToActivityStatus(b.status),
          scheduledDate: b.scheduledDate,
          scheduledTime: `${b.scheduledStartTime} – ${b.scheduledEndTime}`,
          location: locationStr,
          pricePaid: b.priceSnapshot || undefined,
          canRebook: b.status === 'COMPLETED' || b.status === 'CANCELLED',
          createdAt: b.createdAt,
        };
      });
      setActivityItems(mapped);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load bookings';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

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

  const handleConfirmCancellation = async (reason: CancellationReason, notes?: string) => {
    if (!cancellingItem) return;
    setIsCancelling(true);
    try {
      const reasonText = notes?.trim() ? `${reason}: ${notes.trim()}` : reason;
      await bookingService.cancelCustomerBooking(cancellingItem.id, reasonText);
      setFeedbackMessage(`Booking #${cancellingItem.id} cancelled successfully.`);
      setCancellingItem(null);
      await loadBookings();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to cancel booking';
      setErrorMessage(msg);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleConfirmReschedule = async (newDate: string, newStartTime: string) => {
    if (!reschedulingItem) return;
    await bookingService.rescheduleCustomerBooking(reschedulingItem.id, {
      newDate,
      newStartTime,
    });
    setFeedbackMessage(`Booking #${reschedulingItem.id} rescheduled to ${newDate} at ${newStartTime}.`);
    setReschedulingItem(null);
    await loadBookings();
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
              leftIcon={<RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />}
              onClick={loadBookings}
              disabled={isLoading}
              className="text-xs h-8"
            >
              Refresh
            </Button>

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

      {feedbackMessage && (
        <Alert variant="success" title="Booking Updated" onClose={() => setFeedbackMessage(null)}>
          {feedbackMessage}
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="error" title="Error" onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      )}

      {/* Activity List Component */}
      <ActivityList
        items={activityItems}
        isLoading={isLoading}
        onRebook={handleOpenRebook}
        onCancelBooking={(item) => setCancellingItem(item)}
        onReschedule={(item) => setReschedulingItem(item)}
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
          isProcessing={isCancelling}
        />
      )}

      {/* Reschedule Dialog */}
      {reschedulingItem && (
        <RescheduleDialog
          isOpen={Boolean(reschedulingItem)}
          onClose={() => setReschedulingItem(null)}
          bookingId={reschedulingItem.id}
          serviceTitle={reschedulingItem.serviceTitle}
          currentDate={reschedulingItem.scheduledDate}
          currentTime={reschedulingItem.scheduledTime}
          onConfirmReschedule={handleConfirmReschedule}
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

