import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  ArrowLeft,
  Truck,
  PlayCircle,
  CheckCheck,
  Phone,
  Wallet,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { PageContainer } from '../../layouts/PageContainer';
import { PageHeader } from '../../layouts/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { JobStatusBadge } from '../../components/provider/ProviderStatusBadge';
import { JobTimeline } from '../../components/provider/JobTimeline';
import { JobCompletionForm } from '../../components/provider/JobCompletionForm';
import { bookingService } from '../../services/booking.service';
import type { ProviderJobStatus } from '../../types';
import type { BookingRecord } from '@sevasetu/shared';

export const ProviderJobDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const jobId = id || '';

  const [booking, setBooking] = useState<BookingRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [showCompletionForm, setShowCompletionForm] = useState(false);

  const fetchBooking = async () => {
    if (!jobId) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await bookingService.getProviderBookingById(jobId);
      setBooking(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load job details';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [jobId]);

  const mapBackendStatusToJobStatus = (status?: string): ProviderJobStatus => {
    switch (status) {
      case 'ON_THE_WAY':
        return 'on_the_way';
      case 'ARRIVED':
        return 'arrived';
      case 'IN_PROGRESS':
        return 'in_progress';
      case 'COMPLETED':
        return 'completed';
      case 'CANCELLED':
        return 'cancelled';
      case 'SCHEDULED':
      case 'ACCEPTED':
      default:
        return 'scheduled';
    }
  };

  const handleAdvanceStatus = async (nextStatus: ProviderJobStatus) => {
    if (nextStatus === 'completed') {
      setShowCompletionForm(true);
      return;
    }

    setIsUpdating(true);
    setErrorMessage(null);
    try {
      let targetStatus: 'ON_THE_WAY' | 'ARRIVED' | 'IN_PROGRESS' | 'COMPLETED' = 'ON_THE_WAY';
      if (nextStatus === 'arrived') targetStatus = 'ARRIVED';
      else if (nextStatus === 'in_progress') targetStatus = 'IN_PROGRESS';

      const updated = await bookingService.updateExecutionStatus(jobId, targetStatus);
      setBooking(updated);
      setFeedbackMessage(`Job status updated to ${targetStatus.replace(/_/g, ' ')}.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update job status';
      setErrorMessage(msg);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCompleteSuccess = async (notes: string) => {
    setIsUpdating(true);
    setErrorMessage(null);
    try {
      const updated = await bookingService.updateExecutionStatus(jobId, 'COMPLETED', notes);
      setBooking(updated);
      setShowCompletionForm(false);
      setFeedbackMessage('Job successfully marked as COMPLETED.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to complete job';
      setErrorMessage(msg);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <PageContainer maxWidth="lg" className="py-20 text-center space-y-3">
        <RefreshCw size={28} className="animate-spin mx-auto text-primary-600" />
        <p className="text-sm text-neutral-600">Loading job #{jobId} from server...</p>
      </PageContainer>
    );
  }

  if (!booking) {
    return (
      <PageContainer maxWidth="lg" className="py-12 space-y-4">
        <Alert variant="error" title="Job Not Found">
          {errorMessage || `Could not find job records for ID: ${jobId}`}
        </Alert>
        <Link to="/provider/jobs">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft size={14} />}>
            Back to Jobs
          </Button>
        </Link>
      </PageContainer>
    );
  }

  const jobStatus = mapBackendStatusToJobStatus(booking.status);
  const serviceTitle = booking.serviceTitleSnapshot || booking.service?.title || 'Service';
  const categoryName = booking.service?.category?.name || 'Home Service';
  const customerName = booking.customerSnapshot?.fullName || booking.customer?.fullName || 'Verified Client';
  const customerPhone = booking.customerSnapshot?.phone || booking.customer?.phone || 'Confidential';
  const locationStr = booking.locationSnapshot
    ? `${booking.locationSnapshot.flatNumber}, ${booking.locationSnapshot.streetArea}, ${booking.locationSnapshot.city} ${booking.locationSnapshot.postalCode}`
    : 'Client Address';
  const price = booking.priceSnapshot ?? 0;

  return (
    <PageContainer maxWidth="lg" className="space-y-6 pb-12">
      <PageHeader
        title={`Manage Job #${booking.referenceCode || booking.id}`}
        description="Active job dispatch, live status step transition, client contact protocol, and completion handover."
        breadcrumbs={[
          { label: 'Provider Console', href: '/provider' },
          { label: 'Jobs', href: '/provider/jobs' },
          { label: `#${booking.referenceCode || booking.id}` },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw size={14} className={isUpdating ? 'animate-spin' : ''} />}
              onClick={fetchBooking}
              disabled={isUpdating}
            >
              Refresh
            </Button>
            <Link to="/provider/jobs">
              <Button variant="outline" size="sm" leftIcon={<ArrowLeft size={14} />}>
                Back to Jobs
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

      {/* Main Execution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Job Details & Timeline */}
        <div className="lg:col-span-8 space-y-6">
          <Card variant="default" padding="md" className="bg-white space-y-4">
            <CardHeader className="pb-3 border-b border-neutral-100">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="info" size="sm">{categoryName}</Badge>
                  <span className="text-xs text-neutral-500 font-mono">Ref #{booking.referenceCode}</span>
                </div>
                <JobStatusBadge status={jobStatus} />
              </div>
              <CardTitle className="text-lg pt-1">{serviceTitle}</CardTitle>
              <CardDescription>
                Service Request Ref: {booking.serviceRequestId}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5 text-xs text-neutral-700">
              {/* Timeline Stepper */}
              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2">
                <span className="font-semibold text-neutral-900 block pb-1">Dispatch &amp; Job Status</span>
                <JobTimeline currentStatus={jobStatus} />
              </div>

              {/* Client & Location Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl border border-neutral-200 bg-white space-y-1.5">
                  <div className="flex items-center gap-1.5 font-semibold text-neutral-900 pb-1 border-b border-neutral-100">
                    <User size={13} className="text-neutral-500" />
                    <span>Client Details</span>
                  </div>
                  <p className="font-medium text-neutral-900">{customerName}</p>
                  <p className="text-neutral-500 flex items-center gap-1 font-mono">
                    <Phone size={11} /> {customerPhone}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-neutral-200 bg-white space-y-1.5">
                  <div className="flex items-center gap-1.5 font-semibold text-neutral-900 pb-1 border-b border-neutral-100">
                    <Calendar size={13} className="text-neutral-500" />
                    <span>Appointment Schedule</span>
                  </div>
                  <p className="font-medium text-neutral-900">{booking.scheduledDate}</p>
                  <p className="text-neutral-500 flex items-center gap-1">
                    <Clock size={11} /> {booking.scheduledStartTime} – {booking.scheduledEndTime} ({booking.durationHours}h)
                  </p>
                </div>
              </div>

              {/* Service Address */}
              <div className="p-3.5 rounded-xl border border-neutral-200 bg-white flex items-start gap-2.5">
                <MapPin size={16} className="text-primary-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-neutral-900 block">Service Location:</span>
                  <span className="text-neutral-600 leading-relaxed">{locationStr}</span>
                </div>
              </div>

              {/* Service Request Description / Preferences */}
              {booking.serviceRequest?.description && (
                <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1">
                  <span className="font-semibold text-neutral-900 block">Customer Request Details:</span>
                  <p className="text-neutral-700 leading-relaxed">{booking.serviceRequest.description}</p>
                </div>
              )}

              {/* Work Notes upon completion */}
              {booking.notes && (
                <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1">
                  <span className="font-semibold text-neutral-900 block">Handover Notes:</span>
                  <p className="text-neutral-600 italic leading-relaxed">{booking.notes}</p>
                </div>
              )}

              {/* Real Audit History */}
              {booking.statusHistory && booking.statusHistory.length > 0 && (
                <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2">
                  <span className="font-semibold text-neutral-900 block">Status Transition History:</span>
                  <div className="space-y-1.5 font-mono text-[11px]">
                    {booking.statusHistory.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-neutral-600 border-b border-neutral-200/50 pb-1">
                        <span>
                          <strong className="text-neutral-800">{item.newStatus}</strong> by {item.actorType}
                          {item.reason ? ` (${item.reason})` : ''}
                        </span>
                        <span className="text-neutral-400">{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Job Completion Form Modal */}
          {showCompletionForm && (
            <div className="p-5 rounded-2xl border-2 border-emerald-500 bg-white shadow-lg space-y-3">
              <JobCompletionForm
                jobId={booking.referenceCode || booking.id}
                serviceTitle={serviceTitle}
                onComplete={handleCompleteSuccess}
                onCancel={() => setShowCompletionForm(false)}
              />
            </div>
          )}
        </div>

        {/* Right Column: Execution Controls & Earnings Breakdown */}
        <div className="lg:col-span-4 space-y-4">
          <Card variant="default" padding="md" className="bg-white space-y-4">
            <CardHeader className="pb-3 border-b border-neutral-100">
              <CardTitle className="text-base">Job Progression Controls</CardTitle>
              <CardDescription>
                Update your active on-site status as you execute the service.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              {jobStatus === 'scheduled' && (
                <Button
                  variant="primary"
                  size="md"
                  className="w-full"
                  leftIcon={<Truck size={16} />}
                  onClick={() => handleAdvanceStatus('on_the_way')}
                  disabled={isUpdating}
                >
                  Start Trip: On the Way
                </Button>
              )}

              {jobStatus === 'on_the_way' && (
                <Button
                  variant="primary"
                  size="md"
                  className="w-full"
                  leftIcon={<MapPin size={16} />}
                  onClick={() => handleAdvanceStatus('arrived')}
                  disabled={isUpdating}
                >
                  Confirm Arrival on Site
                </Button>
              )}

              {jobStatus === 'arrived' && (
                <Button
                  variant="primary"
                  size="md"
                  className="w-full"
                  leftIcon={<PlayCircle size={16} />}
                  onClick={() => handleAdvanceStatus('in_progress')}
                  disabled={isUpdating}
                >
                  Begin Work (In Progress)
                </Button>
              )}

              {jobStatus === 'in_progress' && (
                <Button
                  variant="primary"
                  size="md"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  leftIcon={<CheckCheck size={16} />}
                  onClick={() => handleAdvanceStatus('completed')}
                  disabled={isUpdating}
                >
                  Complete Service Handover
                </Button>
              )}

              {jobStatus === 'completed' && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                  <CheckCheck size={24} className="text-emerald-600 mx-auto" />
                  <h4 className="font-semibold text-xs text-emerald-950">Job Successfully Completed</h4>
                  <p className="text-[11px] text-emerald-800">
                    Service delivery confirmed and recorded in PostgreSQL audit logs.
                  </p>
                </div>
              )}

              {jobStatus === 'cancelled' && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-center space-y-1">
                  <h4 className="font-semibold text-xs text-rose-950">Job Cancelled</h4>
                  <p className="text-[11px] text-rose-800">
                    {booking.cancellationReason || 'This booking was cancelled.'}
                  </p>
                </div>
              )}
            </CardContent>

            {/* Payout & Financial Transparency Card */}
            {price > 0 && (
              <div className="pt-3 border-t border-neutral-100 space-y-2 text-xs">
                <div className="flex items-center justify-between text-neutral-500">
                  <span className="flex items-center gap-1">
                    <Wallet size={12} />
                    <span>Agreed Service Fee:</span>
                  </span>
                  <span className="font-mono text-neutral-900 font-medium">₹{price}</span>
                </div>
                <div className="flex items-center justify-between text-neutral-500">
                  <span>Platform Commission (10%):</span>
                  <span className="font-mono text-neutral-700">-₹{(price * 0.1).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between font-bold text-neutral-900 pt-1 border-t border-neutral-100">
                  <span>Estimated Net Payout:</span>
                  <span className="font-mono text-sm text-emerald-700">₹{(price * 0.9).toFixed(2)}</span>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </PageContainer>
  );
};

