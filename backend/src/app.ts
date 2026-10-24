import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { database as defaultDatabase } from './config/database.js';
import { errorHandler } from './middleware/errorHandler.js';
import { createAuthRouter } from './modules/auth/auth.routes.js';
import type { AuthDatabase } from './modules/auth/auth.service.js';
import { AppError } from './shared/errors.js';

interface AppOptions {
  frontendUrl: string;
  database?: AuthDatabase;
}

export function createApp({ frontendUrl, database = defaultDatabase }: AppOptions) {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: (origin, callback) => callback(null, origin === frontendUrl) }));
  app.use(express.json({ limit: '16kb' }));

  app.get('/health', (_request, response) => {
    response.json({ status: 'ok' });
  });

  app.use('/api/auth', createAuthRouter(database));

  app.use((_request, _response, next) => next(new AppError(404, 'NOT_FOUND', 'Route not found')));
  app.use(errorHandler);
  return app;
}
