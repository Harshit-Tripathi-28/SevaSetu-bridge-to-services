import type { Request, Response } from 'express';
import type { ApiResponse } from '@sevasetu/shared';
import {
  PaymentService,
  PaymentValidationError,
  PaymentNotFoundError,
  PaymentConflictError,
} from '../services/payment.service.js';
import {
  PaymentAuthorizationError,
  InvalidPaymentTransitionError,
} from '../services/payment-transition.service.js';
import {
  InvoiceService,
  InvoiceNotFoundError,
  InvoiceAuthorizationError,
} from '../services/invoice.service.js';
import { EarningService, EarningError } from '../services/earning.service.js';
import { PaymentGatewayConfigurationError } from '../services/payment-gateway.adapter.js';

function handleControllerError(err: unknown, res: Response): void {
  if (err instanceof PaymentValidationError) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: err.message },
    });
    return;
  }
  if (err instanceof PaymentNotFoundError || err instanceof InvoiceNotFoundError) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: err.message },
    });
    return;
  }
  if (err instanceof PaymentConflictError || err instanceof InvalidPaymentTransitionError) {
    res.status(409).json({
      success: false,
      error: { code: 'STATE_CONFLICT', message: err.message },
    });
    return;
  }
  if (err instanceof PaymentAuthorizationError || err instanceof InvoiceAuthorizationError) {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: err.message },
    });
    return;
  }
  if (err instanceof PaymentGatewayConfigurationError) {
    res.status(503).json({
      success: false,
      error: { code: 'GATEWAY_UNCONFIGURED', message: err.message },
    });
    return;
  }
  if (err instanceof EarningError) {
    res.status(400).json({
      success: false,
      error: { code: 'FINANCIAL_ERROR', message: err.message },
    });
    return;
  }

  const message = err instanceof Error ? err.message : 'Internal Server Error';
  console.error('[PaymentController Error]:', err);
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message },
  });
}

export class PaymentController {
  /**
   * GET /api/payments/breakdown/:bookingId
   * Computes authoritative price breakdown for checkout.
   */
  static async getPaymentBreakdown(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
        });
        return;
      }

      const { bookingId } = req.params;
      const breakdown = await PaymentService.getBookingPaymentBreakdown(
        req.user.id,
        bookingId as string,
        req.user.role
      );

      res.status(200).json({
        success: true,
        data: breakdown,
      });
    } catch (err) {
      handleControllerError(err, res);
    }
  }

  /**
   * POST /api/payments/orders
   * Creates payment order / intent with the gateway.
   */
  static async createOrder(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
        });
        return;
      }

      const idempotencyHdr = req.headers['idempotency-key'];
      const idempotencyKey =
        req.body.idempotencyKey ||
        (Array.isArray(idempotencyHdr) ? idempotencyHdr[0] : idempotencyHdr) ||
        undefined;

      const result = await PaymentService.createPaymentOrder(req.user.id, {
        bookingId: req.body.bookingId,
        idempotencyKey,
      });

      const statusCode = (result as { isExisting?: boolean }).isExisting ? 200 : 201;
      res.status(statusCode).json({
        success: true,
        data: result,
      });
    } catch (err) {
      handleControllerError(err, res);
    }
  }

  /**
   * POST /api/payments/verify
   * Cryptographically verifies payment completion and issues invoice.
   */
  static async verifyPayment(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
        });
        return;
      }

      const result = await PaymentService.verifyPayment(req.user.id, {
        bookingId: req.body.bookingId,
        gatewayOrderId: req.body.gatewayOrderId,
        gatewayPaymentId: req.body.gatewayPaymentId,
        gatewaySignature: req.body.gatewaySignature,
        paymentMethod: req.body.paymentMethod,
      });

      res.status(200).json({
        success: true,
        data: result,
        message: 'Payment verified successfully. Tax invoice generated.',
      });
    } catch (err) {
      handleControllerError(err, res);
    }
  }

  /**
   * POST /api/payments/webhook
   * Server-authoritative webhook listener for payment events.
   */
  static async handleWebhook(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const signature = (req.headers['x-razorpay-signature'] as string) || (req.headers['x-webhook-signature'] as string) || '';
      const rawBody = (req as Request & { rawBody?: string }).rawBody || JSON.stringify(req.body);

      const result = await PaymentService.handleWebhook(rawBody, signature);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      handleControllerError(err, res);
    }
  }

  /**
   * GET /api/customer/payments
   * List customer payment history.
   */
  static async getCustomerPayments(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
        });
        return;
      }
      if (req.user.role !== 'CUSTOMER' && req.user.role !== 'ADMIN') {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Forbidden: Customer role required.' },
        });
        return;
      }

      const payments = await PaymentService.getCustomerPayments(req.user.id);

      res.status(200).json({
        success: true,
        data: { payments },
      });
    } catch (err) {
      handleControllerError(err, res);
    }
  }

  /**
   * GET /api/payments/:id
   * Single payment details.
   */
  static async getPaymentById(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
        });
        return;
      }

      const { id } = req.params;
      const payment = await PaymentService.getPaymentById(req.user.id, id as string, req.user.role);

      res.status(200).json({
        success: true,
        data: payment,
      });
    } catch (err) {
      handleControllerError(err, res);
    }
  }

  /**
   * GET /api/customer/invoices
   * List customer invoices.
   */
  static async getCustomerInvoices(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
        });
        return;
      }

      const invoices = await InvoiceService.getCustomerInvoices(req.user.id);

      res.status(200).json({
        success: true,
        data: { invoices },
      });
    } catch (err) {
      handleControllerError(err, res);
    }
  }

  /**
   * GET /api/provider/invoices
   * List invoices for provider's executed jobs.
   */
  static async getProviderInvoices(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
        });
        return;
      }
      if (req.user.role !== 'PROVIDER' && req.user.role !== 'ADMIN') {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Forbidden: Provider role required.' },
        });
        return;
      }

      const { getPrismaClient } = await import('../config/database.js');
      const prisma = getPrismaClient();
      const profile = await prisma?.serviceProviderProfile.findUnique({
        where: { userId: req.user.id },
      });

      if (!profile) {
        res.status(404).json({
          success: false,
          error: { code: 'PROFILE_NOT_FOUND', message: 'Provider profile not found.' },
        });
        return;
      }

      const invoices = await InvoiceService.getProviderInvoices(profile.id);

      res.status(200).json({
        success: true,
        data: { invoices },
      });
    } catch (err) {
      handleControllerError(err, res);
    }
  }

  /**
   * GET /api/invoices/:id
   * Get invoice by ID (or /api/customer/invoices/:id).
   */
  static async getInvoiceById(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
        });
        return;
      }

      const { id } = req.params;
      const invoice = await InvoiceService.getInvoiceById(req.user.id, id as string, req.user.role);

      res.status(200).json({
        success: true,
        data: invoice,
      });
    } catch (err) {
      handleControllerError(err, res);
    }
  }

  /**
   * GET /api/provider/earnings/summary
   * Provider earnings ledger summary.
   */
  static async getProviderEarningsSummary(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
        });
        return;
      }
      if (req.user.role !== 'PROVIDER' && req.user.role !== 'ADMIN') {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Forbidden: Provider role required.' },
        });
        return;
      }

      const { getPrismaClient } = await import('../config/database.js');
      const prisma = getPrismaClient();
      const profile = await prisma?.serviceProviderProfile.findUnique({
        where: { userId: req.user.id },
      });

      if (!profile) {
        res.status(404).json({
          success: false,
          error: { code: 'PROFILE_NOT_FOUND', message: 'Provider profile not found.' },
        });
        return;
      }

      const summary = await EarningService.getProviderEarningsSummary(profile.id);

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (err) {
      handleControllerError(err, res);
    }
  }

  /**
   * GET /api/provider/earnings
   * Provider earnings list.
   */
  static async getProviderEarnings(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
        });
        return;
      }
      if (req.user.role !== 'PROVIDER' && req.user.role !== 'ADMIN') {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Forbidden: Provider role required.' },
        });
        return;
      }

      const { getPrismaClient } = await import('../config/database.js');
      const prisma = getPrismaClient();
      const profile = await prisma?.serviceProviderProfile.findUnique({
        where: { userId: req.user.id },
      });

      if (!profile) {
        res.status(404).json({
          success: false,
          error: { code: 'PROFILE_NOT_FOUND', message: 'Provider profile not found.' },
        });
        return;
      }

      const earnings = await EarningService.getProviderEarnings(profile.id);

      res.status(200).json({
        success: true,
        data: { earnings },
      });
    } catch (err) {
      handleControllerError(err, res);
    }
  }

  /**
   * GET /api/provider/payouts
   * Provider payouts list.
   */
  static async getProviderPayouts(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
        });
        return;
      }
      if (req.user.role !== 'PROVIDER' && req.user.role !== 'ADMIN') {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Forbidden: Provider role required.' },
        });
        return;
      }

      const { getPrismaClient } = await import('../config/database.js');
      const prisma = getPrismaClient();
      const profile = await prisma?.serviceProviderProfile.findUnique({
        where: { userId: req.user.id },
      });

      if (!profile) {
        res.status(404).json({
          success: false,
          error: { code: 'PROFILE_NOT_FOUND', message: 'Provider profile not found.' },
        });
        return;
      }

      const payouts = await EarningService.getProviderPayouts(profile.id);

      res.status(200).json({
        success: true,
        data: { payouts },
      });
    } catch (err) {
      handleControllerError(err, res);
    }
  }

  /**
   * POST /api/provider/payouts
   * Request a payout from available balance.
   */
  static async requestPayout(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
        });
        return;
      }
      if (req.user.role !== 'PROVIDER') {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Forbidden: Provider role required.' },
        });
        return;
      }

      const { getPrismaClient } = await import('../config/database.js');
      const prisma = getPrismaClient();
      const profile = await prisma?.serviceProviderProfile.findUnique({
        where: { userId: req.user.id },
      });

      if (!profile) {
        res.status(404).json({
          success: false,
          error: { code: 'PROFILE_NOT_FOUND', message: 'Provider profile not found.' },
        });
        return;
      }

      const amountPaise = Number(req.body.amountPaise);
      const payout = await EarningService.requestProviderPayout(
        profile.id,
        amountPaise,
        req.body.bankDetails
      );

      res.status(201).json({
        success: true,
        data: payout,
        message: 'Payout request initiated successfully.',
      });
    } catch (err) {
      handleControllerError(err, res);
    }
  }
}
