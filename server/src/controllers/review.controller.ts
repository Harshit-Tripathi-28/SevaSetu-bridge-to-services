import type { Request, Response } from 'express';
import {
  ReviewService,
  ReviewValidationError,
  ReviewAuthorizationError,
  ReviewNotFoundError,
  ReviewDuplicateError,
} from '../services/review.service.js';

export class ReviewController {
  private static handleError(res: Response, error: unknown) {
    if (error instanceof ReviewValidationError) {
      return res.status(400).json({
        success: false,
        error: { code: error.code, message: error.message },
      });
    }
    if (error instanceof ReviewAuthorizationError) {
      return res.status(403).json({
        success: false,
        error: { code: error.code, message: error.message },
      });
    }
    if (error instanceof ReviewNotFoundError) {
      return res.status(404).json({
        success: false,
        error: { code: error.code, message: error.message },
      });
    }
    if (error instanceof ReviewDuplicateError) {
      return res.status(409).json({
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
   * POST /api/customer/bookings/:bookingId/review
   * Customer submits a verified review for a completed booking.
   */
  static async submitReview(req: Request, res: Response) {
    try {
      const customerId = req.user?.id;
      if (!customerId) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
      }

      const bookingId = String(req.params.bookingId);
      const review = await ReviewService.submitReview(customerId, bookingId, req.body);

      return res.status(201).json({
        success: true,
        data: review,
        message: 'Review submitted successfully.',
      });
    } catch (error) {
      return ReviewController.handleError(res, error);
    }
  }

  /**
   * GET /api/customer/bookings/:bookingId/review
   * Customer or provider gets review for a booking.
   */
  static async getBookingReview(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
      }

      const bookingId = String(req.params.bookingId);
      const review = await ReviewService.getBookingReview(bookingId, userId, req.user?.role);

      return res.status(200).json({
        success: true,
        data: review,
      });
    } catch (error) {
      return ReviewController.handleError(res, error);
    }
  }

  /**
   * GET /api/providers/:id/reviews
   * Public list of verified reviews for a provider profile with customer privacy sanitization.
   */
  static async getPublicProviderReviews(req: Request, res: Response) {
    try {
      const providerProfileId = String(req.params.id);
      const page = req.query.page ? Number(req.query.page) : undefined;
      const limit = req.query.limit ? Number(req.query.limit) : undefined;

      const result = await ReviewService.getPublicProviderReviews(providerProfileId, { page, limit });

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return ReviewController.handleError(res, error);
    }
  }

  /**
   * GET /api/providers/:id/reputation
   * Public provider reputation summary derived strictly from PostgreSQL.
   */
  static async getProviderReputation(req: Request, res: Response) {
    try {
      const providerProfileId = String(req.params.id);
      const summary = await ReviewService.getProviderReputationSummary(providerProfileId);

      return res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      return ReviewController.handleError(res, error);
    }
  }

  /**
   * GET /api/provider/reviews
   * Provider views reviews for their own profile.
   */
  static async getProviderOwnReviews(req: Request, res: Response) {
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

      const result = await ReviewService.getProviderReviews(userId, { page, limit });

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return ReviewController.handleError(res, error);
    }
  }
}
