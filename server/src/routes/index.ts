import { Router } from 'express';
import { healthRouter } from './health.routes.js';
import { authRouter } from './auth.routes.js';

export const apiRouter = Router();

// Mount system routes
apiRouter.use(healthRouter);
apiRouter.use(authRouter);
