import { Router } from 'express';
import { healthRouter } from './health.routes.js';
import { authRouter } from './auth.routes.js';
import customerRouter from './customer.routes.js';
import catalogRouter from './catalog.routes.js';
import providerRouter from './provider.routes.js';
import paymentRouter from './payment.routes.js';

export const apiRouter = Router();

// Mount system routes
apiRouter.use(healthRouter);
apiRouter.use(authRouter);

// Mount domain routes
apiRouter.use(catalogRouter);
apiRouter.use(customerRouter);
apiRouter.use(providerRouter);
apiRouter.use(paymentRouter);

