import type { Request, Response } from 'express';
import { RebookingService } from '../services/rebooking.service.js';
import {
  BookingValidationError,
  BookingAuthorizationError,
  BookingNotFoundError,
} from '../services/booking.service.js';

export class RebookingController {
  private static handleError(res: Response, error: unknown) {
    if (error instanceof BookingValidationError) {
      return res.status(400).json({
        success: false,
        error: { code: error.code, message: error.message },
      });
    }
    if (error instanceof BookingAuthorizationError) {
      return res.status(403).json({
        success: false,
        error: { code: error.code, message: error.message },
      });
    }
    if (error instanceof BookingNotFoundError) {
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
   * GET /api/customer/bookings/:bookingId/rebook-eligibility
   * Checks rebooking eligibility and returns reusable details.
   */
  static async checkEligibility(req: Request, res: Response) {
    try {
      const customerId = req.user?.id;
      if (!customerId) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
      }

      const bookingId = String(req.params.bookingId);
      const result = await RebookingService.checkRebookEligibility(customerId, bookingId);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return RebookingController.handleError(res, error);
    }
  }

  /**
   * POST /api/customer/bookings/:bookingId/rebook
   * Creates a new booking from a completed booking with new date/time/location.
   */
  static async rebook(req: Request, res: Response) {
    try {
      const customerId = req.user?.id;
      if (!customerId) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
      }

      const bookingId = String(req.params.bookingId);
      const newBooking = await RebookingService.rebookCompletedBooking(customerId, bookingId, req.body);

      return res.status(201).json({
        success: true,
        data: newBooking,
        message: 'Rebooking created successfully.',
      });
    } catch (error) {
      return RebookingController.handleError(res, error);
    }
  }
}
