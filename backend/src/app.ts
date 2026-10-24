import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorHandler.js';
import { AppError } from './shared/errors.js';

interface AppOptions {
  frontendUrl: string;
}

export function createApp({ frontendUrl }: AppOptions) {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: (origin, callback) => callback(null, origin === frontendUrl) }));
  app.use(express.json({ limit: '16kb' }));

  app.get('/health', (_request, response) => {
    response.json({ status: 'ok' });
  });

  app.use((_request, _response, next) => next(new AppError(404, 'NOT_FOUND', 'Route not found')));
  app.use(errorHandler);
  return app;
}
