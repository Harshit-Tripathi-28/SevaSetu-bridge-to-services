import { Router } from 'express';
import { RebookingController } from '../controllers/rebooking.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';

const router = Router();
const customerAuth = [requireAuth, requireRole('CUSTOMER', 'ADMIN')];

// Rebooking endpoints
router.get('/customer/bookings/:bookingId/rebook-eligibility', customerAuth, RebookingController.checkEligibility);
router.post('/customer/bookings/:bookingId/rebook', customerAuth, RebookingController.rebook);

export default router;
