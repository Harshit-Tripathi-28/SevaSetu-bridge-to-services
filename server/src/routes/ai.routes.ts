import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { aiController } from '../controllers/ai.controller.js';

export const aiRouter = Router();

// ==========================================
// 1. HEALTH & PUBLIC READ
// ==========================================
aiRouter.get('/ai/health', (req, res) => aiController.getHealth(req, res));
aiRouter.get(
  ['/ai/reviews/:providerProfileId/summary', '/ai/providers/:providerProfileId/review-summary'],
  (req, res) => aiController.getReviewSummary(req, res)
);
aiRouter.post(
  ['/ai/matching/rank', '/ai/rank-providers'],
  requireAuth,
  (req, res) => aiController.rankProviders(req, res)
);

// ==========================================
// 2. CUSTOMER AI ENDPOINTS
// ==========================================
aiRouter.post(
  ['/ai/service-request/parse', '/ai/parse-service-request'],
  requireAuth,
  requireRole('CUSTOMER'),
  (req, res) => aiController.parseServiceRequest(req, res)
);

aiRouter.post(
  ['/ai/service-request/confirm', '/ai/confirm-service-request'],
  requireAuth,
  requireRole('CUSTOMER'),
  (req, res) => aiController.confirmServiceRequest(req, res)
);

aiRouter.get(
  ['/ai/recommendations/repeat-services', '/ai/customer/repeat-recommendations'],
  requireAuth,
  requireRole('CUSTOMER'),
  (req, res) => aiController.getRepeatServices(req, res)
);

aiRouter.get(
  ['/ai/recommendations/predictive-reminders', '/ai/customer/predictive-reminders'],
  requireAuth,
  requireRole('CUSTOMER'),
  (req, res) => aiController.getPredictiveReminders(req, res)
);

// ==========================================
// 3. AUTHENTICATED SUPPORT ASSISTANT
// ==========================================
aiRouter.post(
  ['/ai/support/ask', '/ai/support-assistant'],
  requireAuth,
  (req, res) => aiController.askSupportAssistant(req, res)
);

// ==========================================
// 4. ADMIN OPERATIONAL AI ENDPOINTS
// ==========================================
aiRouter.get(
  ['/ai/signals/pricing-anomaly', '/ai/admin/price-anomalies'],
  requireAuth,
  requireRole('ADMIN'),
  (req, res) => aiController.checkPricingAnomaly(req, res)
);

aiRouter.get(
  ['/ai/signals/duplicate-profiles', '/ai/admin/duplicate-profiles'],
  requireAuth,
  requireRole('ADMIN'),
  (req, res) => aiController.detectDuplicateProfiles(req, res)
);

aiRouter.get(
  ['/ai/forecast/demand', '/ai/admin/demand-forecast'],
  requireAuth,
  requireRole('ADMIN'),
  (req, res) => aiController.forecastDemand(req, res)
);

aiRouter.get(
  ['/admin/ai/telemetry', '/ai/telemetry'],
  requireAuth,
  requireRole('ADMIN'),
  (req, res) => aiController.getTelemetry(req, res)
);

aiRouter.get(
  '/admin/ai/settings',
  requireAuth,
  requireRole('ADMIN'),
  (req, res) => aiController.getAiSettings(req, res)
);

aiRouter.patch(
  '/admin/ai/settings',
  requireAuth,
  requireRole('ADMIN'),
  (req, res) => aiController.updateAiSetting(req, res)
);
