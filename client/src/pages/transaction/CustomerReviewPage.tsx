import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { PageContainer } from '../../layouts/PageContainer';
import { PageHeader } from '../../layouts/PageHeader';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { ReviewForm } from '../../components/transaction';

export const CustomerReviewPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();

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

  return (
    <PageContainer maxWidth="lg" className="space-y-6 pb-12">
      <PageHeader
        title="Review &amp; Feedback"
        description="Share your genuine feedback regarding service quality, timeliness, and technician professionalism."
        breadcrumbs={[
          { label: 'Activity', href: '/activity' },
          { label: `Booking #${bookingId}`, href: '/activity' },
          { label: 'Leave Review' },
        ]}
      />

      <ReviewForm
        bookingId={bookingId}
        serviceTitle="Electrical Fixture & Switchboard Repair"
        provider={{
          id: 'prov-101',
          fullName: 'Ramesh Sharma',
        }}
      />
    </PageContainer>
  );
};
