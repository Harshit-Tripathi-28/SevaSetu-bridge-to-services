import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { AdminController } from '../controllers/admin.controller.js';

export const adminRouter = Router();

// ==========================================
// 1. NON-ADMIN OPERATIONS (CUSTOMER / PROVIDER)
// ==========================================

// Provider Verification Submission
adminRouter.post(
  '/provider/verification',
  requireAuth,
  requireRole('PROVIDER'),
  AdminController.submitProviderVerification
);
adminRouter.post(
  '/providers/verification',
  requireAuth,
  requireRole('PROVIDER'),
  AdminController.submitProviderVerification
);

// Disputes (Customer / Provider)
adminRouter.post('/disputes', requireAuth, AdminController.createDispute);
adminRouter.get('/disputes/:id', requireAuth, AdminController.getDisputeDetail);

// Support Tickets (Customer / Provider)
adminRouter.post('/support/tickets', requireAuth, AdminController.createSupportTicket);
adminRouter.get('/support/tickets/:id', requireAuth, AdminController.getSupportTicketDetail);

// ==========================================
// 2. STRICT ADMIN OPERATIONS SUB-ROUTER
// ==========================================
const adminOnlyRouter = Router();

// Enforce both authentication and ADMIN role for all routes in this sub-router
adminOnlyRouter.use(requireAuth, requireRole('ADMIN'));

// Dashboard Metrics
adminOnlyRouter.get('/metrics', AdminController.getDashboardMetrics);

// User Management
adminOnlyRouter.get('/users', AdminController.listUsers);
adminOnlyRouter.get('/users/:id', AdminController.getUserDetail);
adminOnlyRouter.patch('/users/:id/status', AdminController.updateUserStatus);
adminOnlyRouter.patch('/users/:id/role', AdminController.updateUserRole);

// Provider Operations
adminOnlyRouter.get('/providers', AdminController.listProviders);
adminOnlyRouter.get('/providers/:id', AdminController.getProviderDetail);
adminOnlyRouter.post('/providers/:id/restrict', AdminController.restrictProvider);

// Catalog Administration
adminOnlyRouter.get('/categories', AdminController.listCatalogCategories);
adminOnlyRouter.post('/categories', AdminController.createCatalogCategory);
adminOnlyRouter.get('/catalog/categories', AdminController.listCatalogCategories);
adminOnlyRouter.post('/catalog/categories', AdminController.createCatalogCategory);
adminOnlyRouter.get('/services', AdminController.listCatalogServices);
adminOnlyRouter.post('/services', AdminController.createCatalogService);
adminOnlyRouter.patch('/services/:id', AdminController.updateCatalogService);
adminOnlyRouter.patch('/services/:id/status', AdminController.setServiceActiveStatus);
adminOnlyRouter.get('/catalog/services', AdminController.listCatalogServices);
adminOnlyRouter.post('/catalog/services', AdminController.createCatalogService);
adminOnlyRouter.patch('/catalog/services/:id', AdminController.updateCatalogService);
adminOnlyRouter.patch('/catalog/services/:id/status', AdminController.setServiceActiveStatus);

// Booking Monitoring & Operations
adminOnlyRouter.get('/bookings', AdminController.listBookings);
adminOnlyRouter.get('/bookings/:id', AdminController.getBookingDetail);
adminOnlyRouter.post('/bookings/:id/cancel', AdminController.operationalCancelBooking);

// Payment & Refund Operations
adminOnlyRouter.get('/payments', AdminController.listPayments);
adminOnlyRouter.get('/refunds', AdminController.listRefunds);
adminOnlyRouter.post('/payments/:id/refund', AdminController.processManualRefund);

// Verification Queue & Review
adminOnlyRouter.get('/verifications', AdminController.listVerifications);
adminOnlyRouter.get('/verifications/:id', AdminController.getVerificationDetail);
adminOnlyRouter.post('/verifications/:id/review', AdminController.reviewVerification);
adminOnlyRouter.patch('/verifications/:id', AdminController.reviewVerification);

// Reports Operations
adminOnlyRouter.get('/reports', AdminController.listReports);
adminOnlyRouter.get('/reports/:id', AdminController.getReportDetail);
adminOnlyRouter.patch('/reports/:id', AdminController.updateReport);

// Disputes Operations
adminOnlyRouter.get('/disputes', AdminController.listDisputes);
adminOnlyRouter.get('/disputes/:id', AdminController.getDisputeDetail);
adminOnlyRouter.post('/disputes/:id/transition', AdminController.transitionDispute);
adminOnlyRouter.patch('/disputes/:id', AdminController.transitionDispute);
adminOnlyRouter.post('/disputes/:id/assign', AdminController.assignDispute);

// Support Operations
adminOnlyRouter.get('/support/tickets', AdminController.listSupportTickets);
adminOnlyRouter.get('/support/tickets/:id', AdminController.getSupportTicketDetail);
adminOnlyRouter.patch('/support/tickets/:id', AdminController.updateSupportTicket);

// Trust & Safety Cases
adminOnlyRouter.get('/trust-safety', AdminController.listTrustSafetyCases);
adminOnlyRouter.get('/trust-safety/:id', AdminController.getTrustSafetyCaseDetail);
adminOnlyRouter.post('/trust-safety', AdminController.createTrustSafetyCase);
adminOnlyRouter.patch('/trust-safety/:id', AdminController.updateTrustSafetyCase);
adminOnlyRouter.get('/trust-safety/cases', AdminController.listTrustSafetyCases);
adminOnlyRouter.get('/trust-safety/cases/:id', AdminController.getTrustSafetyCaseDetail);
adminOnlyRouter.post('/trust-safety/cases', AdminController.createTrustSafetyCase);
adminOnlyRouter.patch('/trust-safety/cases/:id', AdminController.updateTrustSafetyCase);

// Audit Logs (Immutable, strictly ADMIN only)
adminOnlyRouter.get('/audit-logs', AdminController.listAuditLogs);

// Platform Settings & Configuration
adminOnlyRouter.get('/settings', AdminController.getSettings);
adminOnlyRouter.put('/settings/:key', AdminController.updateSetting);

// Mount the strictly-guarded admin-only router under /admin
adminRouter.use('/admin', adminOnlyRouter);

export default adminRouter;
