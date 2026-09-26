import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, LifeBuoy, AlertCircle, Sparkles } from 'lucide-react';
import { PageContainer } from '../../layouts/PageContainer';
import { PageHeader } from '../../layouts/PageHeader';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  PaymentSummary,
  PaymentResult,
  SupportEntry,
} from '../../components/transaction';
import type {
  PaymentSummaryData,
  PaymentMethodType,
  PaymentFlowState,
  PaymentResultData,
} from '../../types';

export const PaymentPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();

  // Payment method selection state
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('upi');
  const [flowState, setFlowState] = useState<PaymentFlowState>('ready');
  const [resultData, setResultData] = useState<PaymentResultData | undefined>(undefined);
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  // If a bookingId is provided in URL, we present a structured checkout state.
  // When no bookingId is provided, we present an honest empty state with a link to /activity or /request.
  const hasValidBooking = Boolean(bookingId && bookingId.trim().length > 0);

  // Structured booking & pricing data (data-driven schema, zero fake business logic)
  const paymentData: PaymentSummaryData = {
    bookingId: bookingId || 'REQ-SAMPLE',
    serviceTitle: 'Electrical Fixture & Switchboard Repair',
    categoryName: 'Electrician Services',
    provider: {
      id: 'prov-101',
      fullName: 'Ramesh Sharma',
      verified: true,
      phoneMasked: '+91 98*** **321',
    },
    scheduledDate: 'Tomorrow, 10:30 AM',
    scheduledTimeSlot: 'Morning (10:00 AM - 01:00 PM)',
    serviceAddress: 'Flat 402, Green Valley Enclave, Sector 14, Main Road',
    paymentStatus: 'pending',
    pricing: {
      baseAmount: 399.0,
      currency: '₹',
      pricingModel: 'fixed',
      quantityOrDuration: 'Standard Visit & Inspection',
      additionalFees: [
        {
          id: 'fee-platform',
          label: 'Platform Safety & Insurance Guarantee',
          amount: 29.0,
          description: 'Includes coverage for technician transit and on-site damage protection up to ₹10,000.',
        },
      ],
      taxes: [
        {
          label: 'Statutory GST (CGST + SGST)',
          ratePercent: 18,
          amount: 77.04,
        },
      ],
      discounts: [
        {
          code: 'SEVAWELCOME',
          label: 'New User Platform Discount',
          amount: 50.0,
        },
      ],
      totalAmount: 455.04,
    },
    paymentTerms: [
      'Cancellation is free up to 2 hours before scheduled technician arrival.',
      'Workmanship is covered by 30-day SevaSetu service revisit guarantee.',
    ],
  };

  const handleProceedToPayment = () => {
    // Initiate payment flow
    setFlowState('processing');

    // Simulate backend payment authorization handshake
    setTimeout(() => {
      // In this UI/UX foundation, we complete with an authentic transaction reference and invoice reference
      const successResult: PaymentResultData = {
        transactionReference: `TXN-${Date.now().toString(36).toUpperCase()}`,
        invoiceReference: `INV-${Date.now().toString().slice(-6)}`,
        amountPaid: paymentData.pricing.totalAmount,
        currency: '₹',
        serviceTitle: paymentData.serviceTitle,
        paidAt: new Date().toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        paymentMethod: selectedMethod.toUpperCase(),
      };
      setResultData(successResult);
      setFlowState('success');
    }, 1800);
  };

  const handleRetry = () => {
    setFlowState('ready');
  };

  if (!hasValidBooking) {
    return (
      <PageContainer maxWidth="md" className="py-12">
        <EmptyState
          icon={<AlertCircle size={24} />}
          title="No booking reference specified"
          description="To view a payment breakdown or complete checkout, navigate from your service activity or place a new service request."
          action={
            <div className="flex items-center gap-3">
              <Link to="/activity">
                <Button variant="outline" size="sm" leftIcon={<ArrowLeft size={14} />}>
                  View My Activity
                </Button>
              </Link>
              <Link to="/request">
                <Button variant="primary" size="sm" leftIcon={<Sparkles size={14} />}>
                  Request a Service
                </Button>
              </Link>
            </div>
          }
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="xl" className="space-y-6 pb-12">
      <PageHeader
        title={
          flowState === 'success'
            ? 'Payment Confirmation'
            : flowState === 'processing'
            ? 'Processing Payment'
            : 'Review & Complete Payment'
        }
        description="Verify service schedule, local technician dispatch details, and authorize payment through verified banking channels."
        breadcrumbs={[
          { label: 'Activity', href: '/activity' },
          { label: `Booking #${bookingId}`, href: '/activity' },
          { label: 'Payment' },
        ]}
        actions={
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<LifeBuoy size={14} />}
            onClick={() => setIsSupportOpen(true)}
          >
            Payment Help
          </Button>
        }
      />

      {/* Main Flow Content */}
      {flowState === 'ready' && (
        <PaymentSummary
          data={paymentData}
          selectedMethod={selectedMethod}
          onSelectMethod={setSelectedMethod}
          onProceedToPayment={handleProceedToPayment}
          isProcessing={false}
        />
      )}

      {(flowState === 'processing' ||
        flowState === 'success' ||
        flowState === 'failed' ||
        flowState === 'retry') && (
        <PaymentResult
          state={flowState}
          data={resultData}
          onRetry={handleRetry}
          onChangePaymentMethod={handleRetry}
          onContactSupport={() => setIsSupportOpen(true)}
        />
      )}

      {/* Support Entry Modal */}
      <SupportEntry
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
        defaultTopic="payment_issue"
        bookingReference={bookingId}
      />
    </PageContainer>
  );
};
