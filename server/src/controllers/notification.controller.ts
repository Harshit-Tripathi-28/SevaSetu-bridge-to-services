import type { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service.js';

export class NotificationController {
  /**
   * GET /api/notifications
   * User retrieves their own notifications.
   */
  static async getUserNotifications(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
      }

      const page = req.query.page ? Number(req.query.page) : undefined;
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const unreadOnly = req.query.unreadOnly === 'true';

      const result = await NotificationService.getUserNotifications(userId, {
        page,
        limit,
        unreadOnly,
      });

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      return res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_SERVER_ERROR', message },
      });
    }
  }

  /**
   * PATCH /api/notifications/:id/read
   * User marks a notification as read.
   */
  static async markAsRead(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
      }

      const notificationId = String(req.params.id);
      const updated = await NotificationService.markAsRead(userId, notificationId);

      return res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      if (message.includes('Unauthorized')) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message },
        });
      }
      if (message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message },
        });
      }
      return res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_SERVER_ERROR', message },
      });
    }
  }

  /**
   * POST /api/notifications/read-all
   * User marks all unread notifications as read.
   */
  static async markAllAsRead(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
      }

      const result = await NotificationService.markAllAsRead(userId);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      return res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_SERVER_ERROR', message },
      });
    }
  }

  /**
   * GET /api/notifications/preferences
   * User retrieves notification preferences.
   */
  static async getPreferences(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
      }

      const preferences = await NotificationService.getPreferences(userId);

      return res.status(200).json({
        success: true,
        data: preferences,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      return res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_SERVER_ERROR', message },
      });
    }
  }

  /**
   * PATCH /api/notifications/preferences
   * User updates notification preferences.
   */
  static async updatePreferences(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
      }

      const preferences = await NotificationService.updatePreferences(userId, req.body || {});

      return res.status(200).json({
        success: true,
        data: preferences,
        message: 'Notification preferences updated successfully.',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      return res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_SERVER_ERROR', message },
      });
    }
  }
}
