import { Router } from 'express';
import { ProviderController } from '../controllers/provider.controller.js';
import { AvailabilityController } from '../controllers/availability.controller.js';
import { SearchController } from '../controllers/search.controller.js';
import { BookingController } from '../controllers/booking.controller.js';
import { PaymentController } from '../controllers/payment.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

// Public Provider Search & Discovery Endpoints
// Note: '/providers/search' must be defined BEFORE '/providers/:id'
router.get('/providers/search', SearchController.searchProviders);
router.get('/providers/:id/availability', SearchController.checkProviderAvailability);
router.get('/providers/:id', ProviderController.getPublicProfile);

// Authenticated Provider-Only Management Endpoints
const providerAuth = [requireAuth, requireRole('PROVIDER', 'ADMIN')];

// Provider Profile
router.get('/provider/profile', providerAuth, ProviderController.getProfile);
router.patch('/provider/profile', providerAuth, ProviderController.updateProfile);

// Provider Skills
router.get('/provider/skills', providerAuth, ProviderController.getSkills);
router.post('/provider/skills', providerAuth, ProviderController.addSkill);
router.delete('/provider/skills/:id', providerAuth, ProviderController.removeSkill);

// Provider Services
router.get('/provider/services', providerAuth, ProviderController.getServices);
router.post('/provider/services', providerAuth, ProviderController.addService);
router.patch('/provider/services/:id', providerAuth, ProviderController.updateService);
router.delete('/provider/services/:id', providerAuth, ProviderController.removeService);

// Provider Service Area
router.get('/provider/service-area', providerAuth, ProviderController.getServiceAreas);
router.put('/provider/service-area', providerAuth, ProviderController.setServiceArea);
router.post('/provider/service-area', providerAuth, ProviderController.setServiceArea);

// Provider Onboarding Workflow
router.get('/provider/onboarding', providerAuth, ProviderController.getOnboardingState);
router.post('/provider/onboarding/complete', providerAuth, ProviderController.completeOnboarding);

// Provider Availability & Schedule Management
router.get('/provider/availability', providerAuth, AvailabilityController.getAvailability);
router.put('/provider/availability', providerAuth, AvailabilityController.setAvailability);
router.post('/provider/availability', providerAuth, AvailabilityController.setAvailability);
router.post('/provider/availability/overrides', providerAuth, AvailabilityController.createOverride);
router.delete('/provider/availability/overrides/:id', providerAuth, AvailabilityController.deleteOverride);

// Phase 4: Provider Booking & Job Execution Management
router.get('/provider/bookings/requests', providerAuth, BookingController.getProviderBookingRequests);
router.get('/provider/bookings', providerAuth, BookingController.getProviderBookings);
router.get('/provider/bookings/:id', providerAuth, BookingController.getProviderBookingById);
router.post('/provider/bookings/:id/accept', providerAuth, BookingController.acceptBooking);
router.post('/provider/bookings/:id/decline', providerAuth, BookingController.declineBooking);
router.post('/provider/bookings/:id/status', providerAuth, BookingController.updateExecutionStatus);
router.post('/provider/bookings/:id/cancel', providerAuth, BookingController.cancelProviderBooking);

// Phase 5: Provider Financials, Invoices, Earnings & Payouts
router.get('/provider/earnings/summary', providerAuth, PaymentController.getProviderEarningsSummary);
router.get('/provider/earnings', providerAuth, PaymentController.getProviderEarnings);
router.get('/provider/payouts', providerAuth, PaymentController.getProviderPayouts);
router.post('/provider/payouts', providerAuth, PaymentController.requestPayout);
router.get('/provider/invoices', providerAuth, PaymentController.getProviderInvoices);
router.get('/provider/invoices/:id', providerAuth, PaymentController.getInvoiceById);

export default router;



