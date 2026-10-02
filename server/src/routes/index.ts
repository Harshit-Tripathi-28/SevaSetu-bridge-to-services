import { Router } from 'express';
import { healthRouter } from './health.routes.js';
import { authRouter } from './auth.routes.js';
import customerRouter from './customer.routes.js';
import catalogRouter from './catalog.routes.js';
import providerRouter from './provider.routes.js';
import paymentRouter from './payment.routes.js';
import reviewRouter from './review.routes.js';
import conversationRouter from './conversation.routes.js';
import notificationRouter from './notification.routes.js';
import rebookingRouter from './rebooking.routes.js';
import reportRouter from './report.routes.js';
import adminRouter from './admin.routes.js';
import { aiRouter } from './ai.routes.js';

export const apiRouter = Router();

// Mount system routes
apiRouter.use(healthRouter);
apiRouter.use(authRouter);

// Mount domain routes
apiRouter.use(catalogRouter);
apiRouter.use(customerRouter);
apiRouter.use(providerRouter);
apiRouter.use(paymentRouter);
apiRouter.use(reviewRouter);
apiRouter.use(conversationRouter);
apiRouter.use(notificationRouter);
apiRouter.use(rebookingRouter);
apiRouter.use(reportRouter);
apiRouter.use(adminRouter);
apiRouter.use(aiRouter);


