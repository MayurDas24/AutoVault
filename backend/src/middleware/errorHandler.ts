import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../shared/errors.js';

export const errorHandler: ErrorRequestHandler = (error: unknown, _request, response, next) => {
  if (response.headersSent) {
    next(error);
    return;
  }

  if (error instanceof AppError) {
    response.status(error.status).json({ error: { code: error.code, message: error.message } });
    return;
  }

  if (error instanceof ZodError) {
    response.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid request body' } });
    return;
  }

  if (typeof error === 'object' && error !== null && 'type' in error) {
    if (error.type === 'charset.unsupported' || error.type === 'encoding.unsupported') {
      response.status(415).json({ error: { code: 'UNSUPPORTED_MEDIA_TYPE', message: 'Unsupported request encoding' } });
      return;
    }
    if (error.type === 'entity.parse.failed') {
      response.status(400).json({ error: { code: 'INVALID_JSON', message: 'Malformed JSON body' } });
      return;
    }
    if (error.type === 'entity.too.large') {
      response.status(413).json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large' } });
      return;
    }
  }

  // Invalid compressed request bodies originate in zlib, without a parser error type.
  if (error instanceof Error && 'status' in error && error.status === 400 && 'code' in error
    && (error.code === 'Z_DATA_ERROR' || error.code === 'Z_BUF_ERROR')) {
    response.status(400).json({ error: { code: 'INVALID_JSON', message: 'Malformed JSON body' } });
    return;
  }

  // Never expose database errors, request bodies, passwords, or stack traces.
  response.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } });
};
