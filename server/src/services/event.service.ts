import { NotificationService } from './notification.service.js';
import { ConversationService } from './conversation.service.js';
import { getPrismaClient } from '../config/database.js';
import type { MessageRecord } from '@sevasetu/shared';

export class EventService {
  /**
   * Dispatched when customer creates a new service booking request.
   */
  static async onBookingCreated(booking: {
    id: string;
    referenceCode: string;
    serviceTitleSnapshot: string;
    providerProfileId: string;
  }): Promise<void> {
    try {
      const prisma = getPrismaClient();
      if (!prisma) return;

      const provider = await prisma.serviceProviderProfile.findUnique({
        where: { id: booking.providerProfileId },
        select: { userId: true },
      });

      if (provider) {
        await NotificationService.createNotification(
          provider.userId,
          'BOOKING_REQUEST_RECEIVED',
          'New Service Request Received',
          `You have a new request for "${booking.serviceTitleSnapshot}" (${booking.referenceCode}).`,
          'BOOKING',
          booking.id
        );
      }
    } catch (err) {
      console.error('[EventService] Failed onBookingCreated:', err);
    }
  }

  /**
   * Dispatched when provider accepts a booking request.
   */
  static async onBookingAccepted(booking: {
    id: string;
    referenceCode: string;
    customerId: string;
    scheduledDate: Date | string;
    scheduledStartTime: string;
    providerProfileId: string;
  }): Promise<void> {
    try {
      await NotificationService.createNotification(
        booking.customerId,
        'BOOKING_ACCEPTED',
        'Booking Accepted & Scheduled',
        `Your booking (${booking.referenceCode}) has been accepted by the provider.`,
        'BOOKING',
        booking.id
      );

      // Add system message to conversation
      const conv = await ConversationService.getOrCreateBookingConversation(booking.id, booking.customerId);
      const dateStr = typeof booking.scheduledDate === 'string' ? booking.scheduledDate.split('T')[0] : booking.scheduledDate.toISOString().split('T')[0];
      await ConversationService.sendMessage(
        conv.id,
        booking.customerId,
        `Booking accepted and scheduled for ${dateStr} at ${booking.scheduledStartTime}.`,
        'SYSTEM'
      );
    } catch (err) {
      console.error('[EventService] Failed onBookingAccepted:', err);
    }
  }

  /**
   * Dispatched when provider declines a booking request.
   */
  static async onBookingDeclined(
    booking: { id: string; referenceCode: string; customerId: string },
    reason?: string
  ): Promise<void> {
    try {
      await NotificationService.createNotification(
        booking.customerId,
        'BOOKING_DECLINED',
        'Booking Request Declined',
        `Your booking (${booking.referenceCode}) was declined${reason ? ': ' + reason : '.'}`,
        'BOOKING',
        booking.id
      );
    } catch (err) {
      console.error('[EventService] Failed onBookingDeclined:', err);
    }
  }

  /**
   * Dispatched when a booking is rescheduled.
   */
  static async onBookingRescheduled(
    booking: { id: string; referenceCode: string; customerId: string; providerProfileId: string },
    actorUserId: string,
    newDate: string,
    newTime: string
  ): Promise<void> {
    try {
      const prisma = getPrismaClient();
      if (!prisma) return;

      const provider = await prisma.serviceProviderProfile.findUnique({
        where: { id: booking.providerProfileId },
        select: { userId: true },
      });

      const recipientUserId = actorUserId === booking.customerId ? provider?.userId : booking.customerId;

      if (recipientUserId) {
        await NotificationService.createNotification(
          recipientUserId,
          'BOOKING_RESCHEDULED',
          'Booking Rescheduled',
          `Booking ${booking.referenceCode} has been rescheduled to ${newDate} at ${newTime}.`,
          'BOOKING',
          booking.id
        );
      }

      // Append system message to conversation if exists
      const conv = await prisma.conversation.findUnique({ where: { bookingId: booking.id } });
      if (conv) {
        await ConversationService.sendMessage(
          conv.id,
          actorUserId,
          `Booking rescheduled to ${newDate} at ${newTime}.`,
          'SYSTEM'
        );
      }
    } catch (err) {
      console.error('[EventService] Failed onBookingRescheduled:', err);
    }
  }

  /**
   * Dispatched when a booking is cancelled.
   */
  static async onBookingCancelled(
    booking: { id: string; referenceCode: string; customerId: string; providerProfileId: string },
    actorUserId: string,
    reason?: string
  ): Promise<void> {
    try {
      const prisma = getPrismaClient();
      if (!prisma) return;

      const provider = await prisma.serviceProviderProfile.findUnique({
        where: { id: booking.providerProfileId },
        select: { userId: true },
      });

      const recipientUserId = actorUserId === booking.customerId ? provider?.userId : booking.customerId;

      if (recipientUserId) {
        await NotificationService.createNotification(
          recipientUserId,
          'BOOKING_CANCELLED',
          'Booking Cancelled',
          `Booking ${booking.referenceCode} was cancelled${reason ? ': ' + reason : '.'}`,
          'BOOKING',
          booking.id
        );
      }

      // Append system message to conversation if exists
      const conv = await prisma.conversation.findUnique({ where: { bookingId: booking.id } });
      if (conv) {
        await ConversationService.sendMessage(
          conv.id,
          actorUserId,
          `Booking cancelled${reason ? ': ' + reason : '.'}`,
          'SYSTEM'
        );
      }
    } catch (err) {
      console.error('[EventService] Failed onBookingCancelled:', err);
    }
  }

  /**
   * Dispatched when execution status changes (ON_THE_WAY, ARRIVED, IN_PROGRESS, COMPLETED).
   */
  static async onExecutionStatusUpdated(
    booking: { id: string; referenceCode: string; customerId: string; serviceTitleSnapshot: string },
    newStatus: string
  ): Promise<void> {
    try {
      const statusLabels: Record<string, string> = {
        ON_THE_WAY: 'Provider is on the way',
        ARRIVED: 'Provider has arrived',
        IN_PROGRESS: 'Service execution is in progress',
        COMPLETED: 'Service has been marked completed',
      };

      const title = statusLabels[newStatus] || `Service status: ${newStatus}`;
      const message = `Booking ${booking.referenceCode}: ${title}.`;

      await NotificationService.createNotification(
        booking.customerId,
        'SERVICE_STATUS_UPDATED',
        title,
        message,
        'BOOKING',
        booking.id
      );

      // System message
      const prisma = getPrismaClient();
      if (prisma) {
        const conv = await prisma.conversation.findUnique({ where: { bookingId: booking.id } });
        if (conv) {
          await ConversationService.sendMessage(
            conv.id,
            booking.customerId,
            `Status updated: ${title}`,
            'SYSTEM'
          );
        }
      }

      // If completed, trigger review reminder for customer
      if (newStatus === 'COMPLETED') {
        await NotificationService.createNotification(
          booking.customerId,
          'REVIEW_REMINDER',
          'Rate your completed service',
          `Your service "${booking.serviceTitleSnapshot}" is completed. Share your feedback to help the community!`,
          'BOOKING',
          booking.id
        );
      }
    } catch (err) {
      console.error('[EventService] Failed onExecutionStatusUpdated:', err);
    }
  }

  /**
   * Dispatched upon successful payment.
   */
  static async onPaymentPaid(
    payment: { id: string; referenceCode: string; amount: number; bookingId: string; customerId: string; providerProfileId: string },
    booking: { id: string; referenceCode: string; serviceTitleSnapshot: string }
  ): Promise<void> {
    try {
      const prisma = getPrismaClient();
      if (!prisma) return;

      const provider = await prisma.serviceProviderProfile.findUnique({
        where: { id: payment.providerProfileId },
        select: { userId: true },
      });

      const amountFormatted = `₹${(payment.amount / 100).toFixed(2)}`;

      // Notify customer
      await NotificationService.createNotification(
        payment.customerId,
        'PAYMENT_UPDATED',
        'Payment Confirmed',
        `Your payment of ${amountFormatted} for booking ${booking.referenceCode} was successful.`,
        'PAYMENT',
        payment.id
      );

      // Notify provider
      if (provider) {
        await NotificationService.createNotification(
          provider.userId,
          'PAYMENT_UPDATED',
          'Payment Received',
          `Customer paid ${amountFormatted} for booking ${booking.referenceCode}.`,
          'PAYMENT',
          payment.id
        );
      }

      // Notify invoice available
      await NotificationService.createNotification(
        payment.customerId,
        'INVOICE_AVAILABLE',
        'Invoice Available',
        `Invoice for booking ${booking.referenceCode} is now available to download.`,
        'BOOKING',
        booking.id
      );

      // System message in conversation
      const conv = await prisma.conversation.findUnique({ where: { bookingId: booking.id } });
      if (conv) {
        await ConversationService.sendMessage(
          conv.id,
          payment.customerId,
          `Payment of ${amountFormatted} confirmed successfully.`,
          'SYSTEM'
        );
      }
    } catch (err) {
      console.error('[EventService] Failed onPaymentPaid:', err);
    }
  }

  /**
   * Dispatched when customer submits a verified review.
   */
  static async onReviewSubmitted(
    review: { id: string; overallRating: number; bookingId: string },
    booking: { id: string; referenceCode: string; serviceTitleSnapshot: string; providerProfileId: string }
  ): Promise<void> {
    try {
      const prisma = getPrismaClient();
      if (!prisma) return;

      const provider = await prisma.serviceProviderProfile.findUnique({
        where: { id: booking.providerProfileId },
        select: { userId: true },
      });

      if (provider) {
        await NotificationService.createNotification(
          provider.userId,
          'SERVICE_STATUS_UPDATED',
          'New Customer Review Received',
          `You received a ${review.overallRating}-star review for booking ${booking.referenceCode}!`,
          'REVIEW',
          review.id
        );
      }
    } catch (err) {
      console.error('[EventService] Failed onReviewSubmitted:', err);
    }
  }

  /**
   * Dispatched when a chat message is sent.
   */
  static async onMessageSent(
    message: MessageRecord,
    conversationId: string
  ): Promise<void> {
    try {
      const prisma = getPrismaClient();
      if (!prisma) return;

      const conv = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          providerProfile: { select: { userId: true } },
          customer: { select: { id: true, fullName: true } },
        },
      });

      if (!conv) return;

      // Determine recipient
      const isSenderCustomer = message.senderUserId === conv.customerId;
      const recipientUserId = isSenderCustomer ? conv.providerProfile.userId : conv.customerId;

      const previewText = message.content.length > 50 ? `${message.content.substring(0, 47)}...` : message.content;

      await NotificationService.createNotification(
        recipientUserId,
        'NEW_MESSAGE',
        'New Message in Booking Chat',
        `${message.senderName || 'Participant'}: ${previewText}`,
        'MESSAGE',
        message.id
      );
    } catch (err) {
      console.error('[EventService] Failed onMessageSent:', err);
    }
  }
}
