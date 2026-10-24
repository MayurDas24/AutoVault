import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';
import { createApp } from '../../src/app.js';
import { parseEnvironment } from '../../src/config/env.js';

const options = { frontendUrl: 'http://localhost:5173' };

describe('Express application', () => {
  it('serves a health response with security headers', async () => {
    const response = await request(createApp(options)).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-powered-by']).toBeUndefined();
  });

  it('returns a consistent JSON response for missing routes', async () => {
    const response = await request(createApp(options)).get('/missing');
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
  });

  it('allows only the configured frontend origin', async () => {
    const app = createApp(options);
    const allowed = await request(app).get('/health').set('Origin', options.frontendUrl);
    const untrusted = await request(app).get('/health').set('Origin', 'https://untrusted.example');
    expect(allowed.headers['access-control-allow-origin']).toBe(options.frontendUrl);
    expect(untrusted.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('returns JSON for malformed request bodies', async () => {
    const response = await request(createApp(options)).post('/missing')
      .set('Content-Type', 'application/json').send('{');
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: { code: 'INVALID_JSON', message: 'Malformed JSON body' } });
  });

  it('limits JSON body size', async () => {
    const response = await request(createApp(options)).post('/missing').send({ value: 'x'.repeat(17000) });
    expect(response.status).toBe(413);
    expect(response.body.error.code).toBe('PAYLOAD_TOO_LARGE');
  });
});

describe('environment validation', () => {
  const valid = {
    DATABASE_URL: 'postgresql://user:password@localhost:5433/dealership',
    JWT_SECRET: 's'.repeat(64),
  };

  it('applies development defaults', () => {
    expect(parseEnvironment(valid)).toMatchObject({ NODE_ENV: 'development', PORT: 5000 });
  });

  it.each([
    { DATABASE_URL: '' },
    { DATABASE_URL: 'file:./database.db' },
    { JWT_SECRET: 'short' },
    { JWT_SECRET: 'replace-with-a-random-secret-of-at-least-32-characters' },
    { PORT: 'not-a-port' },
    { PORT: '65536' },
    { NODE_ENV: 'invalid' },
    { FRONTEND_URL: 'not-a-url' },
  ])('fails fast on invalid configuration: %j', (override) => {
    expect(() => parseEnvironment({ ...valid, ...override })).toThrow(ZodError);
  });
});
