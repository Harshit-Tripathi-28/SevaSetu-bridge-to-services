import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, LifeBuoy, FileText, Loader2, Printer } from 'lucide-react';
import { PageContainer } from '../../layouts/PageContainer';
import { PageHeader } from '../../layouts/PageHeader';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { InvoiceView, SupportEntry } from '../../components/transaction';
import { paymentService } from '../../services/payment.service';
import type { InvoiceData } from '../../types';
import type { InvoiceRecord } from '@sevasetu/shared';

export interface InvoicePageProps {
  userRole?: 'customer' | 'provider';
}

export const InvoicePage: React.FC<InvoicePageProps> = ({ userRole = 'customer' }) => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [invoice, setInvoice] = useState<InvoiceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!invoiceId || invoiceId.trim().length === 0) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    async function loadInvoice() {
      try {
        setLoading(true);
        setErrorMsg(null);
        const inv = await paymentService.getInvoiceById(invoiceId!);
        if (isMounted) {
          setInvoice(inv);
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : 'Invoice not found.';
        setErrorMsg(msg);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadInvoice();
    return () => {
      isMounted = false;
    };
  }, [invoiceId]);

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

  if (loading) {
    return (
      <PageContainer maxWidth="md" className="py-24 text-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="animate-spin text-primary-600" size={32} />
          <p className="text-sm font-medium text-neutral-600">Loading statutory tax invoice...</p>
        </div>
      </PageContainer>
    );
  }

  if (errorMsg || !invoice) {
    return (
      <PageContainer maxWidth="md" className="py-12">
        <EmptyState
          icon={<FileText size={24} />}
          title="Invoice Not Found"
          description={errorMsg || `Invoice #${invoiceId} could not be located in your account records.`}
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

  // Format real InvoiceRecord into view model
  const billingAddr = invoice.customerSnapshot?.billingAddress;
  const addressSummary = billingAddr
    ? `${billingAddr.flatNumber || ''}, ${billingAddr.streetArea || ''}, ${billingAddr.city || ''} - ${billingAddr.postalCode || ''}`
    : 'Registered Customer Address';

  const invoiceData: InvoiceData = {
    invoiceNumber: invoice.invoiceNumber,
    bookingReference: invoice.booking?.referenceCode || invoice.bookingId,
    serviceTitle: invoice.serviceTitleSnapshot,
    categoryName: 'Home & Professional Services',
    issueDate: new Date(invoice.issuedAt).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    serviceDate: new Date(invoice.serviceDate).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    customerInfo: {
      nameMasked: invoice.customerSnapshot?.fullName || 'Registered Client',
      addressSummary,
      phoneMasked: invoice.customerSnapshot?.phone || undefined,
      emailMasked: invoice.customerSnapshot?.email || undefined,
    },
    providerInfo: {
      nameMasked: invoice.providerSnapshot?.businessName || invoice.providerSnapshot?.displayName || 'Verified Service Provider',
      tradeOrRole: 'Verified Professional Partner',
      taxRegistrationMasked: invoice.providerSnapshot?.taxRegistration || undefined,
      phoneMasked: invoice.providerSnapshot?.phone || undefined,
    },
    lineItems:
      invoice.lineItems && invoice.lineItems.length > 0
        ? invoice.lineItems.map((li) => ({
            id: li.id,
            description: li.description,
            quantity: li.quantity,
            unitPrice: li.unitPrice / 100,
            total: li.total / 100,
          }))
        : [
            {
              id: 'li-1',
              description: invoice.serviceTitleSnapshot,
              quantity: 1,
              unitPrice: invoice.subtotal / 100,
              total: invoice.subtotal / 100,
            },
          ],
    subtotal: invoice.subtotal / 100,
    platformFees: invoice.platformFee > 0 ? invoice.platformFee / 100 : undefined,
    taxes: invoice.tax > 0 ? invoice.tax / 100 : undefined,
    discount: invoice.discount > 0 ? invoice.discount / 100 : undefined,
    total: invoice.total / 100,
    currency: '₹',
    paymentStatus: (invoice.paymentStatus?.toLowerCase() as 'paid' | 'pending' | 'failed' | 'refunded') || 'paid',
    paymentMethodMasked: invoice.paymentMethodMasked || 'Online Verified Settlement',
    paidAt: new Date(invoice.issuedAt).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  };

  return (
    <PageContainer maxWidth="xl" className="space-y-6 pb-12">
      <div className="print:hidden">
        <PageHeader
          title={`Tax Invoice #${invoice.invoiceNumber}`}
          description="Detailed breakdown of service line items, verified partner credentials, and statutory taxation records."
          breadcrumbs={[
            {
              label: userRole === 'provider' ? 'Jobs' : 'Activity',
              href: userRole === 'provider' ? '/provider/jobs' : '/activity',
            },
            { label: `Invoice #${invoice.invoiceNumber}` },
          ]}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Printer size={14} />}
                onClick={() => window.print()}
              >
                Print Invoice
              </Button>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<LifeBuoy size={14} />}
                onClick={() => setIsSupportOpen(true)}
              >
                Billing Help
              </Button>
            </div>
          }
        />
      </div>

      {/* Invoice View Render */}
      <InvoiceView invoice={invoiceData} />

      {/* Support Entry Modal */}
      <SupportEntry
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
        defaultTopic="payment_issue"
        invoiceReference={invoice.invoiceNumber}
      />
    </PageContainer>
  );
};
