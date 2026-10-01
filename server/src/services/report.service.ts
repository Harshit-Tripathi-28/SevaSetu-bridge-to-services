import { getPrismaClient } from '../config/database.js';
import type {
  ReportRecord,
  CreateReportInput,
  BlockRecord,
  CreateBlockInput,
  ReportStatus,
} from '@sevasetu/shared';

export class ReportService {
  static async createReport(
    reporterUserId: string,
    input: CreateReportInput
  ): Promise<ReportRecord> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    if (!input.reason || !input.reason.trim()) {
      throw new Error('Report reason is required.');
    }

    const report = await prisma.report.create({
      data: {
        reporterUserId,
        reportedUserId: input.reportedUserId || null,
        bookingId: input.bookingId || null,
        messageId: input.messageId || null,
        reviewId: input.reviewId || null,
        reason: input.reason.trim(),
        details: input.details?.trim() || null,
        status: 'PENDING',
      },
    });

    return {
      id: report.id,
      reporterUserId: report.reporterUserId,
      reportedUserId: report.reportedUserId,
      bookingId: report.bookingId,
      messageId: report.messageId,
      reviewId: report.reviewId,
      reason: report.reason,
      details: report.details,
      status: report.status as ReportStatus,
      createdAt: report.createdAt.toISOString(),
    };
  }

  static async createBlock(
    blockerUserId: string,
    input: CreateBlockInput
  ): Promise<BlockRecord> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    if (blockerUserId === input.blockedUserId) {
      throw new Error('You cannot block yourself.');
    }

    const block = await prisma.block.upsert({
      where: {
        blockerUserId_blockedUserId: {
          blockerUserId,
          blockedUserId: input.blockedUserId,
        },
      },
      create: {
        blockerUserId,
        blockedUserId: input.blockedUserId,
        reason: input.reason?.trim() || null,
      },
      update: {
        reason: input.reason?.trim() || null,
      },
    });

    return {
      id: block.id,
      blockerUserId: block.blockerUserId,
      blockedUserId: block.blockedUserId,
      reason: block.reason,
      createdAt: block.createdAt.toISOString(),
    };
  }

  static async getBlockedUsers(blockerUserId: string): Promise<BlockRecord[]> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const blocks = await prisma.block.findMany({
      where: { blockerUserId },
      orderBy: { createdAt: 'desc' },
    });

    return blocks.map((b) => ({
      id: b.id,
      blockerUserId: b.blockerUserId,
      blockedUserId: b.blockedUserId,
      reason: b.reason,
      createdAt: b.createdAt.toISOString(),
    }));
  }

  static async deleteBlock(blockerUserId: string, blockedUserId: string): Promise<boolean> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    try {
      await prisma.block.delete({
        where: {
          blockerUserId_blockedUserId: {
            blockerUserId,
            blockedUserId,
          },
        },
      });
      return true;
    } catch {
      return false;
    }
  }
}
