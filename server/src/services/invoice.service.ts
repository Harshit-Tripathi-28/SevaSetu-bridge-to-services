import type { Prisma } from '@prisma/client';
import { getPrismaClient } from '../config/database.js';
import type { InvoiceRecord } from '@sevasetu/shared';

export class InvoiceNotFoundError extends Error {
  constructor(message = 'Invoice not found.') {
    super(message);
    this.name = 'InvoiceNotFoundError';
  }
}

export class InvoiceAuthorizationError extends Error {
  constructor(message = 'Forbidden: You do not have permission to access this invoice.') {
    super(message);
    this.name = 'InvoiceAuthorizationError';
  }
}

export class InvoiceService {
  /**
   * Generates a collision-safe sequential invoice number using the PostgreSQL InvoiceSequence table.
   * Format: INV-YYYYMM-XXXXX (e.g. INV-202610-00001)
   */
  static async generateInvoiceNumber(tx: Prisma.TransactionClient, date: Date = new Date()): Promise<string> {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const sequenceKey = `INV_SEQUENCE_${year}${month}`;

    const seq = await tx.invoiceSequence.upsert({
      where: { id: sequenceKey },
      update: {
        currentValue: { increment: 1 },
      },
      create: {
        id: sequenceKey,
        currentValue: 1,
      },
    });

    const paddedNumber = String(seq.currentValue).padStart(5, '0');
    return `INV-${year}${month}-${paddedNumber}`;
  }

  /**
   * Creates an immutable tax invoice record for a paid booking within a PostgreSQL transaction.
   */
  static async createInvoiceForPayment(
    tx: Prisma.TransactionClient,
    payment: {
      id: string;
      bookingId: string;
      customerId: string;
      providerProfileId: string;
      amount: number;
      baseAmount: number;
      taxAmount: number;
      platformFee: number;
      discountAmount: number;
      paymentMethod?: string | null;
      currency: string;
    },
    booking: {
      id: string;
      referenceCode: string;
      scheduledDate: Date;
      serviceTitleSnapshot: string;
      pricingModelSnapshot: string;
      priceSnapshot: number | null;
      durationHours: number;
      customerSnapshot: unknown;
      providerSnapshot: unknown;
      locationSnapshot: unknown;
    }
  ): Promise<string> {
    // Generate atomic collision-safe invoice number
    const invoiceNumber = await this.generateInvoiceNumber(tx, new Date());

    // Build customer snapshot including billing address
    const customerRaw = (booking.customerSnapshot as Record<string, unknown>) || {};
    const locationRaw = (booking.locationSnapshot as Record<string, unknown>) || {};
    const providerRaw = (booking.providerSnapshot as Record<string, unknown>) || {};

    const customerSnapshotJson: Prisma.InputJsonValue = {
      fullName: (customerRaw.fullName as string) || null,
      email: (customerRaw.email as string) || null,
      phone: (customerRaw.phone as string) || null,
      billingAddress: locationRaw as unknown as Prisma.InputJsonObject,
    };

    const providerSnapshotJson: Prisma.InputJsonValue = {
      businessName: (providerRaw.businessName as string) || null,
      displayName: (providerRaw.fullName as string) || null,
      phone: (providerRaw.phone as string) || null,
      email: (providerRaw.email as string) || null,
      taxRegistration: (providerRaw.taxRegistration as string) || null,
    };

    const invoice = await tx.invoice.create({
      data: {
        invoiceNumber,
        bookingId: payment.bookingId,
        paymentId: payment.id,
        customerId: payment.customerId,
        providerProfileId: payment.providerProfileId,
        serviceTitleSnapshot: booking.serviceTitleSnapshot,
        serviceDate: booking.scheduledDate,
        customerSnapshot: customerSnapshotJson,
        providerSnapshot: providerSnapshotJson,
        subtotal: payment.baseAmount,
        tax: payment.taxAmount,
        platformFee: payment.platformFee,
        discount: payment.discountAmount,
        total: payment.amount,
        currency: payment.currency || 'INR',
        paymentStatus: 'PAID',
        paymentMethodMasked: payment.paymentMethod || 'ONLINE_PAYMENT',
      },
    });

    // Create line item for main service
    await tx.invoiceLineItem.create({
      data: {
        invoiceId: invoice.id,
        description: `${booking.serviceTitleSnapshot} (${booking.pricingModelSnapshot}${
          booking.pricingModelSnapshot === 'HOURLY' ? ` - ${booking.durationHours} hrs` : ''
        })`,
        quantity: booking.pricingModelSnapshot === 'HOURLY' ? booking.durationHours : 1.0,
        unitPrice:
          booking.pricingModelSnapshot === 'HOURLY' && booking.durationHours > 0
            ? Math.round(payment.baseAmount / booking.durationHours)
            : payment.baseAmount,
        total: payment.baseAmount,
      },
    });

    // If platform fee was applied, add as line item
    if (payment.platformFee > 0) {
      await tx.invoiceLineItem.create({
        data: {
          invoiceId: invoice.id,
          description: 'Platform Safety & Service Guarantee Fee',
          quantity: 1.0,
          unitPrice: payment.platformFee,
          total: payment.platformFee,
        },
      });
    }

    return invoice.id;
  }

  /**
   * Retrieves all invoices for a customer.
   */
  static async getCustomerInvoices(customerId: string): Promise<InvoiceRecord[]> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const invoices = await prisma.invoice.findMany({
      where: { customerId },
      include: {
        lineItems: true,
        booking: {
          select: {
            id: true,
            referenceCode: true,
            status: true,
          },
        },
      },
      orderBy: { issuedAt: 'desc' },
    });

    return invoices.map(this.formatInvoiceRecord);
  }

  /**
   * Retrieves all invoices for a provider.
   */
  static async getProviderInvoices(providerProfileId: string): Promise<InvoiceRecord[]> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const invoices = await prisma.invoice.findMany({
      where: { providerProfileId },
      include: {
        lineItems: true,
        booking: {
          select: {
            id: true,
            referenceCode: true,
            status: true,
          },
        },
      },
      orderBy: { issuedAt: 'desc' },
    });

    return invoices.map(this.formatInvoiceRecord);
  }

  /**
   * Retrieves a single invoice by ID with strict ownership validation.
   */
  static async getInvoiceById(userId: string, invoiceId: string, role: string): Promise<InvoiceRecord> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        lineItems: true,
        booking: {
          select: {
            id: true,
            referenceCode: true,
            status: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new InvoiceNotFoundError(`Invoice '${invoiceId}' not found.`);
    }

    if (role === 'CUSTOMER') {
      if (invoice.customerId !== userId) {
        throw new InvoiceAuthorizationError('Forbidden: You can only view invoices issued to your account.');
      }
    } else if (role === 'PROVIDER') {
      const providerProfile = await prisma.serviceProviderProfile.findUnique({
        where: { userId },
      });
      if (!providerProfile || invoice.providerProfileId !== providerProfile.id) {
        throw new InvoiceAuthorizationError('Forbidden: You can only view invoices for services you provided.');
      }
    } else if (role !== 'ADMIN') {
      throw new InvoiceAuthorizationError('Forbidden: Unauthorized role for invoice access.');
    }

    return this.formatInvoiceRecord(invoice);
  }

  private static formatInvoiceRecord(inv: {
    id: string;
    invoiceNumber: string;
    bookingId: string;
    paymentId: string | null;
    customerId: string;
    providerProfileId: string;
    serviceTitleSnapshot: string;
    serviceDate: Date;
    customerSnapshot: unknown;
    providerSnapshot: unknown;
    subtotal: number;
    tax: number;
    platformFee: number;
    discount: number;
    total: number;
    currency: string;
    paymentStatus: string;
    paymentMethodMasked: string | null;
    issuedAt: Date;
    createdAt: Date;
    lineItems?: Array<{
      id: string;
      invoiceId: string;
      description: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }>;
    booking?: {
      id: string;
      referenceCode: string;
      status: string;
    } | null;
  }): InvoiceRecord {
    return {
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      bookingId: inv.bookingId,
      paymentId: inv.paymentId,
      customerId: inv.customerId,
      providerProfileId: inv.providerProfileId,
      serviceTitleSnapshot: inv.serviceTitleSnapshot,
      serviceDate: inv.serviceDate.toISOString().split('T')[0] as string,
      customerSnapshot: inv.customerSnapshot as InvoiceRecord['customerSnapshot'],
      providerSnapshot: inv.providerSnapshot as InvoiceRecord['providerSnapshot'],
      subtotal: inv.subtotal,
      tax: inv.tax,
      platformFee: inv.platformFee,
      discount: inv.discount,
      total: inv.total,
      currency: inv.currency,
      paymentStatus: inv.paymentStatus as InvoiceRecord['paymentStatus'],
      paymentMethodMasked: inv.paymentMethodMasked,
      issuedAt: inv.issuedAt.toISOString(),
      createdAt: inv.createdAt.toISOString(),
      lineItems: inv.lineItems?.map((li) => ({
        id: li.id,
        invoiceId: li.invoiceId,
        description: li.description,
        quantity: li.quantity,
        unitPrice: li.unitPrice,
        total: li.total,
      })),
      booking: inv.booking
        ? ({
            id: inv.booking.id,
            referenceCode: inv.booking.referenceCode,
            status: inv.booking.status,
          } as unknown as import('@sevasetu/shared').BookingRecord)
        : undefined,
    };
  }
}
