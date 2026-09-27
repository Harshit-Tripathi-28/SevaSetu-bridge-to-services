import type { Request, Response, NextFunction } from 'express';
import type { AuthUser, UserRole } from '@sevasetu/shared';
import { config } from '../config/index.js';
import { verifyAuthToken } from '../utils/jwt.js';
import { AuthService } from '../services/auth.service.js';

// Extend Express Request interface with authenticated user context
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Resolves authentication token from HTTP-only cookie or Authorization header.
 * Attaches verified user context to request if valid.
 */
export async function authenticateToken(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let token: string | undefined = req.cookies?.[config.cookieName];

    // Fallback to Bearer token header if cookie is absent (useful for API testing)
    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] && /^Bearer$/i.test(parts[0]) && parts[1]) {
        token = parts[1];
      }
    }

    if (!token) {
      return next();
    }

    const payload = verifyAuthToken(token);
    if (!payload || !payload.userId) {
      return next();
    }

    const user = await AuthService.getUserById(payload.userId);
    if (user && user.status === 'ACTIVE') {
      req.user = user;
    }

    next();
  } catch {
    next();
  }
}

/**
 * Enforces that a valid authenticated user context exists.
 * Returns 401 Unauthorized if unauthenticated.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required. Please log in to proceed.',
    });
    return;
  }
  next();
}

/**
 * Enforces Role-Based Access Control (RBAC).
 * Returns 401 if unauthenticated, 403 Forbidden if user's role is not authorized.
 */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in to access this area.',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Access denied: You do not possess the required role permissions for this endpoint.',
      });
      return;
    }

    next();
  };
}
