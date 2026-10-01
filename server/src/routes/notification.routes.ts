import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// In-app notifications
router.get('/notifications', requireAuth, NotificationController.getUserNotifications);
router.patch('/notifications/:id/read', requireAuth, NotificationController.markAsRead);
router.post('/notifications/read-all', requireAuth, NotificationController.markAllAsRead);

// Notification preferences
router.get('/notifications/preferences', requireAuth, NotificationController.getPreferences);
router.patch('/notifications/preferences', requireAuth, NotificationController.updatePreferences);

export default router;
