import { Router } from 'express';
import { ReportController } from '../controllers/report.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Reports and block endpoints
router.post('/reports', requireAuth, ReportController.createReport);
router.post('/blocks', requireAuth, ReportController.createBlock);
router.get('/blocks', requireAuth, ReportController.getBlockedUsers);
router.delete('/blocks/:blockedUserId', requireAuth, ReportController.deleteBlock);

export default router;
