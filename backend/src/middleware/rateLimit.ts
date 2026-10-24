
import type { RequestHandler } from 'express';

interface AuthRateLimitOptions {
  maxRequests?: number;
  windowMs?: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export function createAuthRateLimit(
  options: AuthRateLimitOptions = {},
): RequestHandler {
  const maxRequests = options.maxRequests ?? 10;
  const windowMs = options.windowMs ?? 15 * 60 * 1000;

  if (
    !Number.isInteger(maxRequests) ||
    maxRequests < 1 ||
    !Number.isFinite(windowMs) ||
    windowMs < 1
  ) {
    throw new Error('Invalid authentication rate-limit configuration');
  }

  const clients = new Map<string, RateLimitEntry>();

  return (request, response, next) => {
    const now = Date.now();
    const key = request.ip ?? request.socket.remoteAddress ?? 'unknown';

    let entry = clients.get(key);

    if (!entry || now >= entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      clients.set(key, entry);
    }

    entry.count += 1;

    response.set('Cache-Control', 'no-store');
    response.set(
      'RateLimit-Remaining',
      String(Math.max(0, maxRequests - entry.count)),
    );

    if (entry.count > maxRequests) {
      response.set(
        'Retry-After',
        String(Math.max(1, Math.ceil((entry.resetAt - now) / 1000))),
      );

      response.status(429).json({
        error: {
         code: 'RATE_LIMITED',
          message: 'Too many authentication attempts. Please try again later.',
        },
      });
      return;
    }

    next();
  };
}
