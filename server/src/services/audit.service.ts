import { getPrismaClient } from '../config/database.js';
import { Prisma } from '@prisma/client';
import type { AuditLogRecord } from '@sevasetu/shared';

export interface CreateAuditLogParams {
  actorUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  reason?: string | null;
  metadata?: Record<string, any> | null;
  ipAddress?: string | null;
}

export interface AuditLogQueryParams {
  page?: number;
  limit?: number;
  actorUserId?: string;
  entityType?: string;
  entityId?: string;
  action?: string;
  fromDate?: string;
  toDate?: string;
}

export class AuditService {
  /**
   * Append-only audit log creation.
   * Can run within an existing Prisma transaction or standalone.
   */
  static async log(
    params: CreateAuditLogParams,
    tx?: Prisma.TransactionClient
  ): Promise<AuditLogRecord> {
    const prisma = tx || getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const created = await prisma.auditLog.create({
      data: {
        actorUserId: params.actorUserId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        reason: params.reason || null,
        metadata: params.metadata ? (params.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
        ipAddress: params.ipAddress || null,
      },
      include: {
        actorUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return {
      id: created.id,
      actorUserId: created.actorUserId,
      actorName: created.actorUser?.fullName || 'System Admin',
      actorRole: created.actorUser?.role,
      action: created.action,
      entityType: created.entityType,
      entityId: created.entityId,
      reason: created.reason || undefined,
      metadata: (created.metadata as Record<string, unknown>) || undefined,
      ipAddress: created.ipAddress || undefined,
      createdAt: created.createdAt.toISOString(),
    };
  }

  /**
   * Read-only filtered & paginated access to audit logs.
   * Accessible only to authorized administrators.
   */
  static async queryLogs(params: AuditLogQueryParams): Promise<{
    logs: AuditLogRecord[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {};

    if (params.actorUserId) {
      where.actorUserId = params.actorUserId;
    }
    if (params.entityType) {
      where.entityType = { equals: params.entityType, mode: 'insensitive' };
    }
    if (params.entityId) {
      where.entityId = params.entityId;
    }
    if (params.action) {
      where.action = { contains: params.action, mode: 'insensitive' };
    }
    if (params.fromDate || params.toDate) {
      where.createdAt = {};
      if (params.fromDate) {
        where.createdAt.gte = new Date(params.fromDate);
      }
      if (params.toDate) {
        where.createdAt.lte = new Date(params.toDate);
      }
    }

    const [total, records] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          actorUser: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true,
            },
          },
        },
      }),
    ]);

    const logs: AuditLogRecord[] = records.map((r) => ({
      id: r.id,
      actorUserId: r.actorUserId,
      actorName: r.actorUser?.fullName || 'Admin',
      actorRole: r.actorUser?.role,
      action: r.action,
      entityType: r.entityType,
      entityId: r.entityId,
      reason: r.reason || undefined,
      metadata: (r.metadata as Record<string, unknown>) || undefined,
      ipAddress: r.ipAddress || undefined,
      createdAt: r.createdAt.toISOString(),
    }));

    return {
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}
