import type { Request, Response } from 'express';
import type { ApiResponse } from '@sevasetu/shared';

export function notFoundHandler(req: Request, res: Response<ApiResponse<never>>): void {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Resource not found at ${req.method} ${req.originalUrl}`,
    },
  });
}
