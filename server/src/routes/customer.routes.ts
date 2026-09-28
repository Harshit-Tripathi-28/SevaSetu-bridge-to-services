import { Router } from 'express';
import { CustomerController } from '../controllers/customer.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

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

export default router;
