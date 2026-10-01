import crypto from 'node:crypto';
import { config } from '../config/index.js';

export interface CreateGatewayOrderParams {
  amountPaise: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface GatewayOrderResult {
  orderId: string;
  amountPaise: number;
  currency: string;
  status: string;
  keyId?: string;
}

export interface VerifyGatewayPaymentParams {
  gatewayOrderId: string;
  gatewayPaymentId: string;
  gatewaySignature: string;
}

export interface GatewayVerificationResult {
  isValid: boolean;
  gatewayOrderId: string;
  gatewayPaymentId: string;
  error?: string;
}

export interface GatewayRefundParams {
  gatewayPaymentId: string;
  amountPaise: number;
  currency: string;
  reason?: string;
  receipt?: string;
}

export interface GatewayRefundResult {
  refundId: string;
  amountPaise: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
}

export interface PaymentGatewayAdapter {
  readonly providerName: string;
  isConfigured(): boolean;
  createOrder(params: CreateGatewayOrderParams): Promise<GatewayOrderResult>;
  verifyPaymentSignature(params: VerifyGatewayPaymentParams): boolean;
  verifyWebhookSignature(rawBody: Buffer | string, signature: string): boolean;
  processRefund(params: GatewayRefundParams): Promise<GatewayRefundResult>;
}

export class PaymentGatewayConfigurationError extends Error {
  constructor(message = 'Payment gateway credentials are not configured in environment.') {
    super(message);
    this.name = 'PaymentGatewayConfigurationError';
  }
}

/**
 * Production-ready Razorpay Gateway Adapter implementation.
 * Encapsulates HMAC-SHA256 signature verification and order creation boundaries.
 */
export class RazorpayGatewayAdapter implements PaymentGatewayAdapter {
  readonly providerName = 'RAZORPAY';

  private keyId?: string;
  private keySecret?: string;
  private webhookSecret?: string;

  constructor() {
    this.keyId = config.paymentGateway.razorpayKeyId;
    this.keySecret = config.paymentGateway.razorpayKeySecret;
    this.webhookSecret = config.paymentGateway.razorpayWebhookSecret;
  }

  isConfigured(): boolean {
    return Boolean(
      this.keyId &&
        this.keyId.trim().length > 0 &&
        this.keySecret &&
        this.keySecret.trim().length > 0
    );
  }

  async createOrder(params: CreateGatewayOrderParams): Promise<GatewayOrderResult> {
    if (!this.isConfigured()) {
      throw new PaymentGatewayConfigurationError(
        'Payment gateway configuration blocker: RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is not set.'
      );
    }

    // Official Razorpay Orders API call
    const authHeader = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${authHeader}`,
      },
      body: JSON.stringify({
        amount: params.amountPaise,
        currency: params.currency,
        receipt: params.receipt,
        notes: params.notes,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Razorpay order creation failed: ${response.status} ${errBody}`);
    }

    const data = (await response.json()) as { id: string; amount: number; currency: string; status: string };

    return {
      orderId: data.id,
      amountPaise: data.amount,
      currency: data.currency,
      status: data.status,
      keyId: this.keyId,
    };
  }

  /**
   * Cryptographically verifies the Razorpay payment signature:
   * signature = HMAC_SHA256(order_id + "|" + payment_id, secret)
   */
  verifyPaymentSignature(params: VerifyGatewayPaymentParams): boolean {
    if (!this.keySecret) {
      throw new PaymentGatewayConfigurationError('Payment gateway secret is not configured.');
    }

    const body = `${params.gatewayOrderId}|${params.gatewayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', this.keySecret)
      .update(body)
      .digest('hex');

    try {
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'utf-8'),
        Buffer.from(params.gatewaySignature, 'utf-8')
      );
    } catch {
      return false;
    }
  }

  /**
   * Cryptographically verifies incoming webhook signature using webhook secret:
   * signature = HMAC_SHA256(raw_body, webhook_secret)
   */
  verifyWebhookSignature(rawBody: Buffer | string, signature: string): boolean {
    if (!this.webhookSecret) {
      throw new PaymentGatewayConfigurationError('Payment gateway webhook secret is not configured.');
    }

    const payload = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf-8');
    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload)
      .digest('hex');

    try {
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'utf-8'),
        Buffer.from(signature, 'utf-8')
      );
    } catch {
      return false;
    }
  }

  async processRefund(params: GatewayRefundParams): Promise<GatewayRefundResult> {
    if (!this.isConfigured()) {
      throw new PaymentGatewayConfigurationError(
        'Payment gateway configuration blocker: Gateway credentials unavailable for refund execution.'
      );
    }

    const authHeader = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
    const response = await fetch(`https://api.razorpay.com/v1/payments/${params.gatewayPaymentId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${authHeader}`,
      },
      body: JSON.stringify({
        amount: params.amountPaise,
        receipt: params.receipt,
        notes: { reason: params.reason || 'Customer cancellation' },
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Razorpay refund failed: ${response.status} ${errBody}`);
    }

    const data = (await response.json()) as { id: string; amount: number; currency: string; status: string };

    return {
      refundId: data.id,
      amountPaise: data.amount,
      currency: data.currency,
      status: 'COMPLETED',
    };
  }
}

// Singleton adapter instance
let defaultAdapter: PaymentGatewayAdapter | null = null;

export function getPaymentGatewayAdapter(): PaymentGatewayAdapter {
  if (!defaultAdapter) {
    defaultAdapter = new RazorpayGatewayAdapter();
  }
  return defaultAdapter;
}

export function setPaymentGatewayAdapter(adapter: PaymentGatewayAdapter | null): void {
  defaultAdapter = adapter;
}
