
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { database as defaultDatabase } from './config/database.js';
import { parseEnvironment } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { createAuthRouter } from './modules/auth/auth.routes.js';
import type { JwtConfig } from './modules/auth/auth.service.js';
import { AppError } from './shared/errors.js';
import { createVehicleRouter } from './modules/vehicles/vehicle.routes.js';
import type { Prisma } from '@prisma/client';
type AppDatabase = Pick<Prisma.TransactionClient, 'user' | 'vehicle'>;

interface AppOptions {
  frontendUrl: string;
  database?: AppDatabase;
  jwt?: JwtConfig;
}

export function createApp({
  frontendUrl,
  database = defaultDatabase,
  jwt: suppliedJwt,
}: AppOptions) {
  let jwtConfig = suppliedJwt;

  if (!jwtConfig) {
    const environment = parseEnvironment(process.env);
    jwtConfig = {
      secret: environment.JWT_SECRET,
      expiresInSeconds: parseExpiry(environment.JWT_EXPIRES_IN),
    };
  }

  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());


  app.use(
    cors({
      origin: (origin, callback) => {
        const allowedOrigins = [
          frontendUrl,
          'http://localhost:5173',
          'http://localhost:5174',
        ];

        callback(null, !origin || allowedOrigins.includes(origin));
      },
    }),
  );
  app.use(express.json({ limit: '16kb' }));

  app.get('/health', (_request, response) => {
    response.json({ status: 'ok' });
  });

  app.use('/api/auth', createAuthRouter(database, jwtConfig));
  app.use('/api/vehicles', createVehicleRouter(database, jwtConfig));

  app.use((_request, _response, next) => {
    next(new AppError(404, 'NOT_FOUND', 'Route not found'));
  });

  app.use(errorHandler);

  return app;
}

function parseExpiry(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value);

  if (!match) {
    throw new Error('Invalid JWT_EXPIRES_IN configuration');
  }

  const amount = Number(match[1]);
  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
  };

  return amount * multipliers[match[2]];
}
