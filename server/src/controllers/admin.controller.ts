import type { Request, Response } from 'express';
import { AdminService, AdminServiceError } from '../services/admin.service.js';
import { AuditService } from '../services/audit.service.js';

export class AdminController {
  // Helper to extract client IP safely
  private static getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0]?.trim() || '127.0.0.1';
    }
    return req.socket?.remoteAddress || '127.0.0.1';
  }

  // ==========================================
  // DASHBOARD METRICS
  // ==========================================
  static async getDashboardMetrics(_req: Request, res: Response) {
    try {
      const metrics = await AdminService.getDashboardMetrics();
      return res.status(200).json({ success: true, data: metrics });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message } });
    }
  }

  // ==========================================
  // USER MANAGEMENT
  // ==========================================
  static async listUsers(req: Request, res: Response) {
    try {
      const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
      const role = req.query.role as any;
      const status = req.query.status as any;
      const search = req.query.search ? String(req.query.search) : undefined;

      const result = await AdminService.listUsers({ page, limit, role, status, search });
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message } });
    }
  }

  static async getUserDetail(req: Request, res: Response) {
    try {
      const userId = String(req.params.id);
      const user = await AdminService.getUserDetail(userId);
      return res.status(200).json({ success: true, data: user });
    } catch (error) {
      const statusCode = error instanceof AdminServiceError ? error.statusCode : 500;
      const message = error instanceof Error ? error.message : 'Internal server error';
      return res.status(statusCode).json({ success: false, error: { code: 'USER_ERROR', message } });
    }
  }

  static async updateUserStatus(req: Request, res: Response) {
    try {
      const adminUserId = req.user!.id;
      const targetUserId = String(req.params.id);
      const { status, reason } = req.body || {};

      if (!status || !['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: { code: 'BAD_REQUEST', message: 'Valid status (ACTIVE, INACTIVE, SUSPENDED) is required.' },
        });
      }

      const ipAddress = AdminController.getClientIp(req);
      const updated = await AdminService.updateUserStatus(adminUserId, targetUserId, status, reason, ipAddress);

      return res.status(200).json({
        success: true,
        data: updated,
        message: `User account status updated to ${status}.`,
      });
    } catch (error) {
      const statusCode = error instanceof AdminServiceError ? error.statusCode : 400;
      const message = error instanceof Error ? error.message : 'Internal server error';
      return res.status(statusCode).json({ success: false, error: { code: 'UPDATE_STATUS_FAILED', message } });
    }
  }

  static async updateUserRole(req: Request, res: Response) {
    try {
      const adminUserId = req.user!.id;
      const targetUserId = String(req.params.id);
      const { role, reason } = req.body || {};

      if (!role || !['CUSTOMER', 'PROVIDER', 'ADMIN'].includes(role)) {
        return res.status(400).json({
          success: false,
          error: { code: 'BAD_REQUEST', message: 'Valid role (CUSTOMER, PROVIDER, ADMIN) is required.' },
        });
      }

      const ipAddress = AdminController.getClientIp(req);
      const updated = await AdminService.updateUserRole(adminUserId, targetUserId, role, reason, ipAddress);

      return res.status(200).json({
        success: true,
        data: updated,
        message: `User role updated to ${role}.`,
      });
    } catch (error) {
      const statusCode = error instanceof AdminServiceError ? error.statusCode : 400;
      const message = error instanceof Error ? error.message : 'Internal server error';
      return res.status(statusCode).json({ success: false, error: { code: 'UPDATE_ROLE_FAILED', message } });
    }
  }

  // ==========================================
  // PROVIDER OPERATIONS
  // ==========================================
  static async listProviders(req: Request, res: Response) {
    try {
      const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
      const isRestricted = req.query.isRestricted !== undefined ? req.query.isRestricted === 'true' : undefined;
      const isVerified = req.query.isVerified !== undefined ? req.query.isVerified === 'true' : undefined;
      const search = req.query.search ? String(req.query.search) : undefined;

      const result = await AdminService.listProviders({ page, limit, isRestricted, isVerified, search });
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message } });
    }
  }

  static async getProviderDetail(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const provider = await AdminService.getProviderDetail(id);
      return res.status(200).json({ success: true, data: provider });
    } catch (error) {
      const statusCode = error instanceof AdminServiceError ? error.statusCode : 500;
      const message = error instanceof Error ? error.message : 'Internal server error';
      return res.status(statusCode).json({ success: false, error: { code: 'PROVIDER_NOT_FOUND', message } });
    }
  }

  static async restrictProvider(req: Request, res: Response) {
    try {
      const adminUserId = req.user!.id;
      const id = String(req.params.id);
      const { isRestricted, reason } = req.body || {};

      if (typeof isRestricted !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: { code: 'BAD_REQUEST', message: 'isRestricted boolean flag is required.' },
        });
      }

      const ipAddress = AdminController.getClientIp(req);
      const updated = await AdminService.restrictProvider(adminUserId, id, isRestricted, reason, ipAddress);

      return res.status(200).json({
        success: true,
        data: updated,
        message: isRestricted ? 'Provider restricted successfully.' : 'Provider restriction lifted.',
      });
    } catch (error) {
      const statusCode = error instanceof AdminServiceError ? error.statusCode : 400;
      const message = error instanceof Error ? error.message : 'Internal server error';
      return res.status(statusCode).json({ success: false, error: { code: 'RESTRICTION_ERROR', message } });
    }
  }

  // ==========================================
  // CATALOG ADMINISTRATION
  // ==========================================
  static async listCatalogCategories(_req: Request, res: Response) {
    try {
      const categories = await AdminService.listCatalogCategories();
      return res.status(200).json({ success: true, data: categories });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message } });
    }
  }

  static async createCatalogCategory(req: Request, res: Response) {
    try {
      const adminUserId = req.user!.id;
      const ipAddress = AdminController.getClientIp(req);
      const category = await AdminService.createCategory(adminUserId, req.body || {}, ipAddress);
      return res.status(201).json({ success: true, data: category, message: 'Category created.' });
    } catch (error) {
      const statusCode = error instanceof AdminServiceError ? error.statusCode : 400;
      const message = error instanceof Error ? error.message : 'Internal server error';
      return res.status(statusCode).json({ success: false, error: { code: 'CATEGORY_CREATE_ERROR', message } });
    }
  }

  static async listCatalogServices(req: Request, res: Response) {
    try {
      const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
      const categoryId = req.query.categoryId ? String(req.query.categoryId) : undefined;
      const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined;
      const search = req.query.search ? String(req.query.search) : undefined;

      const result = await AdminService.listCatalogServices({ page, limit, categoryId, isActive, search });
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message } });
    }
  }

  static async createCatalogService(req: Request, res: Response) {
    try {
      const adminUserId = req.user!.id;
      const ipAddress = AdminController.getClientIp(req);
      const service = await AdminService.createService(adminUserId, req.body || {}, ipAddress);
      return res.status(201).json({ success: true, data: service, message: 'Service created.' });
    } catch (error) {
      const statusCode = error instanceof AdminServiceError ? error.statusCode : 400;
      const message = error instanceof Error ? error.message : 'Internal server error';
      return res.status(statusCode).json({ success: false, error: { code: 'SERVICE_CREATE_ERROR', message } });
    }
  }

  static async updateCatalogService(req: Request, res: Response) {
    try {
      const adminUserId = req.user!.id;
      const serviceId = String(req.params.id);
      const ipAddress = AdminController.getClientIp(req);
      const updated = await AdminService.updateService(adminUserId, serviceId, req.body || {}, ipAddress);
      return res.status(200).json({ success: true, data: updated, message: 'Service updated.' });
    } catch (error) {
      const statusCode = error instanceof AdminServiceError ? error.statusCode : 400;
      const message = error instanceof Error ? error.message : 'Internal server error';
      return res.status(statusCode).json({ success: false, error: { code: 'SERVICE_UPDATE_ERROR', message } });
    }
  }

  static async setServiceActiveStatus(req: Request, res: Response) {
    try {
      const adminUserId = req.user!.id;
      const serviceId = String(req.params.id);
      const { isActive, reason } = req.body || {};

      if (typeof isActive !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: { code: 'BAD_REQUEST', message: 'isActive boolean flag is required.' },
        });
      }

      const ipAddress = AdminController.getClientIp(req);
      const updated = await AdminService.setServiceActiveStatus(adminUserId, serviceId, isActive, reason, ipAddress);

      return res.status(200).json({
        success: true,
        data: updated,
        message: isActive ? 'Service activated.' : 'Service safely deactivated.',
      });
    } catch (error) {
      const statusCode = error instanceof AdminServiceError ? error.statusCode : 400;
      const message = error instanceof Error ? error.message : 'Internal server error';
      return res.status(statusCode).json({ success: false, error: { code: 'SERVICE_STATUS_ERROR', message } });
    }
  }

  // ==========================================
  // BOOKING OPERATIONS
  // ==========================================
  static async listBookings(req: Request, res: Response) {
    try {
      const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
      const status = req.query.status as any;
      const search = req.query.search ? String(req.query.search) : undefined;
      const fromDate = req.query.fromDate ? String(req.query.fromDate) : undefined;
      const toDate = req.query.toDate ? String(req.query.toDate) : undefined;

      const result = await AdminService.listBookings({ page, limit, status, search, fromDate, toDate });
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message } });
    }
  }

  static async getBookingDetail(req: Request, res: Response) {
    try {
      const bookingId = String(req.params.id);
      const booking = await AdminService.getBookingDetail(bookingId);
      return res.status(200).json({ success: true, data: booking });
    } catch (error) {
      const statusCode = error instanceof AdminServiceError ? error.statusCode : 500;
      const message = error instanceof Error ? error.message : 'Internal server error';
      return res.status(statusCode).json({ success: false, error: { code: 'BOOKING_NOT_FOUND', message } });
    }
  }

  static async operationalCancelBooking(req: Request, res: Response) {
    try {
      const adminUserId = req.user!.id;
      const bookingId = String(req.params.id);
      const { reason } = req.body || {};

      if (!reason?.trim()) {
        return res.status(400).json({
          success: false,
          error: { code: 'BAD_REQUEST', message: 'Cancellation reason is required.' },
        });
      }

      const ipAddress = AdminController.getClientIp(req);
      const cancelled = await AdminService.operationalCancelBooking(adminUserId, bookingId, reason, ipAddress);

      return res.status(200).json({
        success: true,
        data: cancelled,
        message: 'Booking cancelled operationally for safety/administrative reasons.',
      });
    } catch (error) {
      const statusCode = error instanceof AdminServiceError ? error.statusCode : 400;
      const message = error instanceof Error ? error.message : 'Internal server error';
      return res.status(statusCode).json({ success: false, error: { code: 'OPERATIONAL_CANCEL_ERROR', message } });
    }
  }

  // ==========================================
  // PAYMENTS & REFUNDS MONITORING
  // ==========================================
  static async listPayments(req: Request, res: Response) {
    try {
      const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
      const status = req.query.status ? String(req.query.status) : undefined;
      const search = req.query.search ? String(req.query.search) : undefined;

      const result = await AdminService.listPayments({ page, limit, status, search });
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message } });
    }
  }

  static async listRefunds(req: Request, res: Response) {
    try {
      const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
      const status = req.query.status ? String(req.query.status) : undefined;
      const search = req.query.search ? String(req.query.search) : undefined;

      const result = await AdminService.listRefunds({ page, limit, status, search });
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message } });
    }
  }

  static async processManualRefund(req: Request, res: Response) {
    try {
      const adminUserId = req.user!.id;
      const paymentId = String(req.params.id);
      const { amountPaise, reason } = req.body || {};

      const ipAddress = AdminController.getClientIp(req);
      const refund = await AdminService.processManualRefund(adminUserId, paymentId, amountPaise, reason, ipAddress);

      return res.status(201).json({
        success: true,
        data: refund,
        message: 'Manual refund processed successfully.',
      });
    } catch (error) {
      const statusCode = error instanceof AdminServiceError ? error.statusCode : 400;
      const message = error instanceof Error ? error.message : 'Internal server error';
      return res.status(statusCode).json({ success: false, error: { code: 'REFUND_PROCESSING_ERROR', message } });
    }
  }

  // ==========================================
  // VERIFICATION WORKFLOW
  // ==========================================
  static async listVerifications(req: Request, res: Response) {
    try {
      const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
      const status = req.query.status ? String(req.query.status) : undefined;
      const verificationType = req.query.verificationType ? String(req.query.verificationType) : undefined;

      const result = await AdminService.listVerifications({ page, limit, status, verificationType });
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message } });
    }
  }

  static async getVerificationDetail(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const record = await AdminService.getVerificationDetail(id);
      return res.status(200).json({ success: true, data: record });
    } catch (error) {
      const statusCode = error instanceof AdminServiceError ? error.statusCode : 500;
      const message = error instanceof Error ? error.message : 'Internal server error';
      return res.status(statusCode).json({ success: false, error: { code: 'VERIFICATION_NOT_FOUND', message } });
    }
  }

  static async reviewVerification(req: Request, res: Response) {
    try {
      const adminUserId = req.user!.id;
      const id = String(req.params.id);
      const ipAddress = AdminController.getClientIp(req);

      const reviewed = await AdminService.reviewVerification(adminUserId, id, req.body || {}, ipAddress);

      return res.status(200).json({
        success: true,
        data: reviewed,
        message: `Verification submission ${reviewed.status}.`,
      });
    } catch (error) {
      const statusCode = error instanceof AdminServiceError ? error.statusCode : 400;
      const message = error instanceof Error ? error.message : 'Internal server error';
      return res.status(statusCode).json({ success: false, error: { code: 'VERIFICATION_REVIEW_ERROR', message } });
    }
  }

  // Provider self-submission endpoint
  static async submitProviderVerification(req: Request, res: Response) {
    try {
      const providerUserId = req.user!.id;
      const record = await AdminService.submitVerification(providerUserId, req.body || {});
      return res.status(201).json({
        success: true,
        data: record,
        message: 'Verification submitted successfully for administrative review.',
      });
    } catch (error) {
      const statusCode = error instanceof AdminServiceError ? error.statusCode : 400;
      const message = error instanceof Error ? error.message : 'Internal server error';
      return res.status(statusCode).json({ success: false, error: { code: 'SUBMISSION_ERROR', message } });
    }
  }

  // ==========================================
  // REPORTS OPERATIONS
  // ==========================================
  static async listReports(req: Request, res: Response) {
    try {
      const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
      const status = req.query.status as any;
      const priority = req.query.priority ? String(req.query.priority) : undefined;

      const result = await AdminService.listReports({ page, limit, status, priority });
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message } });
    }
  }

  static async getReportDetail(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const report = await AdminService.getReportDetail(id);
      return res.status(200).json({ success: true, data: report });
    } catch (error) {
      const statusCode = error instanceof AdminServiceError ? error.statusCode : 500;
      const message = error instanceof Error ? error.message : 'Internal server error';
      return res.status(statusCode).json({ success: false, error: { code: 'REPORT_NOT_FOUND', message } });
    }
  }

  static async updateReport(req: Request, res: Response) {
    try {
      const adminUserId = req.user!.id;
      const id = String(req.params.id);
      const ipAddress = AdminController.getClientIp(req);

      const updated = await AdminService.updateReport(adminUserId, id, req.body || {}, ipAddress);
      return res.status(200).json({
        success: true,
        data: updated,
        message: 'Report updated successfully.',
      });
    } catch (error) {
      const statusCode = error instanceof AdminServiceError ? error.statusCode : 400;
      const message = error instanceof Error ? error.message : 'Internal server error';
      return res.status(statusCode).json({ success: false, error: { code: 'REPORT_UPDATE_ERROR', message } });
    }
  }

  // ==========================================
  // DISPUTES OPERATIONS
  // ==========================================
  static async createDispute(req: Request, res: Response) {
    try {
      const openedByUserId = req.user!.id;
      const dispute = await AdminService.createDispute(openedByUserId, req.body || {});
      return res.status(201).json({
        success: true,
        data: dispute,
        message: 'Dispute filed successfully.',
      });
    } catch (error) {
      const statusCode = error instanceof AdminServiceError ? error.statusCode : 400;
      const message = error instanceof Error ? error.message : 'Internal server error';
      return res.status(statusCode).json({ success: false, error: { code: 'DISPUTE_CREATE_ERROR', message } });
    }
  }

  static async listDisputes(req: Request, res: Response) {
    try {
      const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
      const status = req.query.status ? String(req.query.status) : undefined;
      const priority = req.query.priority ? String(req.query.priority) : undefined;
      const bookingId = req.query.bookingId ? String(req.query.bookingId) : undefined;

      const result = await AdminService.listDisputes({ page, limit, status, priority, bookingId });
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message } });
    }
  }

  static async getDisputeDetail(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const userRole = req.user?.role;
      const dispute = await AdminService.getDisputeDetail(id, userRole);
      return res.status(200).json({ success: true, data: dispute });
    } catch (error) {
      const statusCode = error instanceof AdminServiceError ? error.statusCode : 500;
      const message = error instanceof Error ? error.message : 'Internal server error';
      return res.status(statusCode).json({ success: false, error: { code: 'DISPUTE_NOT_FOUND', message } });
    }
  }

  static async transitionDispute(req: Request, res: Response) {
    try {
      const adminUserId = req.user!.id;
      const id = String(req.params.id);
      const ipAddress = AdminController.getClientIp(req);

      const transitioned = await AdminService.transitionDispute(adminUserId, id, req.body || {}, ipAddress);
      return res.status(200).json({
        success: true,
        data: transitioned,
        message: `Dispute status transitioned to ${transitioned.status}.`,
      });
    } catch (error) {
      const statusCode = error instanceof AdminServiceError ? error.statusCode : 400;
      const message = error instanceof Error ? error.message : 'Internal server error';
      return res.status(statusCode).json({ success: false, error: { code: 'DISPUTE_TRANSITION_ERROR', message } });
    }
  }

  static async assignDispute(req: Request, res: Response) {
    try {
      const adminUserId = req.user!.id;
      const id = String(req.params.id);
      const { assignedAdminId } = req.body || {};

      if (!assignedAdminId) {
        return res.status(400).json({
          success: false,
          error: { code: 'BAD_REQUEST', message: 'assignedAdminId is required.' },
        });
      }

      const ipAddress = AdminController.getClientIp(req);
      const assigned = await AdminService.assignDispute(adminUserId, id, assignedAdminId, ipAddress);

      return res.status(200).json({
        success: true,
        data: assigned,
        message: 'Dispute assigned successfully.',
      });
    } catch (error) {
      const statusCode = error instanceof AdminServiceError ? error.statusCode : 400;
      const message = error instanceof Error ? error.message : 'Internal server error';
      return res.status(statusCode).json({ success: false, error: { code: 'DISPUTE_ASSIGN_ERROR', message } });
    }
  }

  // ==========================================
  // SUPPORT TICKETS
  // ==========================================
  static async createSupportTicket(req: Request, res: Response) {
    try {
      const requesterUserId = req.user!.id;
      const requesterRole = req.user!.role;
      const ticket = await AdminService.createSupportTicket(requesterUserId, requesterRole, req.body || {});
      return res.status(201).json({
        success: true,
        data: ticket,
        message: 'Support ticket submitted.',
      });
    } catch (error) {
      const statusCode = error instanceof AdminServiceError ? error.statusCode : 400;
      const message = error instanceof Error ? error.message : 'Internal server error';
      return res.status(statusCode).json({ success: false, error: { code: 'TICKET_CREATE_ERROR', message } });
    }
  }

  static async listSupportTickets(req: Request, res: Response) {
    try {
      const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
      const status = req.query.status ? String(req.query.status) : undefined;
      const priority = req.query.priority ? String(req.query.priority) : undefined;
      const category = req.query.category ? String(req.query.category) : undefined;

      const result = await AdminService.listSupportTickets({ page, limit, status, priority, category });
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message } });
    }
  }

  static async getSupportTicketDetail(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const userRole = req.user?.role;
      const ticket = await AdminService.getSupportTicketDetail(id, userRole);
      return res.status(200).json({ success: true, data: ticket });
    } catch (error) {
      const statusCode = error instanceof AdminServiceError ? error.statusCode : 500;
      const message = error instanceof Error ? error.message : 'Internal server error';
      return res.status(statusCode).json({ success: false, error: { code: 'TICKET_NOT_FOUND', message } });
    }
  }

  static async updateSupportTicket(req: Request, res: Response) {
    try {
      const adminUserId = req.user!.id;
      const id = String(req.params.id);
      const ipAddress = AdminController.getClientIp(req);

      const updated = await AdminService.updateSupportTicket(adminUserId, id, req.body || {}, ipAddress);
      return res.status(200).json({
        success: true,
        data: updated,
        message: 'Support ticket updated.',
      });
    } catch (error) {
      const statusCode = error instanceof AdminServiceError ? error.statusCode : 400;
      const message = error instanceof Error ? error.message : 'Internal server error';
      return res.status(statusCode).json({ success: false, error: { code: 'TICKET_UPDATE_ERROR', message } });
    }
  }

  // ==========================================
  // TRUST & SAFETY CASES
  // ==========================================
  static async listTrustSafetyCases(req: Request, res: Response) {
    try {
      const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
      const status = req.query.status ? String(req.query.status) : undefined;
      const severity = req.query.severity ? String(req.query.severity) : undefined;
      const entityType = req.query.entityType ? String(req.query.entityType) : undefined;

      const result = await AdminService.listTrustSafetyCases({ page, limit, status, severity, entityType });
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message } });
    }
  }

  static async getTrustSafetyCaseDetail(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const c = await AdminService.getTrustSafetyCaseDetail(id);
      return res.status(200).json({ success: true, data: c });
    } catch (error) {
      const statusCode = error instanceof AdminServiceError ? error.statusCode : 500;
      const message = error instanceof Error ? error.message : 'Internal server error';
      return res.status(statusCode).json({ success: false, error: { code: 'CASE_NOT_FOUND', message } });
    }
  }

  static async createTrustSafetyCase(req: Request, res: Response) {
    try {
      const adminUserId = req.user!.id;
      const ipAddress = AdminController.getClientIp(req);
      const c = await AdminService.createTrustSafetyCase(adminUserId, req.body || {}, ipAddress);
      return res.status(201).json({
        success: true,
        data: c,
        message: 'Trust & Safety case opened for factual risk investigation.',
      });
    } catch (error) {
      const statusCode = error instanceof AdminServiceError ? error.statusCode : 400;
      const message = error instanceof Error ? error.message : 'Internal server error';
      return res.status(statusCode).json({ success: false, error: { code: 'CASE_CREATE_ERROR', message } });
    }
  }

  static async updateTrustSafetyCase(req: Request, res: Response) {
    try {
      const adminUserId = req.user!.id;
      const id = String(req.params.id);
      const ipAddress = AdminController.getClientIp(req);
      const updated = await AdminService.updateTrustSafetyCase(adminUserId, id, req.body || {}, ipAddress);
      return res.status(200).json({
        success: true,
        data: updated,
        message: 'Trust & Safety case updated.',
      });
    } catch (error) {
      const statusCode = error instanceof AdminServiceError ? error.statusCode : 400;
      const message = error instanceof Error ? error.message : 'Internal server error';
      return res.status(statusCode).json({ success: false, error: { code: 'CASE_UPDATE_ERROR', message } });
    }
  }

  // ==========================================
  // AUDIT LOGS
  // ==========================================
  static async listAuditLogs(req: Request, res: Response) {
    try {
      const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
      const actorUserId = req.query.actorUserId ? String(req.query.actorUserId) : undefined;
      const entityType = req.query.entityType ? String(req.query.entityType) : undefined;
      const entityId = req.query.entityId ? String(req.query.entityId) : undefined;
      const action = req.query.action ? String(req.query.action) : undefined;
      const fromDate = req.query.fromDate ? String(req.query.fromDate) : undefined;
      const toDate = req.query.toDate ? String(req.query.toDate) : undefined;

      const result = await AuditService.queryLogs({
        page,
        limit,
        actorUserId,
        entityType,
        entityId,
        action,
        fromDate,
        toDate,
      });

      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message } });
    }
  }

  // ==========================================
  // PLATFORM SETTINGS
  // ==========================================
  static async getSettings(_req: Request, res: Response) {
    try {
      const settings = await AdminService.getSettings();
      return res.status(200).json({ success: true, data: settings });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message } });
    }
  }

  static async updateSetting(req: Request, res: Response) {
    try {
      const adminUserId = req.user!.id;
      const key = String(req.params.key);
      const { value, description } = req.body || {};
      const ipAddress = AdminController.getClientIp(req);

      const updated = await AdminService.updateSetting(adminUserId, key, value, description, ipAddress);

      return res.status(200).json({
        success: true,
        data: updated,
        message: `Platform setting '${key}' updated successfully.`,
      });
    } catch (error) {
      const statusCode = error instanceof AdminServiceError ? error.statusCode : 400;
      const message = error instanceof Error ? error.message : 'Internal server error';
      return res.status(statusCode).json({ success: false, error: { code: 'SETTING_UPDATE_ERROR', message } });
    }
  }
}
