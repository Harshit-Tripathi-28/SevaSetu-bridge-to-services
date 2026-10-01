import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, AlertCircle, MessageSquare, Star, RotateCcw } from 'lucide-react';
import { PageContainer } from '../../layouts/PageContainer';
import { PageHeader } from '../../layouts/PageHeader';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { BookingSummary, CancellationDialog, RescheduleDialog, RebookModal } from '../../components/transaction';
import { bookingService } from '../../services/booking.service';
import type { BookingRecord } from '@sevasetu/shared';
import type { CancellationReason } from '../../types';

export const CustomerBookingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const bookingId = id || '';

  const [booking, setBooking] = useState<BookingRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Dialogs
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isRebookOpen, setIsRebookOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBooking = async () => {
    if (!bookingId) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await bookingService.getCustomerBookingById(bookingId);
      setBooking(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load booking details';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  const handleCancelConfirm = async (reason: CancellationReason, notes?: string) => {
    if (!booking) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const reasonText = notes?.trim() ? `${reason}: ${notes.trim()}` : reason;
      const updated = await bookingService.cancelCustomerBooking(booking.id, reasonText);
      setBooking(updated);
      setIsCancelOpen(false);
      setFeedbackMessage('Booking cancelled successfully.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to cancel booking';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRescheduleConfirm = async (newDate: string, newStartTime: string) => {
    if (!booking) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const updated = await bookingService.rescheduleCustomerBooking(booking.id, {
        newDate,
        newStartTime,
      });
      setBooking(updated);
      setIsRescheduleOpen(false);
      setFeedbackMessage(`Booking rescheduled to ${newDate} at ${newStartTime}.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to reschedule booking';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <PageContainer maxWidth="md" className="py-20 text-center space-y-3">
        <RefreshCw size={28} className="animate-spin mx-auto text-primary-600" />
        <p className="text-sm text-neutral-600">Loading booking #{bookingId}...</p>
      </PageContainer>
    );
  }

  if (!booking) {
    return (
      <PageContainer maxWidth="md" className="py-12 space-y-4">
        <Alert variant="error" title="Booking Not Found">
          {errorMessage || `Unable to find booking with ID: ${bookingId}`}
        </Alert>
        <Link to="/activity">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft size={14} />}>
            Back to Activity
          </Button>
        </Link>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="md" className="space-y-6 pb-12">
      <PageHeader
        title={`Booking #${booking.referenceCode || booking.id}`}
        description="Detailed appointment parameters, partner dispatch, location snapshot, and live status logs."
        breadcrumbs={[
          { label: 'Activity', href: '/activity' },
          { label: `#${booking.referenceCode || booking.id}` },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link to={`/messages?bookingId=${booking.id}`}>
              <Button variant="outline" size="sm" leftIcon={<MessageSquare size={14} />}>
                Chat
              </Button>
            </Link>

            {booking.status === 'COMPLETED' && (
              <>
                <Link to={`/reviews?bookingId=${booking.id}`}>
                  <Button variant="outline" size="sm" leftIcon={<Star size={14} />}>
                    Review
                  </Button>
                </Link>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<RotateCcw size={14} />}
                  onClick={() => setIsRebookOpen(true)}
                >
                  Rebook
                </Button>
              </>
            )}

            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw size={14} className={isSubmitting ? 'animate-spin' : ''} />}
              onClick={fetchBooking}
              disabled={isSubmitting}
            >
              Refresh
            </Button>
            <Link to="/activity">
              <Button variant="outline" size="sm" leftIcon={<ArrowLeft size={14} />}>
                Back to Activity
              </Button>
            </Link>
          </div>
        }
      />

      {feedbackMessage && (
        <Alert variant="success" title="Success" onClose={() => setFeedbackMessage(null)}>
          {feedbackMessage}
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="error" title="Action Error" onClose={() => setErrorMessage(null)}>
          <div className="flex items-center gap-2">
            <AlertCircle size={15} />
            <span>{errorMessage}</span>
          </div>
        </Alert>
      )}

      <BookingSummary
        booking={booking}
        userRole="customer"
        onCancel={() => setIsCancelOpen(true)}
        onReschedule={() => setIsRescheduleOpen(true)}
      />

      {/* Rebook Modal */}
      {isRebookOpen && (
        <RebookModal
          isOpen={isRebookOpen}
          onClose={() => setIsRebookOpen(false)}
          data={{
            previousBookingId: booking.id,
            serviceTitle: booking.serviceTitleSnapshot || booking.service?.title || 'Service',
            categoryName: booking.service?.category?.name || 'Home Services',
            providerName: booking.providerProfile?.user?.fullName ?? undefined,
            previousAddressSummary: typeof booking.locationSnapshot === 'object' && booking.locationSnapshot && 'addressLine1' in booking.locationSnapshot
              ? (booking.locationSnapshot as { addressLine1: string }).addressLine1
              : '',
            lastServicedDate: booking.scheduledDate ?? '',
          }}
        />
      )}

      {/* Cancellation Dialog */}
      <CancellationDialog
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        onConfirmCancellation={handleCancelConfirm}
        bookingId={booking.referenceCode || booking.id}
        serviceTitle={booking.serviceTitleSnapshot || booking.service?.title || 'Service'}
        isProcessing={isSubmitting}
      />

      {/* Reschedule Dialog */}
      <RescheduleDialog
        isOpen={isRescheduleOpen}
        onClose={() => setIsRescheduleOpen(false)}
        bookingId={booking.referenceCode || booking.id}
        onConfirmReschedule={handleRescheduleConfirm}
        currentDate={booking.scheduledDate}
        currentTime={booking.scheduledStartTime}
        serviceTitle={booking.serviceTitleSnapshot || booking.service?.title || 'Service'}
      />
    </PageContainer>
  );
};
