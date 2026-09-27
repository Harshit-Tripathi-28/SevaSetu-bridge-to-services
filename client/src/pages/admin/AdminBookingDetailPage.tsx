import React from 'react';
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
} from 'lucide-react';
import { PageHeader } from '../../layouts/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { TransactionStatusBadge, PaymentStatusBadge } from '../../components/transaction';

export const AdminBookingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

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
            <Link to="/admin/reports">
              <Button variant="outline" size="sm" leftIcon={<AlertTriangle size={14} />}>
                Dispute Review
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
              <h2 className="text-lg font-bold text-neutral-900">Standard Service Booking</h2>
              <TransactionStatusBadge status="confirmed" />
              <PaymentStatusBadge status="authorized" />
            </div>
            <p className="text-xs text-neutral-500 font-mono mt-0.5">Booking Ref: {id || 'BKG-PENDING'}</p>
          </div>
          <div className="text-xs text-neutral-500 flex items-center gap-1.5">
            <Clock size={14} />
            <span>Scheduled Appointment</span>
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
              c***@customer.sevasetu.internal
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5">Masked Phone: +91 &bull;&bull;&bull;&bull;&bull; &bull;&bull;123</div>
          </div>

          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
            <span className="text-xs text-neutral-500 font-medium flex items-center gap-1.5 mb-1">
              <Briefcase size={13} />
              <span>Assigned Partner</span>
            </span>
            <div className="text-xs font-mono font-semibold text-neutral-800">
              p***@partner.sevasetu.internal
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5">Verified Electrician</div>
          </div>

          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
            <span className="text-xs text-neutral-500 font-medium flex items-center gap-1.5 mb-1">
              <MapPin size={13} />
              <span>Service Location</span>
            </span>
            <div className="text-xs font-semibold text-neutral-800">
              Dispatch Sector 4
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5">Full address held per privacy rules</div>
          </div>

          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
            <span className="text-xs text-neutral-500 font-medium flex items-center gap-1.5 mb-1">
              <CreditCard size={13} />
              <span>Transaction State</span>
            </span>
            <div className="text-xs font-semibold text-neutral-800">
              ₹499.00 (In Escrow)
            </div>
            <div className="text-[11px] text-emerald-600 mt-0.5">Payment Captured</div>
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
            <Badge variant="neutral" size="sm">INV-REF</Badge>
          </CardHeader>
          <CardContent className="pt-4 space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-neutral-100">
              <span className="text-neutral-500">Service Fee</span>
              <span className="font-semibold text-neutral-800">₹449.00</span>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-100">
              <span className="text-neutral-500">Platform Safety &amp; Trust Fee</span>
              <span className="font-semibold text-neutral-800">₹50.00</span>
            </div>
            <div className="flex justify-between py-1.5 font-bold text-neutral-900">
              <span>Total Escrow Authorization</span>
              <span>₹499.00</span>
            </div>
            <div className="pt-2">
              <span className="text-[11px] text-neutral-400">
                Payment is protected by SevaSetu Escrow guarantee. Funds are released upon customer OTP confirmation.
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
            <Badge variant="success" size="sm">Active Session</Badge>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-xs text-neutral-600">
              Direct chat channel established between customer and verified service provider.
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
          <span className="text-xs text-neutral-400">Dispatch log</span>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3 text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <div>
                <span className="font-semibold text-neutral-800">Booking Confirmed &amp; Dispatched</span>
                <p className="text-neutral-500 mt-0.5">Matched with verified partner. Escrow funds secured.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-xs">
              <div className="w-2 h-2 rounded-full bg-neutral-300 mt-1.5 shrink-0" />
              <div>
                <span className="font-semibold text-neutral-700">Request Submitted</span>
                <p className="text-neutral-500 mt-0.5">Customer requested service via booking flow.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
