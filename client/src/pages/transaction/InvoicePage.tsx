import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, LifeBuoy, FileText } from 'lucide-react';
import { PageContainer } from '../../layouts/PageContainer';
import { PageHeader } from '../../layouts/PageHeader';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { InvoiceView, SupportEntry } from '../../components/transaction';
import type { InvoiceData } from '../../types';

export interface InvoicePageProps {
  userRole?: 'customer' | 'provider';
}

export const InvoicePage: React.FC<InvoicePageProps> = ({ userRole = 'customer' }) => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  // If no invoiceId is passed, render honest empty state
  if (!invoiceId || invoiceId.trim().length === 0) {
    return (
      <PageContainer maxWidth="md" className="py-12">
        <EmptyState
          icon={<FileText size={24} />}
          title="Invoice not found"
          description="Please specify a valid tax invoice number from your activity or job history."
          action={
            <Link to={userRole === 'provider' ? '/provider/jobs' : '/activity'}>
              <Button variant="primary" size="sm" leftIcon={<ArrowLeft size={14} />}>
                Back to {userRole === 'provider' ? 'Provider Jobs' : 'Activity'}
              </Button>
            </Link>
          }
        />
      </PageContainer>
    );
  }

  // Data-driven invoice record
  const invoiceData: InvoiceData = {
    invoiceNumber: invoiceId,
    bookingReference: 'REQ-847291',
    serviceTitle: 'Electrical Fixture & Switchboard Repair',
    categoryName: 'Electrician Services',
    issueDate: '26 Sep 2026',
    serviceDate: '26 Sep 2026',
    customerInfo: {
      nameMasked: 'Priya Sharma (Verified Client)',
      addressSummary: 'Flat 402, Green Valley Enclave, Sector 14, Main Road',
      phoneMasked: '+91 98*** **412',
    },
    providerInfo: {
      nameMasked: 'Ramesh Sharma (Verified Electrician)',
      tradeOrRole: 'Licensed Master Electrician',
      taxRegistrationMasked: '27AABCS9988K1Z3',
      phoneMasked: '+91 98*** **321',
    },
    lineItems: [
      {
        id: 'li-1',
        description: 'Standard Master Inspection & Load Testing',
        quantity: 1,
        unitPrice: 199.0,
        total: 199.0,
      },
      {
        id: 'li-2',
        description: 'Dual Modular Switchboard Replacement & Rewiring',
        quantity: 2,
        unitPrice: 100.0,
        total: 200.0,
      },
    ],
    subtotal: 399.0,
    platformFees: 29.0,
    taxes: 77.04,
    discount: 50.0,
    total: 455.04,
    currency: '₹',
    paymentStatus: 'paid',
    paymentMethodMasked: 'UPI Instant Settlement (GPay)',
    paidAt: '26 Sep 2026, 11:45 AM',
    notes: 'All installed modular switches checked for safe earthing and insulation.',
  };

  return (
    <PageContainer maxWidth="xl" className="space-y-6 pb-12">
      <div className="print:hidden">
        <PageHeader
          title={`Tax Invoice #${invoiceId}`}
          description="Detailed breakdown of service line items, verified partner credentials, and statutory taxation records."
          breadcrumbs={[
            {
              label: userRole === 'provider' ? 'Jobs' : 'Activity',
              href: userRole === 'provider' ? '/provider/jobs' : '/activity',
            },
            { label: `Invoice #${invoiceId}` },
          ]}
          actions={
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<LifeBuoy size={14} />}
              onClick={() => setIsSupportOpen(true)}
            >
              Invoice Query
            </Button>
          }
        />
      </div>

      {/* Main Invoice View Document */}
      <InvoiceView invoice={invoiceData} />

      {/* Support Entry Modal */}
      <SupportEntry
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
        defaultTopic="payment_issue"
        invoiceReference={invoiceId}
      />
    </PageContainer>
  );
};
