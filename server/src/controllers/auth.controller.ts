import type { Request, Response } from 'express';
import { AuthService, AuthError } from '../services/auth.service.js';
import { config } from '../config/index.js';

export class AuthController {
  /**
   * POST /api/auth/register
   * Registers a new account and establishes an authenticated HTTP-only session.
   */
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { user, token } = await AuthService.register(req.body);

      // Establish server-controlled HTTP-only authentication cookie
      res.cookie(config.cookieName, token, config.cookieOptions);

      res.status(201).json({
        success: true,
        message: 'Account registered successfully.',
        data: { user },
      });
    } catch (error) {
      if (error instanceof AuthError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
        return;
      }

      console.error('[AuthController.register] Unexpected failure:', error);
      res.status(500).json({
        success: false,
        message: 'An unexpected error occurred during account registration.',
      });
    }
  }

  /**
   * POST /api/auth/login
   * Authenticates credentials, verifies account status, and issues HTTP-only cookie.
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { user, token } = await AuthService.login(req.body);

      // Establish server-controlled HTTP-only authentication cookie
      res.cookie(config.cookieName, token, config.cookieOptions);

      res.status(200).json({
        success: true,
        message: 'Authentication successful.',
        data: { user },
      });
    } catch (error) {
      if (error instanceof AuthError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
        return;
      }

      console.error('[AuthController.login] Unexpected failure:', error);
      res.status(500).json({
        success: false,
        message: 'An unexpected error occurred during authentication.',
      });
    }
  }

  /**
   * POST /api/auth/logout
   * Invalidates and clears the server-side authentication cookie.
   */
  static async logout(_req: Request, res: Response): Promise<void> {
    res.clearCookie(config.cookieName, {
      httpOnly: config.cookieOptions.httpOnly,
      secure: config.cookieOptions.secure,
      sameSite: config.cookieOptions.sameSite,
      path: config.cookieOptions.path,
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  }

  /**
   * GET /api/auth/me
   * Returns current authenticated user context.
   */
  static async getCurrentUser(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'No active authenticated session found.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { user: req.user },
    });
  }

  /**
   * GET /api/auth/protected (Section 14 verification)
   */
  static async protectedTest(req: Request, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      message: 'Authenticated verification route reached successfully.',
      data: { user: req.user },
    });
  }

  /**
   * GET /api/auth/provider-only (Section 14 verification)
   */
  static async providerOnlyTest(req: Request, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      message: 'Provider-only role authorization verified.',
      data: { user: req.user },
    });
  }

  /**
   * GET /api/auth/admin-only (Section 14 verification)
   */
  static async adminOnlyTest(req: Request, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      message: 'Admin-only role authorization verified.',
      data: { user: req.user },
    });
  }
}
