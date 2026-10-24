import type { RequestHandler } from 'express';
import { AppError } from '../../shared/errors.js';
import type { createAuthService } from './auth.service.js';
import { registrationSchema } from './auth.validation.js';

export function createRegisterController(service: ReturnType<typeof createAuthService>): RequestHandler {
  return async (request, response) => {
    response.set('Cache-Control', 'no-store');
    // Checking the header also handles an empty JSON request, which has no parsed body.
    const mediaType = request.get('content-type')?.split(';')[0]?.trim().toLowerCase();
    if (mediaType !== 'application/json') {
      throw new AppError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Content-Type must be application/json');
    }
    const input = registrationSchema.parse(request.body);
    const user = await service.register(input);
    response.status(201).json({ user });
  };
}
