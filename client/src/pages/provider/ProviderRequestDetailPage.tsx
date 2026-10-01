import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Check,
  X,
  ShieldCheck,
  ArrowLeft,
  Info,
  RefreshCw,
  AlertCircle,
  Briefcase,
} from 'lucide-react';
import { PageContainer } from '../../layouts/PageContainer';
import { PageHeader } from '../../layouts/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { RequestStatusBadge } from '../../components/provider/ProviderStatusBadge';
import { bookingService } from '../../services/booking.service';
import type { BookingRecord } from '@sevasetu/shared';
import type { ProviderRequestStatus } from '../../types';

export const ProviderRequestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const requestId = id || '';

  const [booking, setBooking] = useState<BookingRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Decline dialog state
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('Schedule unavailable');

  const fetchRequest = async () => {
    if (!requestId) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await bookingService.getProviderBookingById(requestId);
      setBooking(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load request details';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequest();
  }, [requestId]);

  const mapBackendToRequestStatus = (status?: string): ProviderRequestStatus => {
    switch (status) {
      case 'PENDING_PROVIDER':
        return 'pending';
      case 'ACCEPTED':
      case 'SCHEDULED':
        return 'accepted';
      case 'DECLINED':
        return 'declined';
      case 'CANCELLED':
        return 'cancelled';
      case 'EXPIRED':
        return 'expired';
      default:
        return 'pending';
    }
  };

  const handleAccept = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const updated = await bookingService.acceptBooking(requestId);
      setBooking(updated);
      setFeedback(`Booking #${updated.referenceCode} successfully accepted and confirmed on schedule.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to accept booking request';
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeclineConfirm = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const updated = await bookingService.declineBooking(requestId, declineReason);
      setBooking(updated);
      setShowDeclineModal(false);
      setFeedback(`Booking #${updated.referenceCode} declined.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to decline booking request';
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <PageContainer maxWidth="lg" className="py-20 text-center space-y-3">
        <RefreshCw size={28} className="animate-spin mx-auto text-primary-600" />
        <p className="text-sm text-neutral-600">Loading request #{requestId} from server...</p>
      </PageContainer>
    );
  }

  if (!booking) {
    return (
      <PageContainer maxWidth="lg" className="py-12 space-y-4">
        <Alert variant="error" title="Request Not Found">
          {errorMessage || `Could not find request records for ID: ${requestId}`}
        </Alert>
        <Link to="/provider/requests">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft size={14} />}>
            Back to Requests
          </Button>
        </Link>
      </PageContainer>
    );
  }

  const requestStatus = mapBackendToRequestStatus(booking.status);
  const serviceTitle = booking.serviceTitleSnapshot || booking.service?.title || 'Home Service';
  const categoryName = booking.service?.category?.name || 'General';
  const locationSummary = booking.locationSnapshot
    ? `${booking.locationSnapshot.flatNumber}, ${booking.locationSnapshot.streetArea}, ${booking.locationSnapshot.city} (${booking.locationSnapshot.postalCode})`
    : 'Customer Address';
  const customerSummary = booking.serviceRequest?.description || 'Service inquiry requested through SevaSetu portal.';
  const price = booking.priceSnapshot ?? undefined;

  return (
    <PageContainer maxWidth="lg" className="space-y-6 pb-12">
      <PageHeader
        title={`Request Details #${booking.referenceCode || booking.id}`}
        description="Comprehensive task parameters, customer instructions, schedule requirements, and dispatch decision."
        breadcrumbs={[
          { label: 'Provider Console', href: '/provider' },
          { label: 'Requests', href: '/provider/requests' },
          { label: `#${booking.referenceCode || booking.id}` },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw size={14} className={isProcessing ? 'animate-spin' : ''} />}
              onClick={fetchRequest}
              disabled={isProcessing}
            >
              Refresh
            </Button>
            <Link to="/provider/requests">
              <Button variant="outline" size="sm" leftIcon={<ArrowLeft size={14} />}>
                Back to Requests
              </Button>
            </Link>
          </div>
        }
      />

      {feedback && (
        <Alert variant="success" title="Status Update" onClose={() => setFeedback(null)}>
          {feedback}
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

      {/* Main Request Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Core Need & Parameters */}
        <div className="lg:col-span-8 space-y-6">
          <Card variant="default" padding="md" className="bg-white space-y-4">
            <CardHeader className="pb-3 border-b border-neutral-100">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge variant="info" size="sm">{categoryName}</Badge>
                <RequestStatusBadge status={requestStatus} />
              </div>
              <CardTitle className="text-lg pt-1">{serviceTitle}</CardTitle>
              <CardDescription>
                Requested on {new Date(booking.createdAt).toLocaleDateString()} &bull; Ref #{booking.referenceCode}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 text-xs text-neutral-700">
              {/* Customer Need Statement */}
              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 block">
                  Customer Requirement Summary
                </span>
                <p className="text-neutral-900 font-medium text-sm leading-relaxed">
                  "{customerSummary}"
                </p>
              </div>

              {/* Schedule and Timing */}
              <div className="p-4 rounded-xl border border-neutral-200/80 space-y-2">
                <span className="font-semibold text-neutral-800 text-xs uppercase tracking-wider block">
                  Schedule &amp; Arrival Window
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-neutral-400" />
                    <span className="font-medium text-neutral-900">{booking.scheduledDate}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <Clock size={14} className="text-neutral-400" />
                    <span>{booking.scheduledStartTime} – {booking.scheduledEndTime} ({booking.durationHours}h)</span>
                  </div>
                </div>
              </div>

              {/* Location Summary */}
              <div className="p-4 rounded-xl border border-neutral-200/80 space-y-2">
                <span className="font-semibold text-neutral-800 text-xs uppercase tracking-wider block">
                  Service Address &amp; Sector
                </span>
                <div className="flex items-start gap-2 pt-1">
                  <MapPin size={14} className="text-neutral-400 shrink-0 mt-0.5" />
                  <p className="font-medium text-neutral-900 leading-snug">
                    {locationSummary}
                  </p>
                </div>
              </div>

              {/* Real Audit History */}
              {booking.statusHistory && booking.statusHistory.length > 0 && (
                <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2">
                  <span className="font-semibold text-neutral-900 block">Status History:</span>
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

          {/* Trust and Safety Banner */}
          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-600 flex items-start gap-2.5">
            <ShieldCheck size={16} className="text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-neutral-800">Platform Safety &amp; On-Site Conduct</p>
              <p className="leading-relaxed">
                Accepting this booking locks your schedule for this appointment slot. Customer contact and dispatch address are verified.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing & Actions */}
        <div className="lg:col-span-4 space-y-6">
          {/* Action Decision Card */}
          <Card variant="default" padding="md" className="bg-white space-y-4">
            <CardHeader className="pb-3 border-b border-neutral-100">
              <CardTitle className="text-base">Dispatch Actions</CardTitle>
              <CardDescription>
                Decide whether to accept and schedule or decline this inquiry.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {price !== undefined && (
                <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 text-xs flex justify-between items-center">
                  <span className="text-neutral-600">Standard Service Rate:</span>
                  <span className="font-bold font-mono text-neutral-900 text-sm">₹{price}</span>
                </div>
              )}

              {/* Action Buttons */}
              {booking.status === 'PENDING_PROVIDER' ? (
                <div className="space-y-2 pt-2">
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full"
                    leftIcon={<Check size={16} />}
                    onClick={handleAccept}
                    disabled={isProcessing}
                  >
                    Accept &amp; Schedule
                  </Button>

                  <Button
                    variant="outline"
                    size="md"
                    className="w-full text-rose-700 hover:bg-rose-50 border-rose-200"
                    leftIcon={<X size={16} />}
                    onClick={() => setShowDeclineModal(true)}
                    disabled={isProcessing}
                  >
                    Decline Task
                  </Button>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-neutral-100 text-center space-y-3">
                  <div className="text-xs text-neutral-600">
                    Current Status: <strong className="capitalize text-neutral-900">{booking.status}</strong>
                  </div>
                  {(booking.status === 'SCHEDULED' || booking.status === 'ACCEPTED') && (
                    <Link to={`/provider/jobs/${booking.id}`}>
                      <Button variant="primary" size="sm" className="w-full text-xs" leftIcon={<Briefcase size={14} />}>
                        Go to Job Console
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </CardContent>

            <CardFooter className="pt-3 border-t border-neutral-100 text-[11px] text-neutral-500 flex items-center gap-1.5">
              <Info size={13} className="shrink-0" />
              <span>Decisions are atomically committed to PostgreSQL with slot locking.</span>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Decline Reason Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 space-y-4">
            <h3 className="font-bold text-neutral-900 text-base">Decline Booking Request</h3>
            <p className="text-xs text-neutral-600">
              Please select or enter the reason for declining this request. This will release the inquiry back to the client.
            </p>
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-neutral-700">Reason</label>
              <select
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                className="w-full h-9 border border-neutral-300 rounded-lg px-2.5 text-xs bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="Schedule unavailable">Schedule unavailable</option>
                <option value="Outside serviceable location">Outside serviceable location</option>
                <option value="Required tools/materials unavailable">Required tools/materials unavailable</option>
                <option value="Other commitment">Other commitment</option>
              </select>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeclineModal(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-rose-600 hover:bg-rose-700 text-white"
                onClick={handleDeclineConfirm}
                disabled={isProcessing}
              >
                Confirm Decline
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};
