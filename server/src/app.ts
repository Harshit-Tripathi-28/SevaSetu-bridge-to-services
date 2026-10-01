import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { config } from './config/index.js';
import { apiRouter } from './routes/index.js';
import { authenticateToken } from './middleware/auth.middleware.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp(): express.Application {
  const app = express();

  // Security and utility middleware
  app.use(helmet());
  app.use(
    cors({
      origin: config.clientUrl,
      credentials: true,
    })
  );
  app.use(cookieParser());
  app.use(
    express.json({
      verify: (req, _res, buf) => {
        (req as unknown as { rawBody?: Buffer }).rawBody = buf;
      },
    })
  );
  app.use(express.urlencoded({ extended: true }));

  if (config.nodeEnv !== 'test') {
    app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'combined'));
  }

  // Resolve user identity for all incoming requests (if valid session cookie or token exists)
  app.use(authenticateToken);

  // API router root
  app.use('/api', apiRouter);

  // Catch-all 404 and Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
