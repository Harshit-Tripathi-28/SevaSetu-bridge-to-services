import type { Prisma } from '@prisma/client';
import crypto from 'node:crypto';
import { getPrismaClient } from '../config/database.js';
import type {
  ProviderEarningRecord,
  ProviderPayoutRecord,
  ProviderFinancialSummary,
} from '@sevasetu/shared';
import { FinancialPolicyService } from './financial-policy.service.js';

export class EarningError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EarningError';
  }
}

export class EarningService {
  /**
   * Recognizes provider earning for a completed, paid booking within a PostgreSQL transaction.
   * Enforces double-credit protection through unique constraint and transaction check.
   */
  static async recognizeEarningForBooking(
    tx: Prisma.TransactionClient,
    booking: {
      id: string;
      providerProfileId: string;
      status: string;
    },
    payment: {
      id: string;
      baseAmount: number; // in paise
      amount: number; // in paise
      currency: string;
    }
  ): Promise<string | null> {
    // 1. Double-credit protection: Check if earning already exists for this booking & provider
    const existing = await tx.providerEarning.findUnique({
      where: {
        bookingId_providerProfileId: {
          bookingId: booking.id,
          providerProfileId: booking.providerProfileId,
        },
      },
    });

    if (existing) {
      // Earning already recognized, do not double-credit
      return existing.id;
    }

    // 2. Exact integer financial calculation using configured platform commission (throws if unconfigured)
    const commissionPercent = FinancialPolicyService.getPlatformCommissionPercent();
    const grossAmount = payment.baseAmount;
    const platformFee = Math.floor((grossAmount * commissionPercent) / 100);
    const taxDeduction = 0; // TDS / GST withholding if statutory rules apply; explicitly 0 unless configured
    const netEarning = grossAmount - platformFee - taxDeduction;

    // 3. Persist earning record
    const earning = await tx.providerEarning.create({
      data: {
        providerProfileId: booking.providerProfileId,
        bookingId: booking.id,
        paymentId: payment.id,
        grossAmount,
        platformFee,
        taxDeduction,
        netEarning,
        currency: payment.currency || 'INR',
        status: 'AVAILABLE',
        availableAt: new Date(),
      },
    });

    return earning.id;
  }

  /**
   * Calculates real-time financial ledger summary for a provider.
   * Everything calculated strictly from PostgreSQL financial records.
   */
  static async getProviderEarningsSummary(providerProfileId: string): Promise<ProviderFinancialSummary> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const earnings = await prisma.providerEarning.findMany({
      where: {
        providerProfileId,
        status: { in: ['AVAILABLE', 'PENDING', 'DISBURSED'] },
      },
    });

    const payouts = await prisma.providerPayout.findMany({
      where: {
        providerProfileId,
        status: { in: ['PAID', 'PROCESSING', 'PENDING'] },
      },
    });

    let totalGrossEarnings = 0;
    let totalPlatformFees = 0;
    let netEarnings = 0;
    let availableBalance = 0;
    let pendingBalance = 0;
    let completedJobsCount = 0;

    for (const e of earnings) {
      totalGrossEarnings += e.grossAmount;
      totalPlatformFees += e.platformFee;
      netEarnings += e.netEarning;
      completedJobsCount += 1;

      if (e.status === 'AVAILABLE') {
        availableBalance += e.netEarning;
      } else if (e.status === 'PENDING') {
        pendingBalance += e.netEarning;
      }
    }

    // Deduct payouts already requested or disbursed from available balance
    let disbursedTotal = 0;
    for (const p of payouts) {
      if (p.status === 'PAID') {
        disbursedTotal += p.amount;
        availableBalance -= p.amount;
      } else if (p.status === 'PROCESSING' || p.status === 'PENDING') {
        availableBalance -= p.amount;
      }
    }

    if (availableBalance < 0) availableBalance = 0;

    return {
      totalGrossEarnings,
      totalPlatformFees,
      netEarnings,
      availableBalance,
      pendingBalance,
      disbursedTotal,
      completedJobsCount,
    };
  }

  /**
   * Retrieves all earnings for a provider.
   */
  static async getProviderEarnings(providerProfileId: string): Promise<ProviderEarningRecord[]> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const earnings = await prisma.providerEarning.findMany({
      where: { providerProfileId },
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
      },
      orderBy: { createdAt: 'desc' },
    });

    return earnings.map((e) => ({
      id: e.id,
      providerProfileId: e.providerProfileId,
      bookingId: e.bookingId,
      paymentId: e.paymentId,
      grossAmount: e.grossAmount,
      platformFee: e.platformFee,
      taxDeduction: e.taxDeduction,
      netEarning: e.netEarning,
      currency: e.currency,
      status: e.status,
      availableAt: e.availableAt ? e.availableAt.toISOString() : null,
      createdAt: e.createdAt.toISOString(),
      booking: e.booking
        ? ({
            id: e.booking.id,
            referenceCode: e.booking.referenceCode,
            serviceTitleSnapshot: e.booking.serviceTitleSnapshot,
            scheduledDate: e.booking.scheduledDate.toISOString().split('T')[0],
            status: e.booking.status,
          } as unknown as import('@sevasetu/shared').BookingRecord)
        : undefined,
    }));
  }

  /**
   * Retrieves all payout records for a provider.
   */
  static async getProviderPayouts(providerProfileId: string): Promise<ProviderPayoutRecord[]> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const payouts = await prisma.providerPayout.findMany({
      where: { providerProfileId },
      orderBy: { requestedAt: 'desc' },
    });

    return payouts.map((p) => ({
      id: p.id,
      payoutReference: p.payoutReference,
      providerProfileId: p.providerProfileId,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      bankDetailsSnapshot: (p.bankDetailsSnapshot as Record<string, unknown> | null) ?? null,
      failureReason: p.failureReason,
      requestedAt: p.requestedAt.toISOString(),
      processedAt: p.processedAt ? p.processedAt.toISOString() : null,
      createdAt: p.createdAt.toISOString(),
    }));
  }

  /**
   * Requests a payout from available balance.
   */
  static async requestProviderPayout(
    providerProfileId: string,
    amountPaise: number,
    bankDetails?: Record<string, unknown>
  ): Promise<ProviderPayoutRecord> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    if (amountPaise <= 0) {
      throw new EarningError('Payout amount must be greater than zero.');
    }

    return await prisma.$transaction(async (tx) => {
      // Row lock on profile
      await tx.$executeRaw`SELECT id FROM "ServiceProviderProfile" WHERE id = ${providerProfileId} FOR UPDATE`;

      const summary = await this.getProviderEarningsSummary(providerProfileId);
      if (amountPaise > summary.availableBalance) {
        throw new EarningError(
          `Insufficient available balance. Requested: ${amountPaise / 100} INR, Available: ${
            summary.availableBalance / 100
          } INR`
        );
      }

      const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomHex = crypto.randomBytes(2).toString('hex').toUpperCase();
      const payoutReference = `PO-${dateCode}-${randomHex}`;

      const payout = await tx.providerPayout.create({
        data: {
          payoutReference,
          providerProfileId,
          amount: amountPaise,
          currency: 'INR',
          status: 'PENDING',
          bankDetailsSnapshot: (bankDetails as Prisma.InputJsonValue) || undefined,
        },
      });

      return {
        id: payout.id,
        payoutReference: payout.payoutReference,
        providerProfileId: payout.providerProfileId,
        amount: payout.amount,
        currency: payout.currency,
        status: payout.status,
        bankDetailsSnapshot: (payout.bankDetailsSnapshot as Record<string, unknown> | null) ?? null,
        failureReason: payout.failureReason,
        requestedAt: payout.requestedAt.toISOString(),
        processedAt: null,
        createdAt: payout.createdAt.toISOString(),
      };
    });
  }
}
