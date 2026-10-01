import { Router } from 'express';
import { ReviewController } from '../controllers/review.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

const customerAuth = [requireAuth, requireRole('CUSTOMER', 'ADMIN')];
const providerAuth = [requireAuth, requireRole('PROVIDER', 'ADMIN')];

// Public Provider Reviews & Reputation
router.get('/providers/:id/reviews', ReviewController.getPublicProviderReviews);
router.get('/providers/:id/reputation', ReviewController.getProviderReputation);

// Customer Review Submission & View
router.post('/customer/bookings/:bookingId/review', customerAuth, ReviewController.submitReview);
router.get('/customer/bookings/:bookingId/review', requireAuth, ReviewController.getBookingReview);

// Provider View of their Own Reviews
router.get('/provider/reviews', providerAuth, ReviewController.getProviderOwnReviews);

export default router;
