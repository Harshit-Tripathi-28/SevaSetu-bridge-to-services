import { Router } from 'express';
import { CustomerController } from '../controllers/customer.controller.js';
import { BookingController } from '../controllers/booking.controller.js';
import { PaymentController } from '../controllers/payment.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

// Customer Profile (authenticated)
router.get('/profile', requireAuth, CustomerController.getProfile);
router.patch('/profile', requireAuth, CustomerController.updateProfile);

// Customer Saved Addresses (authenticated)
router.get('/addresses', requireAuth, CustomerController.getAddresses);
router.post('/addresses', requireAuth, CustomerController.createAddress);
router.patch('/addresses/:id', requireAuth, CustomerController.updateAddress);
router.patch('/addresses/:id/primary', requireAuth, CustomerController.setDefaultAddress);
router.delete('/addresses/:id', requireAuth, CustomerController.deleteAddress);

// Phase 4: Service Request Creation & Booking Lifecycle (Customer authenticated)
const customerAuth = [requireAuth, requireRole('CUSTOMER', 'ADMIN')];

router.post('/service-requests', customerAuth, BookingController.createServiceRequest);
router.post('/customer/bookings', customerAuth, BookingController.createServiceRequest);
router.get('/customer/bookings', customerAuth, BookingController.getCustomerBookings);
router.get('/customer/bookings/:id', customerAuth, BookingController.getCustomerBookingById);
router.post('/customer/bookings/:id/cancel', customerAuth, BookingController.cancelCustomerBooking);
router.post('/customer/bookings/:id/reschedule', customerAuth, BookingController.rescheduleCustomerBooking);

// Phase 5: Customer Payments & Invoices
router.get('/customer/payments', customerAuth, PaymentController.getCustomerPayments);
router.get('/customer/invoices', customerAuth, PaymentController.getCustomerInvoices);
router.get('/customer/invoices/:id', customerAuth, PaymentController.getInvoiceById);

export default router;


