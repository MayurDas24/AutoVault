
import type { RequestHandler } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';

import type {
  AuthDatabase,
  JwtConfig,
} from '../modules/auth/auth.service.js';
import { createAuthService } from '../modules/auth/auth.service.js';
import { AppError } from '../shared/errors.js';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthenticatedUser;
    }
  }
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function createAuthenticateMiddleware(
  database: AuthDatabase,
  jwtConfig: JwtConfig,
): RequestHandler {
  const authService = createAuthService(database, jwtConfig);

  return async (request, _response, next) => {
    try {
      const authorization = request.get('authorization');

      // Require a Bearer token; never accept tokens from query parameters.
      const match = authorization
        ? /^Bearer\s+(\S+)$/i.exec(authorization)
        : null;

      if (!match) {
        throw new AppError(
          401,
          'UNAUTHORIZED',
          'Authentication required',
        );
      }

      const token = match[1];

      let decoded: string | JwtPayload;

      try {
        decoded = jwt.verify(token, jwtConfig.secret, {
          algorithms: ['HS256'],
          issuer: 'incubyte-dealership',
          audience: 'incubyte-web',
        });
      } catch (error) {
        // Invalid, expired, malformed, or incorrectly signed JWTs
        // are authentication failures, not internal server errors.
        if (error instanceof jwt.JsonWebTokenError) {
          throw new AppError(
            401,
            'UNAUTHORIZED',
            'Invalid or expired authentication token',
          );
        }

        throw error;
      }

      // This application issues tokens with the user's UUID as `sub`.
      if (
        typeof decoded === 'string' ||
        typeof decoded.sub !== 'string' ||
        !UUID_REGEX.test(decoded.sub)
      ) {
        throw new AppError(
          401,
          'UNAUTHORIZED',
          'Invalid authentication token',
        );
      }

      // Load the user from the database rather than trusting role or
      // profile information supplied by the token.
      const user = await authService.getCurrentUser(decoded.sub);

      request.authUser = user;
      next();
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
        return;
      }

      // Forward unexpected database/infrastructure errors to the
      // central error handler so they become 500 responses, not 401s.
      next(error);
    }
  };
}
