import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Briefcase,
  MapPin,
  CreditCard,
  FileText,
  MessageSquare,
  AlertTriangle,
  History,
  Clock,
  XCircle,
} from 'lucide-react';
import { PageHeader } from '../../layouts/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { TransactionStatusBadge, PaymentStatusBadge } from '../../components/transaction';
import { AdminService } from '../../services/admin.service';

export const AdminBookingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  const loadBooking = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await AdminService.getBookingDetail(id);
      setBooking(data);
    } catch (err) {
      console.error('Failed to load booking detail:', err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadBooking();
  }, [loadBooking]);

  const handleCancelBooking = async () => {
    if (!id) return;
    const reason = window.prompt('Specify operational reason for cancellation:');
    if (!reason) return;
    setIsCancelling(true);
    try {
      await AdminService.operationalCancelBooking(id, reason);
      await loadBooking();
    } catch (err) {
      console.error('Failed to cancel booking:', err);
    } finally {
      setIsCancelling(false);
    }
  };

  const status = (booking?.status?.toLowerCase() as any) || 'confirmed';
  const paymentStatus = (booking?.payment?.status?.toLowerCase() as any) || 'authorized';
  const priceFormatted = booking?.pricingSnapshot?.finalPricePaise
    ? `₹${booking.pricingSnapshot.finalPricePaise / 100}`
    : booking?.totalPricePaise
    ? `₹${booking.totalPricePaise / 100}`
    : '₹0.00';

  const customerName = booking?.customer?.fullName || 'Customer';
  const providerName = booking?.provider?.user?.fullName || booking?.provider?.businessName || 'Assigned Partner';

  if (isLoading) {
    return <div className="p-8 text-center text-neutral-500">Loading booking dossier...</div>;
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader
        title="Booking Dispatch &amp; Operations Dossier"
        description="Comprehensive dispatch view with customer privacy masking, partner assignment, escrow transaction state, and audit records."
        breadcrumbs={[
          { label: 'Admin' },
          { label: 'Bookings', href: '/admin/bookings' },
          { label: id ? `Booking ${id}` : 'Detail' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link to="/admin/bookings">
              <Button variant="outline" size="sm" leftIcon={<ArrowLeft size={14} />}>
                Back to Bookings
              </Button>
            </Link>
            {status !== 'cancelled' && status !== 'completed' && (
              <Button
                variant="destructive"
                size="sm"
                leftIcon={<XCircle size={14} />}
                onClick={handleCancelBooking}
                isLoading={isCancelling}
              >
                Operational Cancel
              </Button>
            )}
            <Link to="/admin/reports">
              <Button variant="outline" size="sm" leftIcon={<AlertTriangle size={14} />}>
                Disputes
              </Button>
            </Link>
          </div>
        }
      />

      {/* Top Meta Summary */}
      <Card variant="default" padding="md" className="bg-white border-neutral-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-neutral-900">{booking?.serviceTitleSnapshot || 'Service Booking'}</h2>
              <TransactionStatusBadge status={status} />
              <PaymentStatusBadge status={paymentStatus} />
            </div>
            <p className="text-xs text-neutral-500 font-mono mt-0.5">Booking Ref: {id || 'BKG-PENDING'}</p>
          </div>
          <div className="text-xs text-neutral-500 flex items-center gap-1.5">
            <Clock size={14} />
            <span>Scheduled: {booking?.scheduledAt ? new Date(booking.scheduledAt).toLocaleString() : 'N/A'}</span>
          </div>
        </div>

        {/* Stakeholder Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
            <span className="text-xs text-neutral-500 font-medium flex items-center gap-1.5 mb-1">
              <User size={13} />
              <span>Customer</span>
            </span>
            <div className="text-xs font-mono font-semibold text-neutral-800">
              {customerName}
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5">UID: {booking?.customerId?.slice(0, 8)}...</div>
          </div>

          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
            <span className="text-xs text-neutral-500 font-medium flex items-center gap-1.5 mb-1">
              <Briefcase size={13} />
              <span>Assigned Partner</span>
            </span>
            <div className="text-xs font-mono font-semibold text-neutral-800">
              {providerName}
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5">PID: {booking?.providerId?.slice(0, 8)}...</div>
          </div>

          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
            <span className="text-xs text-neutral-500 font-medium flex items-center gap-1.5 mb-1">
              <MapPin size={13} />
              <span>Service Location</span>
            </span>
            <div className="text-xs font-semibold text-neutral-800">
              {booking?.locationSnapshot?.city || 'Dispatch Area'}
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5">Pin: {booking?.locationSnapshot?.postalCode || 'Standard'}</div>
          </div>

          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
            <span className="text-xs text-neutral-500 font-medium flex items-center gap-1.5 mb-1">
              <CreditCard size={13} />
              <span>Transaction State</span>
            </span>
            <div className="text-xs font-semibold text-neutral-800">
              {priceFormatted}
            </div>
            <div className="text-[11px] text-emerald-600 mt-0.5">Status: {paymentStatus}</div>
          </div>
        </div>
      </Card>

      {/* Financial & Communication Reference */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="default" padding="md" className="bg-white">
          <CardHeader className="pb-3 border-b border-neutral-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-neutral-600" />
              <CardTitle className="text-sm font-bold text-neutral-900">
                Billing &amp; Invoice Reference
              </CardTitle>
            </div>
            <Badge variant="neutral" size="sm">INV-{booking?.invoice?.invoiceNumber || 'PENDING'}</Badge>
          </CardHeader>
          <CardContent className="pt-4 space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-neutral-100">
              <span className="text-neutral-500">Service Fee</span>
              <span className="font-semibold text-neutral-800">{priceFormatted}</span>
            </div>
            <div className="flex justify-between py-1.5 font-bold text-neutral-900">
              <span>Total Authorized</span>
              <span>{priceFormatted}</span>
            </div>
            <div className="pt-2">
              <span className="text-[11px] text-neutral-400">
                Payment is protected by SevaSetu Escrow guarantee. Funds are released upon completion confirmation.
              </span>
            </div>
          </CardContent>
        </Card>

        <Card variant="default" padding="md" className="bg-white">
          <CardHeader className="pb-3 border-b border-neutral-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare size={16} className="text-primary-600" />
              <CardTitle className="text-sm font-bold text-neutral-900">
                Communication Audit Reference
              </CardTitle>
            </div>
            <Badge variant="success" size="sm">Channel Verified</Badge>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-xs text-neutral-600">
              Direct chat channel established for booking between customer and provider.
            </p>
            <div className="mt-4 p-3 bg-neutral-50 rounded-lg text-xs text-neutral-500 border border-neutral-100">
              Administrative inspection of messages is restricted to authorized dispute investigations.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status History & Audit Timeline */}
      <Card variant="default" padding="md" className="bg-white">
        <CardHeader className="pb-3 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History size={16} className="text-neutral-600" />
            <CardTitle className="text-sm font-bold text-neutral-900">
              Fulfillment Status History
            </CardTitle>
          </div>
          <span className="text-xs text-neutral-400">{booking?.statusHistory?.length || 0} transitions</span>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-3">
            {booking?.statusHistory?.length ? (
              booking.statusHistory.map((h: any, idx: number) => (
                <div key={idx} className="flex items-start gap-3 text-xs">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-neutral-800">{h.previousStatus || 'INIT'} &rarr; {h.newStatus}</span>
                    <p className="text-neutral-500 mt-0.5">
                      {new Date(h.createdAt).toLocaleString()} &bull; Actor: {h.actorType} {h.reason ? `(${h.reason})` : ''}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-4 text-center text-xs text-neutral-500">
                Booking created.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
