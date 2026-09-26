import { Router } from 'express';
import { healthRouter } from './health.routes.js';

export const apiRouter = Router();

// Mount system routes
apiRouter.use(healthRouter);
