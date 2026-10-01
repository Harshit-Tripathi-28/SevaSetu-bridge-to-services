import { getPrismaClient } from '../config/database.js';
import { getSocketServer } from '../socket.js';
import type {
  ConversationRecord,
  MessageRecord,
  MessageType,
  UserRole,
} from '@sevasetu/shared';

export class ConversationAuthorizationError extends Error {
  public code = 'FORBIDDEN';
  constructor(message: string = 'Forbidden: Access to this conversation is unauthorized.') {
    super(message);
    this.name = 'ConversationAuthorizationError';
  }
}

export class ConversationNotFoundError extends Error {
  public code = 'NOT_FOUND';
  constructor(message: string = 'Conversation not found.') {
    super(message);
    this.name = 'ConversationNotFoundError';
  }
}

export class ConversationValidationError extends Error {
  public code = 'VALIDATION_ERROR';
  constructor(message: string) {
    super(message);
    this.name = 'ConversationValidationError';
  }
}

export class ConversationService {
  /**
   * Retrieves or lazily creates a booking-scoped conversation.
   * Only booking participants (customer or assigned provider) and admins may access.
   */
  static async getOrCreateBookingConversation(
    bookingId: string,
    requestingUserId: string,
    userRole?: UserRole
  ): Promise<ConversationRecord> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: { select: { id: true, fullName: true, role: true } },
        providerProfile: {
          select: {
            id: true,
            avatarUrl: true,
            user: { select: { id: true, fullName: true, role: true } },
          },
        },
      },
    });

    if (!booking) {
      throw new ConversationNotFoundError(`Booking ${bookingId} not found.`);
    }

    const isCustomer = booking.customerId === requestingUserId;
    const isProvider = booking.providerProfile.user.id === requestingUserId;
    const isAdmin = userRole === 'ADMIN';

    if (!isCustomer && !isProvider && !isAdmin) {
      throw new ConversationAuthorizationError('You are not authorized to view this booking conversation.');
    }

    let conversation = await prisma.conversation.findUnique({
      where: { bookingId },
      include: {
        customer: { select: { id: true, fullName: true, role: true } },
        providerProfile: {
          select: {
            id: true,
            avatarUrl: true,
            user: { select: { id: true, fullName: true, role: true } },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          bookingId: booking.id,
          customerId: booking.customerId,
          providerProfileId: booking.providerProfileId,
        },
        include: {
          customer: { select: { id: true, fullName: true, role: true } },
          providerProfile: {
            select: {
              id: true,
              avatarUrl: true,
              user: { select: { id: true, fullName: true, role: true } },
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });
    }

    const unreadCount = await prisma.message.count({
      where: {
        conversationId: conversation.id,
        senderUserId: { not: requestingUserId },
        readAt: null,
      },
    });

    const lastMsg = conversation.messages[0];

    return {
      id: conversation.id,
      bookingId: booking.id,
      bookingReferenceCode: booking.referenceCode,
      customerId: booking.customerId,
      providerProfileId: booking.providerProfileId,
      customer: {
        userId: conversation.customer.id,
        fullName: conversation.customer.fullName || 'Customer',
        role: conversation.customer.role as UserRole,
      },
      provider: {
        userId: conversation.providerProfile.user.id,
        fullName: conversation.providerProfile.user.fullName || 'Provider',
        role: conversation.providerProfile.user.role as UserRole,
        avatarUrl: conversation.providerProfile.avatarUrl,
      },
      serviceTitle: booking.serviceTitleSnapshot,
      bookingStatus: booking.status,
      unreadCount,
      lastMessage: lastMsg
        ? {
            id: lastMsg.id,
            conversationId: lastMsg.conversationId,
            senderUserId: lastMsg.senderUserId,
            content: lastMsg.content,
            messageType: lastMsg.messageType as MessageType,
            readAt: lastMsg.readAt?.toISOString() || null,
            createdAt: lastMsg.createdAt.toISOString(),
          }
        : null,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
    };
  }

  /**
   * Retrieves all conversations for the authenticated user.
   */
  static async getUserConversations(
    userId: string,
    role?: UserRole
  ): Promise<ConversationRecord[]> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const conversations = await prisma.conversation.findMany({
      where:
        role === 'ADMIN'
          ? {}
          : {
              OR: [
                { customerId: userId },
                { providerProfile: { userId } },
              ],
            },
      include: {
        booking: {
          select: {
            id: true,
            referenceCode: true,
            serviceTitleSnapshot: true,
            status: true,
          },
        },
        customer: { select: { id: true, fullName: true, role: true } },
        providerProfile: {
          select: {
            id: true,
            avatarUrl: true,
            user: { select: { id: true, fullName: true, role: true } },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const result: ConversationRecord[] = [];
    for (const c of conversations) {
      const unreadCount = await prisma.message.count({
        where: {
          conversationId: c.id,
          senderUserId: { not: userId },
          readAt: null,
        },
      });

      const lastMsg = c.messages[0];

      result.push({
        id: c.id,
        bookingId: c.booking.id,
        bookingReferenceCode: c.booking.referenceCode,
        customerId: c.customerId,
        providerProfileId: c.providerProfileId,
        customer: {
          userId: c.customer.id,
          fullName: c.customer.fullName || 'Customer',
          role: c.customer.role as UserRole,
        },
        provider: {
          userId: c.providerProfile.user.id,
          fullName: c.providerProfile.user.fullName || 'Provider',
          role: c.providerProfile.user.role as UserRole,
          avatarUrl: c.providerProfile.avatarUrl,
        },
        serviceTitle: c.booking.serviceTitleSnapshot,
        bookingStatus: c.booking.status,
        unreadCount,
        lastMessage: lastMsg
          ? {
              id: lastMsg.id,
              conversationId: lastMsg.conversationId,
              senderUserId: lastMsg.senderUserId,
              content: lastMsg.content,
              messageType: lastMsg.messageType as MessageType,
              readAt: lastMsg.readAt?.toISOString() || null,
              createdAt: lastMsg.createdAt.toISOString(),
            }
          : null,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      });
    }

    return result;
  }

  /**
   * Retrieves messages for a conversation, enforcing participant authorization and marking incoming unread messages as read.
   */
  static async getConversationMessages(
    conversationId: string,
    requestingUserId: string,
    userRole?: UserRole,
    query?: { page?: number; limit?: number }
  ): Promise<{
    messages: MessageRecord[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        providerProfile: { select: { userId: true } },
      },
    });

    if (!conversation) {
      throw new ConversationNotFoundError(`Conversation ${conversationId} not found.`);
    }

    const isCustomer = conversation.customerId === requestingUserId;
    const isProvider = conversation.providerProfile.userId === requestingUserId;
    const isAdmin = userRole === 'ADMIN';

    if (!isCustomer && !isProvider && !isAdmin) {
      throw new ConversationAuthorizationError('Unauthorized: You are not a participant in this conversation.');
    }

    // Mark unread messages sent by others as read
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderUserId: { not: requestingUserId },
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    const page = Math.max(1, query?.page || 1);
    const limit = Math.min(100, Math.max(1, query?.limit || 50));
    const skip = (page - 1) * limit;

    const [total, rows] = await Promise.all([
      prisma.message.count({ where: { conversationId } }),
      prisma.message.findMany({
        where: { conversationId },
        include: {
          senderUser: { select: { id: true, fullName: true, role: true } },
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
      }),
    ]);

    const messages: MessageRecord[] = rows.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      senderUserId: m.senderUserId,
      senderName: m.senderUser.fullName || undefined,
      senderRole: m.senderUser.role as UserRole,
      content: m.content,
      messageType: m.messageType as MessageType,
      readAt: m.readAt?.toISOString() || null,
      createdAt: m.createdAt.toISOString(),
    }));

    return {
      messages,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Sends a message inside a booking conversation with participant authorization.
   */
  static async sendMessage(
    conversationId: string,
    senderUserId: string,
    content: string,
    messageType: MessageType = 'TEXT',
    userRole?: UserRole
  ): Promise<MessageRecord> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database client unavailable');

    if (!content || !content.trim()) {
      throw new ConversationValidationError('Message content cannot be empty.');
    }

    if (content.length > 2000) {
      throw new ConversationValidationError('Message content exceeds 2000 characters limit.');
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        providerProfile: { select: { userId: true } },
        customer: { select: { id: true, fullName: true, role: true } },
      },
    });

    if (!conversation) {
      throw new ConversationNotFoundError(`Conversation ${conversationId} not found.`);
    }

    if (messageType !== 'SYSTEM') {
      const isCustomer = conversation.customerId === senderUserId;
      const isProvider = conversation.providerProfile.userId === senderUserId;
      const isAdmin = userRole === 'ADMIN';

      if (!isCustomer && !isProvider && !isAdmin) {
        throw new ConversationAuthorizationError('Unauthorized: You cannot send messages in this conversation.');
      }
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderUserId,
        content: content.trim(),
        messageType,
      },
      include: {
        senderUser: { select: { id: true, fullName: true, role: true } },
      },
    });

    // Touch conversation updatedAt
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    const formatted: MessageRecord = {
      id: message.id,
      conversationId: message.conversationId,
      senderUserId: message.senderUserId,
      senderName: message.senderUser.fullName || undefined,
      senderRole: message.senderUser.role as UserRole,
      content: message.content,
      messageType: message.messageType as MessageType,
      readAt: message.readAt?.toISOString() || null,
      createdAt: message.createdAt.toISOString(),
    };

    // Emit real-time WebSocket event to the conversation room
    const io = getSocketServer();
    if (io) {
      io.to(`conversation:${conversationId}`).emit('conversation:message', formatted);
    }

    return formatted;
  }
}
