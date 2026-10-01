import type { Request, Response } from 'express';
import {
  BookingService,
  BookingConflictError,
  BookingNotFoundError,
  BookingAuthorizationError,
  BookingValidationError,
} from '../services/booking.service.js';
import { BookingTransitionError } from '../services/booking-transition.service.js';
import type { BookingStatus } from '@prisma/client';

export class BookingController {
  private static handleError(res: Response, error: unknown) {
    if (error instanceof BookingConflictError) {
      return res.status(409).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
    }
    if (error instanceof BookingTransitionError) {
      return res.status(409).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: {
            fromStatus: error.fromStatus,
            toStatus: error.toStatus,
            actorType: error.actorType,
          },
        },
      });
    }
    if (error instanceof BookingValidationError) {
      return res.status(400).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
    }
    if (error instanceof BookingAuthorizationError) {
      return res.status(403).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
    }
    if (error instanceof BookingNotFoundError) {
      return res.status(404).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
    }

    const message = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message,
      },
    });
  }

  /**
   * POST /api/service-requests
   * Customer initiates a service request and booking.
   */
  static async createServiceRequest(req: Request, res: Response) {
    try {
      const customerId = req.user?.id;
      if (!customerId) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
      }

      const booking = await BookingService.createBookingRequest(customerId, req.body);
      return res.status(201).json({
        success: true,
        data: booking,
        message: 'Service request and booking created successfully.',
      });
    } catch (error) {
      return BookingController.handleError(res, error);
    }
  }

  /**
   * GET /api/customer/bookings
   * Customer retrieves their own booking history.
   */
  static async getCustomerBookings(req: Request, res: Response) {
    try {
      const customerId = req.user?.id;
      if (!customerId) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
      }

      const statusQuery = req.query.status as string | undefined;
      const statusArray = statusQuery
        ? (statusQuery.split(',').map((s) => s.trim().toUpperCase()) as BookingStatus[])
        : undefined;

      const result = await BookingService.getCustomerBookings(customerId, {
        status: statusArray,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      });

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return BookingController.handleError(res, error);
    }
  }

  /**
   * GET /api/customer/bookings/:id
   * Customer retrieves detail of their own booking.
   */
  static async getCustomerBookingById(req: Request, res: Response) {
    try {
      const customerId = req.user?.id;
      if (!customerId) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
      }

      const bookingId = String(req.params.id);
      const booking = await BookingService.getCustomerBookingById(customerId, bookingId);
      return res.status(200).json({
        success: true,
        data: booking,
      });
    } catch (error) {
      return BookingController.handleError(res, error);
    }
  }

  /**
   * POST /api/customer/bookings/:id/cancel
   * Customer cancels their own eligible booking.
   */
  static async cancelCustomerBooking(req: Request, res: Response) {
    try {
      const customerId = req.user?.id;
      if (!customerId) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
      }

      const bookingId = String(req.params.id);
      const { reason } = req.body || {};
      const booking = await BookingService.cancelBooking(customerId, 'CUSTOMER', bookingId, reason);
      return res.status(200).json({
        success: true,
        data: booking,
        message: 'Booking cancelled successfully.',
      });
    } catch (error) {
      return BookingController.handleError(res, error);
    }
  }

  /**
   * POST /api/customer/bookings/:id/reschedule
   * Customer requests a new date/time for an eligible booking.
   */
  static async rescheduleCustomerBooking(req: Request, res: Response) {
    try {
      const customerId = req.user?.id;
      if (!customerId) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
      }

      const bookingId = String(req.params.id);
      const booking = await BookingService.rescheduleBooking(customerId, bookingId, req.body);

      return res.status(200).json({
        success: true,
        data: booking,
        message: 'Booking rescheduled successfully.',
      });
    } catch (error) {
      return BookingController.handleError(res, error);
    }
  }

  /**
   * GET /api/provider/bookings/requests
   * Provider views pending incoming requests.
   */
  static async getProviderBookingRequests(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
      }

      const result = await BookingService.getProviderBookingRequests(userId, {
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      });

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return BookingController.handleError(res, error);
    }
  }

  /**
   * GET /api/provider/bookings
   * Provider views assigned bookings / jobs.
   */
  static async getProviderBookings(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
      }

      const statusQuery = req.query.status as string | undefined;
      const statusArray = statusQuery
        ? (statusQuery.split(',').map((s) => s.trim().toUpperCase()) as BookingStatus[])
        : undefined;

      const result = await BookingService.getProviderBookings(userId, {
        status: statusArray,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      });

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return BookingController.handleError(res, error);
    }
  }

  /**
   * GET /api/provider/bookings/:id
   * Provider views detail of an assigned booking / job.
   */
  static async getProviderBookingById(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
      }

      const bookingId = String(req.params.id);
      const booking = await BookingService.getProviderBookingById(userId, bookingId);
      return res.status(200).json({
        success: true,
        data: booking,
      });
    } catch (error) {
      return BookingController.handleError(res, error);
    }
  }

  /**
   * POST /api/provider/bookings/:id/accept
   * Provider accepts a pending booking request.
   */
  static async acceptBooking(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
      }

      const bookingId = String(req.params.id);
      const { notes } = req.body || {};
      const booking = await BookingService.acceptBooking(userId, bookingId, notes);
      return res.status(200).json({
        success: true,
        data: booking,
        message: 'Booking request accepted and scheduled.',
      });
    } catch (error) {
      return BookingController.handleError(res, error);
    }
  }

  /**
   * POST /api/provider/bookings/:id/decline
   * Provider declines a pending booking request.
   */
  static async declineBooking(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
      }

      const bookingId = String(req.params.id);
      const { reason } = req.body || {};
      const booking = await BookingService.declineBooking(userId, bookingId, reason);
      return res.status(200).json({
        success: true,
        data: booking,
        message: 'Booking request declined.',
      });
    } catch (error) {
      return BookingController.handleError(res, error);
    }
  }

  /**
   * POST /api/provider/bookings/:id/status
   * Provider advances execution states (ON_THE_WAY, ARRIVED, IN_PROGRESS, COMPLETED).
   */
  static async updateExecutionStatus(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
      }

      const bookingId = String(req.params.id);
      const { status, notes } = req.body || {};
      if (!status) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Status is required.' },
        });
      }

      const booking = await BookingService.updateExecutionStatus(
        userId,
        bookingId,
        status.toUpperCase() as BookingStatus,
        notes
      );
      return res.status(200).json({
        success: true,
        data: booking,
        message: `Job status updated to ${status}.`,
      });
    } catch (error) {
      return BookingController.handleError(res, error);
    }
  }

  /**
   * POST /api/provider/bookings/:id/cancel
   * Provider cancels an active job with reason.
   */
  static async cancelProviderBooking(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
      }

      const bookingId = String(req.params.id);
      const { reason } = req.body || {};
      const booking = await BookingService.cancelBooking(userId, 'PROVIDER', bookingId, reason);
      return res.status(200).json({
        success: true,
        data: booking,
        message: 'Job cancelled successfully.',
      });
    } catch (error) {
      return BookingController.handleError(res, error);
    }
  }
}

