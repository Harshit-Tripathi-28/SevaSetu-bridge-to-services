import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { PageContainer } from '../../layouts/PageContainer';
import { PageHeader } from '../../layouts/PageHeader';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Alert } from '../../components/ui/Alert';
import { ReviewForm } from '../../components/transaction';
import { bookingService } from '../../services/booking.service';
import { ReviewService } from '../../services/review.service';
import type { BookingRecord, ReviewRecord } from '@sevasetu/shared';
import type { ReviewSubmissionData } from '../../types';

export const CustomerReviewPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();

  const [booking, setBooking] = useState<BookingRecord | null>(null);
  const [existingReview, setExistingReview] = useState<ReviewRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) {
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const [bk, rev] = await Promise.all([
          bookingService.getCustomerBookingById(bookingId),
          ReviewService.getBookingReview(bookingId),
        ]);
        setBooking(bk);
        setExistingReview(rev);
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'Failed to load booking details.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [bookingId]);

  if (!bookingId || bookingId.trim().length === 0) {
    return (
      <PageContainer maxWidth="md" className="py-12">
        <EmptyState
          icon={<AlertCircle size={24} />}
          title="Booking reference required"
          description="To rate or review a completed service, navigate from your past service activity list."
          action={
            <Link to="/activity">
              <Button variant="primary" size="sm" leftIcon={<ArrowLeft size={14} />}>
                Go to Activity
              </Button>
            </Link>
          }
        />
      </PageContainer>
    );
  }

  if (isLoading) {
    return (
      <PageContainer maxWidth="lg" className="py-16 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600 mb-3" />
        <p className="text-sm text-neutral-500">Loading booking and review details...</p>
      </PageContainer>
    );
  }

  if (errorMessage) {
    return (
      <PageContainer maxWidth="md" className="py-12 space-y-4">
        <Alert variant="error" title="Unable to load review">
          {errorMessage}
        </Alert>
        <Link to="/activity">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft size={14} />}>
            Back to Activity
          </Button>
        </Link>
      </PageContainer>
    );
  }

  if (booking && booking.status !== 'COMPLETED') {
    return (
      <PageContainer maxWidth="md" className="py-12">
        <EmptyState
          icon={<AlertCircle size={24} />}
          title="Booking not completed"
          description={`Reviews can only be submitted after the service has been completed by your provider. Current status is ${booking.status}.`}
          action={
            <Link to={`/activity/${booking.id}`}>
              <Button variant="primary" size="sm" leftIcon={<ArrowLeft size={14} />}>
                View Booking Status
              </Button>
            </Link>
          }
        />
      </PageContainer>
    );
  }

  const handleReviewSubmit = async (data: ReviewSubmissionData) => {
    if (!bookingId) return;

    await ReviewService.submitReview(bookingId, {
      overallRating: data.rating,
      punctuality: data.aspects?.punctuality ? Number(data.aspects.punctuality) : undefined,
      workmanship: data.aspects?.quality ? Number(data.aspects.quality) : undefined,
      cleanliness: data.aspects?.cleanliness ? Number(data.aspects.cleanliness) : undefined,
      communication: data.aspects?.communication ? Number(data.aspects.communication) : undefined,
      reviewText: data.comment || undefined,
    });
  };

  const providerName =
    booking?.providerSnapshot?.businessName ||
    booking?.providerSnapshot?.fullName ||
    booking?.providerProfile?.businessName ||
    booking?.providerProfile?.user?.fullName ||
    'Service Partner';

  return (
    <PageContainer maxWidth="lg" className="space-y-6 pb-12">
      <PageHeader
        title="Review &amp; Feedback"
        description="Share your genuine feedback regarding service quality, timeliness, and technician professionalism."
        breadcrumbs={[
          { label: 'Activity', href: '/activity' },
          { label: `Booking #${booking?.referenceCode || bookingId}`, href: `/activity/${bookingId}` },
          { label: existingReview ? 'Review Dossier' : 'Leave Review' },
        ]}
      />

      <ReviewForm
        bookingId={bookingId}
        serviceTitle={booking?.serviceTitleSnapshot || 'Service'}
        provider={{
          id: booking?.providerProfileId || 'unassigned',
          fullName: providerName,
          avatarUrl: booking?.providerProfile?.avatarUrl || undefined,
        }}
        existingReview={
          existingReview
            ? {
                rating: existingReview.overallRating,
                comment: existingReview.reviewText || '',
                createdAt: new Date(existingReview.createdAt).toLocaleDateString(),
              }
            : undefined
        }
        onSubmitReview={handleReviewSubmit}
      />
    </PageContainer>
  );
};
