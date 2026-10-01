import type { Request, Response } from 'express';
import { ReportService } from '../services/report.service.js';

export class ReportController {
  /**
   * POST /api/reports
   * Creates a report against a user, booking, message, or review.
   */
  static async createReport(req: Request, res: Response) {
    try {
      const reporterUserId = req.user?.id;
      if (!reporterUserId) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
      }

      const report = await ReportService.createReport(reporterUserId, req.body || {});

      return res.status(201).json({
        success: true,
        data: report,
        message: 'Report submitted successfully.',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message },
      });
    }
  }

  /**
   * POST /api/blocks
   * Authenticated user blocks another user.
   */
  static async createBlock(req: Request, res: Response) {
    try {
      const blockerUserId = req.user?.id;
      if (!blockerUserId) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
      }

      const block = await ReportService.createBlock(blockerUserId, req.body || {});

      return res.status(201).json({
        success: true,
        data: block,
        message: 'User blocked successfully.',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message },
      });
    }
  }

  /**
   * GET /api/blocks
   * Lists blocked users.
   */
  static async getBlockedUsers(req: Request, res: Response) {
    try {
      const blockerUserId = req.user?.id;
      if (!blockerUserId) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
      }

      const list = await ReportService.getBlockedUsers(blockerUserId);

      return res.status(200).json({
        success: true,
        data: list,
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
   * DELETE /api/blocks/:blockedUserId
   * Unblocks a user.
   */
  static async deleteBlock(req: Request, res: Response) {
    try {
      const blockerUserId = req.user?.id;
      if (!blockerUserId) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
      }

      const blockedUserId = String(req.params.blockedUserId);
      const success = await ReportService.deleteBlock(blockerUserId, blockedUserId);

      return res.status(200).json({
        success,
        message: success ? 'User unblocked successfully.' : 'Block record not found.',
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
