
import type { RequestHandler } from 'express';
import { AppError } from '../shared/errors.js';

export const authorizeAdmin: RequestHandler = (
  request,
  _response,
  next,
) => {
  if (!request.authUser) {
    next(new AppError(401, 'UNAUTHORIZED', 'Authentication required'));
    return;
  }

  if (request.authUser.role !== 'ADMIN') {
    next(new AppError(403, 'FORBIDDEN', 'Admin access required'));
    return;
  }

  next();
};
