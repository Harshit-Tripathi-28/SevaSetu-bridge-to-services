import type { Request, Response } from 'express';
import {
  ConversationService,
  ConversationAuthorizationError,
  ConversationNotFoundError,
  ConversationValidationError,
} from '../services/conversation.service.js';
import { EventService } from '../services/event.service.js';

export class ConversationController {
  private static handleError(res: Response, error: unknown) {
    if (error instanceof ConversationValidationError) {
      return res.status(400).json({
        success: false,
        error: { code: error.code, message: error.message },
      });
    }
    if (error instanceof ConversationAuthorizationError) {
      return res.status(403).json({
        success: false,
        error: { code: error.code, message: error.message },
      });
    }
    if (error instanceof ConversationNotFoundError) {
      return res.status(404).json({
        success: false,
        error: { code: error.code, message: error.message },
      });
    }

    const message = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message },
    });
  }

  /**
   * GET /api/bookings/:bookingId/conversation
   * Participant gets or creates the conversation for a booking.
   */
  static async getBookingConversation(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
      }

      const bookingId = String(req.params.bookingId);
      const conversation = await ConversationService.getOrCreateBookingConversation(
        bookingId,
        userId,
        req.user?.role
      );

      return res.status(200).json({
        success: true,
        data: conversation,
      });
    } catch (error) {
      return ConversationController.handleError(res, error);
    }
  }

  /**
   * GET /api/conversations
   * User lists all their conversations.
   */
  static async getUserConversations(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
      }

      const list = await ConversationService.getUserConversations(userId, req.user?.role);

      return res.status(200).json({
        success: true,
        data: list,
      });
    } catch (error) {
      return ConversationController.handleError(res, error);
    }
  }

  /**
   * GET /api/conversations/:id/messages
   * Participant retrieves messages in a conversation (marks incoming unread messages as read).
   */
  static async getConversationMessages(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
      }

      const conversationId = String(req.params.id);
      const page = req.query.page ? Number(req.query.page) : undefined;
      const limit = req.query.limit ? Number(req.query.limit) : undefined;

      const result = await ConversationService.getConversationMessages(
        conversationId,
        userId,
        req.user?.role,
        { page, limit }
      );

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return ConversationController.handleError(res, error);
    }
  }

  /**
   * POST /api/conversations/:id/messages
   * Participant sends a message in a conversation.
   */
  static async sendMessage(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
      }

      const conversationId = String(req.params.id);
      const { content } = req.body || {};

      const message = await ConversationService.sendMessage(
        conversationId,
        userId,
        content,
        'TEXT',
        req.user?.role
      );

      // Trigger domain event for in-app notification to the recipient
      await EventService.onMessageSent(message, conversationId);

      return res.status(201).json({
        success: true,
        data: message,
      });
    } catch (error) {
      return ConversationController.handleError(res, error);
    }
  }
}
