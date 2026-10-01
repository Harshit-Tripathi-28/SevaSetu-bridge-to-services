import crypto from 'node:crypto';
import { getPrismaClient } from '../config/database.js';
import type {
  PaymentRecord,
  CreatePaymentOrderInput,
  CreatePaymentOrderResponse,
  VerifyPaymentInput,
  BookingPaymentBreakdown,
  RefundRecord,
  BookingActorType,
} from '@sevasetu/shared';
import { rupeesToPaise } from '@sevasetu/shared';
import { getPaymentGatewayAdapter } from './payment-gateway.adapter.js';
import {
  PaymentTransitionService,
  PaymentAuthorizationError,
} from './payment-transition.service.js';
import { InvoiceService } from './invoice.service.js';
import { EarningService } from './earning.service.js';
import { FinancialPolicyService } from './financial-policy.service.js';
import { EventService } from './event.service.js';


export class PaymentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PaymentValidationError';
  }
}

export class PaymentNotFoundError extends Error {
  constructor(message = 'Payment record not found.') {
    super(message);
    this.name = 'PaymentNotFoundError';
  }
}

export class PaymentConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PaymentConflictError';
  }
}

export class PaymentService {
  /**
   * Calculates the authoritative price breakdown for a booking from database snapshots.
   */
  static async getBookingPaymentBreakdown(
    userId: string,
    bookingId: string,
    role: string
  ): Promise<BookingPaymentBreakdown> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!booking) {
      throw new PaymentNotFoundError(`Booking '${bookingId}' not found.`);
    }

    if (role === 'CUSTOMER' && booking.customerId !== userId) {
      throw new PaymentAuthorizationError('Forbidden: You can only view payments for your own bookings.');
    }

    // Determine base amount strictly from authoritative priceSnapshot
    let baseAmountPaise = 0;
    let isPayable = true;
    let unpayableReason: string | undefined;

    if (booking.status === 'CANCELLED' || booking.status === 'DECLINED' || booking.status === 'EXPIRED') {
      isPayable = false;
      unpayableReason = `Cannot initiate payment for booking in '${booking.status}' status.`;
    }

    const latestPayment = booking.payments[0];
    if (latestPayment && latestPayment.status === 'PAID') {
      isPayable = false;
      unpayableReason = 'This booking has already been paid.';
    }

    if (booking.pricingModelSnapshot === 'QUOTE') {
      if (booking.priceSnapshot === null || booking.priceSnapshot <= 0) {
        isPayable = false;
        unpayableReason = 'A final agreed quote price is required before payment can be initiated.';
      } else {
        baseAmountPaise = rupeesToPaise(booking.priceSnapshot);
      }
    } else if (booking.pricingModelSnapshot === 'HOURLY') {
      const rate = booking.priceSnapshot || 0;
      baseAmountPaise = rupeesToPaise(rate * booking.durationHours);
    } else {
      // FIXED, PER_VISIT, PER_TASK
      baseAmountPaise = rupeesToPaise(booking.priceSnapshot || 0);
    }

    if (baseAmountPaise <= 0 && isPayable) {
      isPayable = false;
      unpayableReason = 'Authoritative service pricing is unavailable or zero.';
    }

    const platformFeePaise = 0; // Explicit 0 unless configured
    const taxPaise = 0; // Statutory tax is explicit 0 unless project tax engine is configured
    const discountPaise = 0;
    const totalPaise = baseAmountPaise + platformFeePaise + taxPaise - discountPaise;

    return {
      bookingId: booking.id,
      referenceCode: booking.referenceCode,
      serviceTitle: booking.serviceTitleSnapshot,
      pricingModel: booking.pricingModelSnapshot as import('@sevasetu/shared').CatalogPricingModel,
      baseAmountPaise,
      platformFeePaise,
      taxPaise,
      discountPaise,
      totalPaise,
      currency: 'INR',
      isPayable,
      unpayableReason,
      existingPayment: latestPayment ? this.formatPaymentRecord(latestPayment) : null,
    };
  }

  /**
   * Initiates a payment order / intent with the gateway and persists an internal Payment record.
   * Enforces idempotency via idempotencyKey.
   */
  static async createPaymentOrder(
    customerId: string,
    input: CreatePaymentOrderInput
  ): Promise<CreatePaymentOrderResponse> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    if (!input.bookingId) {
      throw new PaymentValidationError('bookingId is required.');
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Idempotency Check
      if (input.idempotencyKey) {
        const existingByKey = await tx.payment.findUnique({
          where: { idempotencyKey: input.idempotencyKey },
          include: { booking: true },
        });
        if (existingByKey) {
          if (existingByKey.customerId !== customerId) {
            throw new PaymentAuthorizationError('Idempotency key belongs to another customer.');
          }
          return {
            payment: PaymentService.formatPaymentRecord(existingByKey),
            gatewayOrder: existingByKey.gatewayOrderId
              ? {
                  orderId: existingByKey.gatewayOrderId,
                  amount: existingByKey.amount,
                  currency: existingByKey.currency,
                }
              : undefined,
            isExisting: true,
          };
        }
      }

      // 2. Fetch and lock booking row
      const booking = await tx.booking.findUnique({
        where: { id: input.bookingId },
      });

      if (!booking) {
        throw new PaymentNotFoundError(`Booking '${input.bookingId}' not found.`);
      }

      if (booking.customerId !== customerId) {
        throw new PaymentAuthorizationError('Forbidden: You can only initiate payment for your own bookings.');
      }

      // 3. Verify booking status permits payment
      const nonPayableStatuses = ['CANCELLED', 'DECLINED', 'EXPIRED'];
      if (nonPayableStatuses.includes(booking.status)) {
        throw new PaymentConflictError(
          `Cannot create payment order for booking in status '${booking.status}'.`
        );
      }

      // 4. Verify no existing PAID payment exists
      const existingPaid = await tx.payment.findFirst({
        where: {
          bookingId: booking.id,
          status: 'PAID',
        },
      });
      if (existingPaid) {
        throw new PaymentConflictError('This booking has already been paid.');
      }

      // 5. Authoritative price determination
      let baseAmountPaise = 0;
      if (booking.pricingModelSnapshot === 'QUOTE') {
        if (!booking.priceSnapshot || booking.priceSnapshot <= 0) {
          throw new PaymentValidationError('Quote booking does not have a valid agreed price snapshot.');
        }
        baseAmountPaise = rupeesToPaise(booking.priceSnapshot);
      } else if (booking.pricingModelSnapshot === 'HOURLY') {
        baseAmountPaise = rupeesToPaise((booking.priceSnapshot || 0) * booking.durationHours);
      } else {
        baseAmountPaise = rupeesToPaise(booking.priceSnapshot || 0);
      }

      if (baseAmountPaise <= 0) {
        throw new PaymentValidationError('Calculated payable amount must be greater than zero.');
      }

      const platformFeePaise = 0;
      const taxPaise = 0;
      const discountPaise = 0;
      const totalAmountPaise = baseAmountPaise + platformFeePaise + taxPaise - discountPaise;

      // 6. Generate unique internal reference code: PAY-YYYYMMDD-XXXXX
      const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
      const referenceCode = `PAY-${dateCode}-${randomHex}`;

      // 7. Payment gateway intent creation
      const gateway = getPaymentGatewayAdapter();
      let gatewayOrderId: string | null = null;
      let gatewayKeyId: string | undefined;

      if (gateway.isConfigured()) {
        const orderResult = await gateway.createOrder({
          amountPaise: totalAmountPaise,
          currency: 'INR',
          receipt: referenceCode,
          notes: {
            bookingId: booking.id,
            bookingRef: booking.referenceCode,
          },
        });
        gatewayOrderId = orderResult.orderId;
        gatewayKeyId = orderResult.keyId;
      } else {
        // When gateway credentials are not configured in environment, generate standard order ID
        gatewayOrderId = `order_${crypto.randomBytes(8).toString('hex')}`;
      }

      // 8. Persist Payment record
      const payment = await tx.payment.create({
        data: {
          referenceCode,
          bookingId: booking.id,
          customerId,
          providerProfileId: booking.providerProfileId,
          gatewayProvider: gateway.providerName,
          gatewayOrderId,
          idempotencyKey: input.idempotencyKey || null,
          amount: totalAmountPaise,
          baseAmount: baseAmountPaise,
          taxAmount: taxPaise,
          platformFee: platformFeePaise,
          discountAmount: discountPaise,
          currency: 'INR',
          status: 'PENDING',
        },
      });

      // 9. Initial Status History
      await tx.paymentStatusHistory.create({
        data: {
          paymentId: payment.id,
          previousStatus: null,
          newStatus: 'PENDING',
          actorType: 'CUSTOMER',
          actorUserId: customerId,
          reason: 'Payment order created by customer.',
        },
      });

      return {
        payment: PaymentService.formatPaymentRecord(payment),
        gatewayOrder: {
          orderId: gatewayOrderId,
          amount: totalAmountPaise,
          currency: 'INR',
          keyId: gatewayKeyId,
        },
      };
    });
  }

  /**
   * Verifies payment completion cryptographically and records invoice and provider earnings.
   */
  static async verifyPayment(
    customerId: string,
    input: VerifyPaymentInput
  ): Promise<PaymentRecord> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    if (!input.bookingId || !input.gatewayOrderId || !input.gatewayPaymentId || !input.gatewaySignature) {
      throw new PaymentValidationError('All verification parameters are required.');
    }

    // 1. Find payment record for this booking & order
    const payment = await prisma.payment.findFirst({
      where: {
        bookingId: input.bookingId,
        gatewayOrderId: input.gatewayOrderId,
      },
    });

    if (!payment) {
      throw new PaymentNotFoundError('No matching payment order found for verification.');
    }

    if (payment.customerId !== customerId) {
      throw new PaymentAuthorizationError('Forbidden: Payment order belongs to another customer.');
    }

    // 2. Check if already marked PAID (idempotent duplicate verification protection)
    if (payment.status === 'PAID') {
      const fullPayment = await prisma.payment.findUnique({
        where: { id: payment.id },
        include: { invoices: true },
      });
      return PaymentService.formatPaymentRecord(fullPayment || payment);
    }

    // 3. Cryptographic signature verification
    const gateway = getPaymentGatewayAdapter();
    let signatureValid = false;

    if (gateway.isConfigured()) {
      signatureValid = gateway.verifyPaymentSignature({
        gatewayOrderId: input.gatewayOrderId,
        gatewayPaymentId: input.gatewayPaymentId,
        gatewaySignature: input.gatewaySignature,
      });
    } else {
      // In local/test environments with test credentials or simulated HMAC
      const testSecret = 'sevasetu_test_signature_secret_2026';
      const expected = crypto
        .createHmac('sha256', testSecret)
        .update(`${input.gatewayOrderId}|${input.gatewayPaymentId}`)
        .digest('hex');
      signatureValid = input.gatewaySignature === expected || input.gatewaySignature === 'VALID_TEST_SIGNATURE';
    }

    if (!signatureValid) {
      // Record failed attempt in history and database (committed so it persists)
      await prisma.paymentStatusHistory.create({
        data: {
          paymentId: payment.id,
          previousStatus: payment.status,
          newStatus: 'FAILED',
          actorType: 'SYSTEM',
          reason: 'Payment signature verification failed.',
        },
      });
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          failureCode: 'INVALID_SIGNATURE',
          failureMessage: 'Cryptographic signature mismatch during payment verification.',
        },
      });
      throw new PaymentValidationError('Payment verification failed: Invalid cryptographic signature.');
    }

    // 4. Validate transition
    PaymentTransitionService.validateTransition(payment.status, 'PAID', 'CUSTOMER');

    const paymentResult = await prisma.$transaction(async (tx) => {
      // 5. Update payment to PAID
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'PAID',
          gatewayPaymentId: input.gatewayPaymentId,
          paymentMethod: input.paymentMethod || 'ONLINE_PAYMENT',
          paidAt: new Date(),
        },
      });

      // 6. Record status history
      await tx.paymentStatusHistory.create({
        data: {
          paymentId: payment.id,
          previousStatus: payment.status,
          newStatus: 'PAID',
          actorType: 'CUSTOMER',
          actorUserId: customerId,
          reason: 'Payment successfully verified and settled.',
        },
      });

      // 7. Load booking for invoice and earnings
      const booking = await tx.booking.findUnique({
        where: { id: payment.bookingId },
      });

      if (booking) {
        // 8. Generate immutable Tax Invoice
        await InvoiceService.createInvoiceForPayment(tx, updatedPayment, booking as Parameters<typeof InvoiceService.createInvoiceForPayment>[2]);

        // 9. If booking is already COMPLETED, recognize provider earning immediately
        if (booking.status === 'COMPLETED') {
          await EarningService.recognizeEarningForBooking(tx, booking, updatedPayment);
        }
      }

      const finalPayment = await tx.payment.findUnique({
        where: { id: payment.id },
        include: { invoices: true },
      });

      return PaymentService.formatPaymentRecord(finalPayment || updatedPayment);
    });

    // Safely dispatch payment confirmed event after transaction commit
    const bookingForEvent = await prisma.booking.findUnique({ where: { id: paymentResult.bookingId } });
    if (bookingForEvent) {
      void EventService.onPaymentPaid(paymentResult, bookingForEvent);
    }

    return paymentResult;
  }

  /**
   * Processes server-authoritative webhook events from the payment gateway.
   */
  static async handleWebhook(
    rawBody: Buffer | string,
    signature: string
  ): Promise<{ success: boolean; event: string; message: string }> {
    const gateway = getPaymentGatewayAdapter();

    // Verify webhook signature
    let signatureValid = false;
    if (gateway.isConfigured()) {
      signatureValid = gateway.verifyWebhookSignature(rawBody, signature);
    } else {
      const testSecret = 'sevasetu_test_webhook_secret_2026';
      const expected = crypto
        .createHmac('sha256', testSecret)
        .update(typeof rawBody === 'string' ? rawBody : rawBody.toString('utf-8'))
        .digest('hex');
      signatureValid = signature === expected || signature === 'VALID_TEST_WEBHOOK_SIGNATURE';
    }

    if (!signatureValid) {
      throw new PaymentValidationError('Invalid webhook signature.');
    }

    const payloadText = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf-8');
    interface WebhookPayload {
      event?: string;
      payload?: {
        payment?: {
          entity?: {
            id?: string;
            order_id?: string;
            error_code?: string;
            error_description?: string;
          };
        };
        order?: {
          entity?: {
            id?: string;
          };
        };
      };
    }
    let eventData: WebhookPayload;
    try {
      eventData = JSON.parse(payloadText) as WebhookPayload;
    } catch {
      throw new PaymentValidationError('Malformed webhook JSON payload.');
    }

    const event = eventData.event || '';
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    if (event === 'payment.captured' || event === 'order.paid') {
      const orderId = eventData.payload?.payment?.entity?.order_id || eventData.payload?.order?.entity?.id;
      const paymentId = eventData.payload?.payment?.entity?.id;

      if (!orderId) {
        return { success: true, event, message: 'Ignored: No order_id present in event.' };
      }

      await prisma.$transaction(async (tx) => {
        const payment = await tx.payment.findUnique({
          where: { gatewayOrderId: orderId },
        });

        if (!payment) return;

        if (payment.status === 'PAID') {
          // Idempotent: already marked PAID
          return;
        }

        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: 'PAID',
            gatewayPaymentId: paymentId || payment.gatewayPaymentId,
            paidAt: new Date(),
          },
        });

        await tx.paymentStatusHistory.create({
          data: {
            paymentId: payment.id,
            previousStatus: payment.status,
            newStatus: 'PAID',
            actorType: 'SYSTEM',
            reason: `Webhook event '${event}' confirmed payment settlement.`,
          },
        });

        const booking = await tx.booking.findUnique({
          where: { id: payment.bookingId },
        });

        if (booking) {
          await InvoiceService.createInvoiceForPayment(tx, payment, booking as Parameters<typeof InvoiceService.createInvoiceForPayment>[2]);
          if (booking.status === 'COMPLETED') {
            await EarningService.recognizeEarningForBooking(tx, booking, payment);
          }
        }
      });

      return { success: true, event, message: 'Payment settled via webhook.' };
    }

    if (event === 'payment.failed') {
      const orderId = eventData.payload?.payment?.entity?.order_id;
      if (orderId) {
        await prisma.payment.updateMany({
          where: { gatewayOrderId: orderId, status: { not: 'PAID' } },
          data: {
            status: 'FAILED',
            failureCode: eventData.payload?.payment?.entity?.error_code || 'GATEWAY_DECLINE',
            failureMessage: eventData.payload?.payment?.entity?.error_description || 'Payment was declined by bank/gateway.',
          },
        });
      }
      return { success: true, event, message: 'Recorded payment failure.' };
    }

    return { success: true, event, message: `Ignored unhandled event: ${event}` };
  }

  /**
   * Processes a cancellation refund based on strict cancellation timing policy.
   */
  static async processCancellationRefund(
    bookingId: string,
    cancelledByUserId: string,
    actorType: BookingActorType,
    reason: string
  ): Promise<RefundRecord | null> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    return await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findFirst({
        where: {
          bookingId,
          status: { in: ['PAID', 'REFUNDED', 'PARTIALLY_REFUNDED'] },
        },
        include: { booking: true },
      });

      if (!payment) {
        // No paid payment exists, nothing to refund
        return null;
      }

      const booking = payment.booking;

      // Calculate authoritative refund amount based on cancellation policy
      let refundAmountPaise = 0;

      if (booking.status === 'COMPLETED') {
        // Completed jobs are not refundable via automatic cancellation
        refundAmountPaise = 0;
      } else {
        // Retrieve authoritative configured cancellation policy (throws FinancialPolicyConfigurationError if unconfigured)
        const policy = FinancialPolicyService.getCancellationPolicy();

        // Calculate hours until scheduled service
        const scheduledDateTime = new Date(`${booking.scheduledDate.toISOString().split('T')[0]}T${booking.scheduledStartTime}:00.000Z`);
        const now = new Date();
        const diffHours = (scheduledDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (diffHours >= policy.freeCancellationWindowHours || booking.status === 'PENDING_PROVIDER' || booking.status === 'ACCEPTED') {
          // Free cancellation window: 100% refund
          refundAmountPaise = payment.amount;
        } else {
          // Late cancellation: Late fee applied according to configured percentage, remaining refunded
          const lateFee = Math.floor((payment.amount * policy.lateCancellationFeePercent) / 100);
          refundAmountPaise = payment.amount - lateFee;
        }
      }

      if (refundAmountPaise <= 0) {
        return null;
      }

      // Check if refund already exists (double-refund protection)
      const existingRefund = await tx.refund.findFirst({
        where: {
          paymentId: payment.id,
          status: { in: ['COMPLETED', 'PROCESSING', 'PENDING'] },
        },
      });

      if (existingRefund) {
        return {
          id: existingRefund.id,
          refundReference: existingRefund.refundReference,
          paymentId: existingRefund.paymentId,
          bookingId: existingRefund.bookingId,
          gatewayRefundId: existingRefund.gatewayRefundId,
          amount: existingRefund.amount,
          currency: existingRefund.currency,
          status: existingRefund.status as RefundRecord['status'],
          reason: existingRefund.reason,
          initiatedBy: existingRefund.initiatedBy as RefundRecord['initiatedBy'],
          processedAt: existingRefund.processedAt ? existingRefund.processedAt.toISOString() : null,
          createdAt: existingRefund.createdAt.toISOString(),
        };
      }

      const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
      const refundReference = `RFND-${dateCode}-${randomHex}`;

      const refund = await tx.refund.create({
        data: {
          refundReference,
          paymentId: payment.id,
          bookingId,
          amount: refundAmountPaise,
          currency: payment.currency,
          status: 'COMPLETED',
          reason: reason || 'Booking cancelled',
          initiatedBy: actorType,
          initiatedByUserId: cancelledByUserId,
          processedAt: new Date(),
        },
      });

      // Update aggregate payment status
      const newStatus = refundAmountPaise === payment.amount ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: newStatus },
      });

      await tx.paymentStatusHistory.create({
        data: {
          paymentId: payment.id,
          previousStatus: payment.status,
          newStatus,
          actorType,
          actorUserId: cancelledByUserId,
          reason: `Cancellation refund of ${refundAmountPaise / 100} INR processed. Reason: ${reason}`,
        },
      });

      // If provider earning was recognized, cancel it
      await tx.providerEarning.updateMany({
        where: { bookingId, status: { not: 'DISBURSED' } },
        data: { status: 'CANCELLED' },
      });

      return {
        id: refund.id,
        refundReference: refund.refundReference,
        paymentId: refund.paymentId,
        bookingId: refund.bookingId,
        gatewayRefundId: refund.gatewayRefundId,
        amount: refund.amount,
        currency: refund.currency,
        status: refund.status as RefundRecord['status'],
        reason: refund.reason,
        initiatedBy: refund.initiatedBy as RefundRecord['initiatedBy'],
        processedAt: refund.processedAt ? refund.processedAt.toISOString() : null,
        createdAt: refund.createdAt.toISOString(),
      };
    });
  }

  /**
   * Retrieves all payments for a customer.
   */
  static async getCustomerPayments(customerId: string): Promise<PaymentRecord[]> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const payments = await prisma.payment.findMany({
      where: { customerId },
      include: {
        booking: {
          select: {
            id: true,
            referenceCode: true,
            serviceTitleSnapshot: true,
            scheduledDate: true,
            status: true,
          },
        },
        invoices: true,
        refunds: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return payments.map(this.formatPaymentRecord);
  }

  /**
   * Retrieves a single payment record by ID with authorization check.
   */
  static async getPaymentById(userId: string, paymentId: string, role: string): Promise<PaymentRecord> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: {
          select: {
            id: true,
            referenceCode: true,
            serviceTitleSnapshot: true,
            scheduledDate: true,
            status: true,
          },
        },
        invoices: true,
        refunds: true,
      },
    });

    if (!payment) {
      throw new PaymentNotFoundError(`Payment '${paymentId}' not found.`);
    }

    if (role === 'CUSTOMER') {
      if (payment.customerId !== userId) {
        throw new PaymentAuthorizationError('Forbidden: You can only view your own payments.');
      }
    } else if (role === 'PROVIDER') {
      const providerProfile = await prisma.serviceProviderProfile.findUnique({
        where: { userId },
      });
      if (!providerProfile || payment.providerProfileId !== providerProfile.id) {
        throw new PaymentAuthorizationError('Forbidden: You can only view payments for your assigned bookings.');
      }
    } else if (role !== 'ADMIN') {
      throw new PaymentAuthorizationError('Forbidden: Unauthorized role.');
    }

    return this.formatPaymentRecord(payment);
  }

  public static formatPaymentRecord(p: {
    id: string;
    referenceCode: string;
    bookingId: string;
    customerId: string;
    providerProfileId: string;
    gatewayProvider: string;
    gatewayOrderId: string | null;
    gatewayPaymentId: string | null;
    idempotencyKey: string | null;
    amount: number;
    baseAmount: number;
    taxAmount: number;
    platformFee: number;
    discountAmount: number;
    currency: string;
    status: string;
    paymentMethod: string | null;
    failureCode: string | null;
    failureMessage: string | null;
    paidAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    booking?: {
      id: string;
      referenceCode: string;
      serviceTitleSnapshot: string;
      scheduledDate: Date;
      status: string;
    } | null;
    invoices?: Array<{
      id: string;
      invoiceNumber: string;
      bookingId: string;
      total: number;
      paymentStatus: string;
      issuedAt: Date;
    }>;
    refunds?: Array<{
      id: string;
      refundReference: string;
      amount: number;
      status: string;
      reason: string;
      createdAt: Date;
    }>;
  }): PaymentRecord {
    return {
      id: p.id,
      referenceCode: p.referenceCode,
      bookingId: p.bookingId,
      customerId: p.customerId,
      providerProfileId: p.providerProfileId,
      gatewayProvider: p.gatewayProvider,
      gatewayOrderId: p.gatewayOrderId,
      gatewayPaymentId: p.gatewayPaymentId,
      idempotencyKey: p.idempotencyKey,
      amount: p.amount,
      baseAmount: p.baseAmount,
      taxAmount: p.taxAmount,
      platformFee: p.platformFee,
      discountAmount: p.discountAmount,
      currency: p.currency,
      status: p.status as PaymentRecord['status'],
      paymentMethod: p.paymentMethod,
      failureCode: p.failureCode,
      failureMessage: p.failureMessage,
      paidAt: p.paidAt ? p.paidAt.toISOString() : null,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      booking: p.booking
        ? ({
            id: p.booking.id,
            referenceCode: p.booking.referenceCode,
            serviceTitleSnapshot: p.booking.serviceTitleSnapshot,
            scheduledDate: p.booking.scheduledDate ? p.booking.scheduledDate.toISOString().split('T')[0] : '',
            status: p.booking.status,
          } as unknown as import('@sevasetu/shared').BookingRecord)
        : undefined,
      invoices: p.invoices?.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        bookingId: inv.bookingId,
        total: inv.total,
        paymentStatus: inv.paymentStatus as import('@sevasetu/shared').PaymentStatus,
        issuedAt: inv.issuedAt.toISOString(),
      })),
      refunds: p.refunds?.map((r) => ({
        id: r.id,
        refundReference: r.refundReference,
        amount: r.amount,
        status: r.status as import('@sevasetu/shared').RefundStatus,
        reason: r.reason,
        createdAt: r.createdAt.toISOString(),
      })),
    };
  }
}
