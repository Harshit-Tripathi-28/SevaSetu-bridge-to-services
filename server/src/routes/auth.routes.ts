import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthController } from '../controllers/auth.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { config } from '../config/index.js';

export const authRouter = Router();

// Production rate limiter for authentication attempts (protects against brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.nodeEnv === 'test' ? 1000 : 30, // Relaxed in test mode
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again in 15 minutes.',
  },
});

// Public authentication endpoints
authRouter.post('/auth/register', authLimiter, AuthController.register);
authRouter.post('/auth/login', authLimiter, AuthController.login);
authRouter.post('/auth/logout', AuthController.logout);
authRouter.get('/auth/me', AuthController.getCurrentUser);

// Infrastructure verification endpoints (Section 14)
authRouter.get('/auth/protected', requireAuth, AuthController.protectedTest);
authRouter.get('/auth/provider-only', requireAuth, requireRole('PROVIDER'), AuthController.providerOnlyTest);
authRouter.get('/auth/admin-only', requireAuth, requireRole('ADMIN'), AuthController.adminOnlyTest);
