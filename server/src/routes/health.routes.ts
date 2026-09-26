import { Router } from 'express';
import type { Request, Response } from 'express';
import type { ApiResponse, HealthStatus } from '@sevasetu/shared';
import { config } from '../config/index.js';
import { checkDatabaseConnection } from '../config/database.js';

export const healthRouter = Router();

healthRouter.get('/health', async (_req: Request, res: Response<ApiResponse<HealthStatus>>) => {
  const dbHealth = await checkDatabaseConnection();
  const isHealthy = dbHealth.connected;

  const healthData: HealthStatus = {
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: config.nodeEnv,
    service: 'sevasetu-api',
    version: '1.0.0',
    database: dbHealth,
  };

  res.status(200).json({
    success: true,
    data: healthData,
    message: isHealthy
      ? 'All systems fully operational'
      : 'Service operational with degraded components: PostgreSQL is not connected',
  });
});
