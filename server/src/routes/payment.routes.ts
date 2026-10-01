import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

export const paymentRouter = Router();

// Order creation & Checkout verification
paymentRouter.post('/payments/orders', requireAuth, PaymentController.createOrder);
paymentRouter.post('/payments/verify', requireAuth, PaymentController.verifyPayment);
paymentRouter.get('/payments/breakdown/:bookingId', requireAuth, PaymentController.getPaymentBreakdown);
paymentRouter.get('/payments/:id', requireAuth, PaymentController.getPaymentById);

// Public webhook endpoint (server-authoritative HMAC signature verified)
paymentRouter.post('/payments/webhook', PaymentController.handleWebhook);

// Direct invoice route
paymentRouter.get('/invoices/:id', requireAuth, PaymentController.getInvoiceById);

export default paymentRouter;
