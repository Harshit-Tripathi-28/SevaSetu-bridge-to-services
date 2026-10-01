import { getPrismaClient } from '../config/database.js';
import { getSocketServer } from '../socket.js';
import type {
  NotificationRecord,
  NotificationType,
  NotificationPreferenceRecord,
  UpdateNotificationPreferenceInput,
} from '@sevasetu/shared';

export class NotificationService {
  /**
   * Creates an in-app notification for a user, respecting their notification preferences.
   * If enabled, persists in PostgreSQL and pushes via real-time WebSocket.
   */
  static async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    relatedEntityType?: 'BOOKING' | 'PAYMENT' | 'INVOICE' | 'MESSAGE' | 'REVIEW' | null,
    relatedEntityId?: string | null
  ): Promise<NotificationRecord | null> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    // 1. Check user preferences
    const preferences = await this.getPreferences(userId);
    const isAllowed = this.checkTypePreference(type, preferences);
    if (!isAllowed) {
      return null;
    }

    // 2. Persist notification in PostgreSQL
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        relatedEntityType: relatedEntityType || null,
        relatedEntityId: relatedEntityId || null,
        isRead: false,
      },
    });

    const formatted: NotificationRecord = {
      id: notification.id,
      userId: notification.userId,
      type: notification.type as NotificationType,
      title: notification.title,
      message: notification.message,
      relatedEntityType: notification.relatedEntityType as NotificationRecord['relatedEntityType'],
      relatedEntityId: notification.relatedEntityId,
      isRead: notification.isRead,
      readAt: notification.readAt?.toISOString() || null,
      createdAt: notification.createdAt.toISOString(),
    };

    // 3. Emit real-time WebSocket event to user's private room
    const io = getSocketServer();
    if (io) {
      io.to(`user:${userId}`).emit('notification:new', formatted);
    }

    return formatted;
  }

  /**
   * Retrieves paginated notifications and real unread count for authenticated user.
   */
  static async getUserNotifications(
    userId: string,
    query?: { page?: number; limit?: number; unreadOnly?: boolean }
  ): Promise<{
    notifications: NotificationRecord[];
    unreadCount: number;
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const page = Math.max(1, query?.page || 1);
    const limit = Math.min(50, Math.max(1, query?.limit || 20));
    const skip = (page - 1) * limit;

    const whereClause: { userId: string; isRead?: boolean } = { userId };
    if (query?.unreadOnly) {
      whereClause.isRead = false;
    }

    const [total, unreadCount, rows] = await Promise.all([
      prisma.notification.count({ where: whereClause }),
      prisma.notification.count({ where: { userId, isRead: false } }),
      prisma.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const notifications: NotificationRecord[] = rows.map((n) => ({
      id: n.id,
      userId: n.userId,
      type: n.type as NotificationType,
      title: n.title,
      message: n.message,
      relatedEntityType: n.relatedEntityType as NotificationRecord['relatedEntityType'],
      relatedEntityId: n.relatedEntityId,
      isRead: n.isRead,
      readAt: n.readAt?.toISOString() || null,
      createdAt: n.createdAt.toISOString(),
    }));

    return {
      notifications,
      unreadCount,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Marks a single notification as read, enforcing user ownership.
   */
  static async markAsRead(userId: string, notificationId: string): Promise<NotificationRecord> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new Error('Unauthorized: Cannot access notification belonging to another user');
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    const formatted: NotificationRecord = {
      id: updated.id,
      userId: updated.userId,
      type: updated.type as NotificationType,
      title: updated.title,
      message: updated.message,
      relatedEntityType: updated.relatedEntityType as NotificationRecord['relatedEntityType'],
      relatedEntityId: updated.relatedEntityId,
      isRead: updated.isRead,
      readAt: updated.readAt?.toISOString() || null,
      createdAt: updated.createdAt.toISOString(),
    };

    const io = getSocketServer();
    if (io) {
      io.to(`user:${userId}`).emit('notification:read', { id: notificationId });
    }

    return formatted;
  }

  /**
   * Marks all notifications as read for the authenticated user.
   */
  static async markAllAsRead(userId: string): Promise<{ updatedCount: number }> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const result = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    const io = getSocketServer();
    if (io) {
      io.to(`user:${userId}`).emit('notification:read_all', {});
    }

    return { updatedCount: result.count };
  }

  /**
   * Gets or initializes user notification preferences.
   */
  static async getPreferences(userId: string): Promise<NotificationPreferenceRecord> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    let pref = await prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (!pref) {
      pref = await prisma.notificationPreference.create({
        data: {
          userId,
          bookingUpdates: true,
          chatMessages: true,
          paymentUpdates: true,
          serviceReminders: true,
          reviewReminders: true,
        },
      });
    }

    return {
      id: pref.id,
      userId: pref.userId,
      bookingUpdates: pref.bookingUpdates,
      chatMessages: pref.chatMessages,
      paymentUpdates: pref.paymentUpdates,
      serviceReminders: pref.serviceReminders,
      reviewReminders: pref.reviewReminders,
      updatedAt: pref.updatedAt.toISOString(),
    };
  }

  /**
   * Updates notification preferences for authenticated user.
   */
  static async updatePreferences(
    userId: string,
    input: UpdateNotificationPreferenceInput
  ): Promise<NotificationPreferenceRecord> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const updated = await prisma.notificationPreference.upsert({
      where: { userId },
      create: {
        userId,
        bookingUpdates: input.bookingUpdates ?? true,
        chatMessages: input.chatMessages ?? true,
        paymentUpdates: input.paymentUpdates ?? true,
        serviceReminders: input.serviceReminders ?? true,
        reviewReminders: input.reviewReminders ?? true,
      },
      update: {
        ...(typeof input.bookingUpdates === 'boolean' ? { bookingUpdates: input.bookingUpdates } : {}),
        ...(typeof input.chatMessages === 'boolean' ? { chatMessages: input.chatMessages } : {}),
        ...(typeof input.paymentUpdates === 'boolean' ? { paymentUpdates: input.paymentUpdates } : {}),
        ...(typeof input.serviceReminders === 'boolean' ? { serviceReminders: input.serviceReminders } : {}),
        ...(typeof input.reviewReminders === 'boolean' ? { reviewReminders: input.reviewReminders } : {}),
      },
    });

    return {
      id: updated.id,
      userId: updated.userId,
      bookingUpdates: updated.bookingUpdates,
      chatMessages: updated.chatMessages,
      paymentUpdates: updated.paymentUpdates,
      serviceReminders: updated.serviceReminders,
      reviewReminders: updated.reviewReminders,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  private static checkTypePreference(
    type: NotificationType,
    pref: NotificationPreferenceRecord
  ): boolean {
    switch (type) {
      case 'BOOKING_REQUEST_RECEIVED':
      case 'BOOKING_ACCEPTED':
      case 'BOOKING_DECLINED':
      case 'BOOKING_CONFIRMED':
      case 'BOOKING_RESCHEDULED':
      case 'BOOKING_CANCELLED':
        return pref.bookingUpdates;
      case 'NEW_MESSAGE':
        return pref.chatMessages;
      case 'PAYMENT_UPDATED':
      case 'INVOICE_AVAILABLE':
        return pref.paymentUpdates;
      case 'SERVICE_STATUS_UPDATED':
        return pref.serviceReminders;
      case 'REVIEW_REMINDER':
        return pref.reviewReminders;
      case 'ACCOUNT_SECURITY':
        return true; // Security notifications cannot be opted out of
      default:
        return true;
    }
  }
}
