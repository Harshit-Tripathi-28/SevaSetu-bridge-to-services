import type { Request, Response, NextFunction } from 'express';
import type { ApiResponse } from '@sevasetu/shared';
import { config } from '../config/index.js';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response<ApiResponse<never>>,
  _next: NextFunction
): void {
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;

  const response: ApiResponse<never> = {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred',
      ...(config.nodeEnv === 'development' ? { details: err.stack } : {}),
    },
  };

  res.status(statusCode).json(response);
}

