import { request } from './apiClient';
import type {
  ApiResponse,
  PaymentRecord,
  CreatePaymentOrderResponse,
  VerifyPaymentInput,
  BookingPaymentBreakdown,
  InvoiceRecord,
  ProviderEarningRecord,
  ProviderPayoutRecord,
  ProviderFinancialSummary,
} from '@sevasetu/shared';

export class PaymentClientService {
  /**
   * Retrieves authoritative price breakdown for checkout.
   */
  async getPaymentBreakdown(bookingId: string): Promise<BookingPaymentBreakdown> {
    const res = await request<ApiResponse<BookingPaymentBreakdown>>(
      `/payments/breakdown/${bookingId}`,
      { method: 'GET' }
    );
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to fetch payment breakdown.');
    }
    return res.data;
  }

  /**
   * Creates a payment order / intent with the gateway.
   */
  async createPaymentOrder(bookingId: string, idempotencyKey?: string): Promise<CreatePaymentOrderResponse> {
    const res = await request<ApiResponse<CreatePaymentOrderResponse>>(
      '/payments/orders',
      {
        method: 'POST',
        body: JSON.stringify({ bookingId, idempotencyKey }),
      }
    );
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to create payment order.');
    }
    return res.data;
  }

  /**
   * Cryptographically verifies payment completion on backend.
   */
  async verifyPayment(input: VerifyPaymentInput): Promise<PaymentRecord> {
    const res = await request<ApiResponse<PaymentRecord>>(
      '/payments/verify',
      {
        method: 'POST',
        body: JSON.stringify(input),
      }
    );
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Payment verification failed.');
    }
    return res.data;
  }

  /**
   * Retrieves all customer payments.
   */
  async getCustomerPayments(): Promise<PaymentRecord[]> {
    const res = await request<ApiResponse<{ payments: PaymentRecord[] }>>(
      '/customer/payments',
      { method: 'GET' }
    );
    return res.data?.payments || [];
  }

  /**
   * Retrieves payment details by ID.
   */
  async getPaymentById(id: string): Promise<PaymentRecord> {
    const res = await request<ApiResponse<PaymentRecord>>(
      `/payments/${id}`,
      { method: 'GET' }
    );
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to fetch payment details.');
    }
    return res.data;
  }

  /**
   * Retrieves all customer invoices.
   */
  async getCustomerInvoices(): Promise<InvoiceRecord[]> {
    const res = await request<ApiResponse<{ invoices: InvoiceRecord[] }>>(
      '/customer/invoices',
      { method: 'GET' }
    );
    return res.data?.invoices || [];
  }

  /**
   * Retrieves all provider invoices.
   */
  async getProviderInvoices(): Promise<InvoiceRecord[]> {
    const res = await request<ApiResponse<{ invoices: InvoiceRecord[] }>>(
      '/provider/invoices',
      { method: 'GET' }
    );
    return res.data?.invoices || [];
  }

  /**
   * Retrieves a single tax invoice by ID.
   */
  async getInvoiceById(id: string): Promise<InvoiceRecord> {
    const res = await request<ApiResponse<InvoiceRecord>>(
      `/invoices/${id}`,
      { method: 'GET' }
    );
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Invoice not found.');
    }
    return res.data;
  }

  /**
   * Retrieves provider earnings summary ledger.
   */
  async getProviderEarningsSummary(): Promise<ProviderFinancialSummary> {
    const res = await request<ApiResponse<ProviderFinancialSummary>>(
      '/provider/earnings/summary',
      { method: 'GET' }
    );
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to fetch provider earnings summary.');
    }
    return res.data;
  }

  /**
   * Retrieves list of provider earnings records.
   */
  async getProviderEarnings(): Promise<ProviderEarningRecord[]> {
    const res = await request<ApiResponse<{ earnings: ProviderEarningRecord[] }>>(
      '/provider/earnings',
      { method: 'GET' }
    );
    return res.data?.earnings || [];
  }

  /**
   * Retrieves provider payouts.
   */
  async getProviderPayouts(): Promise<ProviderPayoutRecord[]> {
    const res = await request<ApiResponse<{ payouts: ProviderPayoutRecord[] }>>(
      '/provider/payouts',
      { method: 'GET' }
    );
    return res.data?.payouts || [];
  }

  /**
   * Requests a payout from available balance.
   */
  async requestPayout(amountPaise: number, bankDetails?: Record<string, unknown>): Promise<ProviderPayoutRecord> {
    const res = await request<ApiResponse<ProviderPayoutRecord>>(
      '/provider/payouts',
      {
        method: 'POST',
        body: JSON.stringify({ amountPaise, bankDetails }),
      }
    );
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to submit payout request.');
    }
    return res.data;
  }
}

export const paymentService = new PaymentClientService();
