
import type { RequestHandler } from 'express';
import { AppError } from '../../shared/errors.js';
import type { createAuthService } from './auth.service.js';
import {
  loginSchema,
  registrationSchema,
} from './auth.validation.js';

type AuthService = ReturnType<typeof createAuthService>;

function requireJson(request: Parameters<RequestHandler>[0]) {
  const mediaType = request
    .get('content-type')
    ?.split(';')[0]
    ?.trim()
    .toLowerCase();

  if (mediaType !== 'application/json') {
    throw new AppError(
      415,
      'UNSUPPORTED_MEDIA_TYPE',
      'Content-Type must be application/json',
    );
  }
}

export function createRegisterController(
  service: AuthService,
): RequestHandler {
  return async (request, response) => {
    response.set('Cache-Control', 'no-store');
    requireJson(request);

    const input = registrationSchema.parse(request.body);
    const user = await service.register(input);

    response.status(201).json({ user });
  };
}

export function createLoginController(
  service: AuthService,
): RequestHandler {
  return async (request, response) => {
    response.set('Cache-Control', 'no-store');
    requireJson(request);

    const input = loginSchema.parse(request.body);
    const result = await service.login(input);

    response.status(200).json(result);
  };
}

export const getCurrentUserController: RequestHandler = (
  request,
  response,
  next,
) => {
  response.set('Cache-Control', 'no-store');

  if (!request.authUser) {
    next(new AppError(401, 'UNAUTHORIZED', 'Authentication required'));
    return;
  }

  response.status(200).json({ user: request.authUser });
};
