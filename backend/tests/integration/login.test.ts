import { randomUUID } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { database } from '../../src/config/database.js';
import { errorHandler } from '../../src/middleware/errorHandler.js';
import { createAuthRateLimit } from '../../src/middleware/rateLimit.js';
import { withTestApp, TEST_JWT_CONFIG } from '../helpers/testApp.js';

const password = 'dummy-password-not-a-user';
const passwordHash = '$2b$12$uF9bgloz6XPNAT39ZxB/2.LOWEmeusqFOY/ApUU1/X7zIwtxEuw96';
const fixtureUser = (transaction: Prisma.TransactionClient) => transaction.user.create({
  data: { name: 'Login Driver', email: `login-${randomUUID()}@example.com`, passwordHash },
});
const signToken = (id: string, options: jwt.SignOptions = {}) => jwt.sign({}, TEST_JWT_CONFIG.secret, {
  algorithm: 'HS256', subject: id, issuer: 'incubyte-dealership', audience: 'incubyte-web', expiresIn: 3600,
  ...options,
});

afterAll(async () => { await database.$disconnect(); });

describe('login and bearer authentication', () => {
  it('logs in with a normalized email, returns only public fields and an expiring token', async () => {
    await withTestApp(async ({ app, database: transaction }) => {
      const user = await fixtureUser(transaction);
      const response = await request(app).post('/api/auth/login').send({ email: ` ${user.email.toUpperCase()} `, password });
      expect(response.status).toBe(200);
      expect(response.body.user).toEqual({ id: user.id, name: user.name, email: user.email, role: 'USER' });
      expect(response.headers['cache-control']).toBe('no-store');
      const decoded = jwt.verify(response.body.token, TEST_JWT_CONFIG.secret, {
        algorithms: ['HS256'], issuer: 'incubyte-dealership', audience: 'incubyte-web',
      });
      expect(decoded).toMatchObject({ sub: user.id, exp: expect.any(Number) });
      const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${response.body.token}`);
      expect(me.status).toBe(200);
      expect(me.body).toEqual({ user: response.body.user });
      expect(me.headers['cache-control']).toBe('no-store');
    });
  });

  it('uses the same 401 response for wrong passwords and unknown accounts', async () => {
    await withTestApp(async ({ app, database: transaction }) => {
      const user = await fixtureUser(transaction);
      const wrong = await request(app).post('/api/auth/login').send({ email: user.email, password: 'incorrect-password' });
      const absent = await request(app).post('/api/auth/login').send({ email: `missing-${randomUUID()}@example.com`, password });
      expect(wrong.status).toBe(401);
      expect(absent.status).toBe(401);
      expect(wrong.body).toEqual(absent.body);
      expect(wrong.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  it.each([
    {}, { email: 'invalid', password }, { email: 'driver@example.com', password: 123 },
    { email: 'driver@example.com', password: 'a'.repeat(73) },
    { email: 'driver@example.com', password, role: 'ADMIN' },
  ])('rejects invalid login input: %j', async (body) => {
    await withTestApp(async ({ app }) => {
      const response = await request(app).post('/api/auth/login').send(body);
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  it('rejects non-JSON login input', async () => {
    await withTestApp(async ({ app }) => {
      expect((await request(app).post('/api/auth/login').type('form').send({ email: 'driver@example.com', password })).status).toBe(415);
    });
  });

  it.each([undefined, 'Basic abc', 'Bearer invalid-token', 'Bearer'])('rejects a missing or malformed bearer token: %s', async (authorization) => {
    await withTestApp(async ({ app }) => {
      const call = request(app).get('/api/auth/me');
      if (authorization) call.set('Authorization', authorization);
      const response = await call;
      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  it.each([
    ['expired', { expiresIn: -1 }], ['wrong issuer', { issuer: 'another-app' }],
    ['wrong audience', { audience: 'another-client' }], ['wrong algorithm', { algorithm: 'HS384' }],
  ] satisfies Array<[string, jwt.SignOptions]>)('rejects a token with %s', async (_label, options) => {
    await withTestApp(async ({ app, database: transaction }) => {
      const user = await fixtureUser(transaction);
      const response = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${signToken(user.id, options)}`);
      expect(response.status).toBe(401);
    });
  });

  it('rejects tokens signed with another key and tokens for deleted users', async () => {
    await withTestApp(async ({ app }) => {
      const wrongKey = jwt.sign({}, 'untrusted-secret', { subject: randomUUID(), algorithm: 'HS256' });
      expect((await request(app).get('/api/auth/me').set('Authorization', `Bearer ${wrongKey}`)).status).toBe(401);
      expect((await request(app).get('/api/auth/me').set('Authorization', `Bearer ${signToken(randomUUID())}`)).status).toBe(401);
    });
  });

  it('loads current role from PostgreSQL instead of trusting a token role claim', async () => {
    await withTestApp(async ({ app, database: transaction }) => {
      const user = await fixtureUser(transaction);
      const token = jwt.sign({ role: 'ADMIN' }, TEST_JWT_CONFIG.secret, {
        algorithm: 'HS256', subject: user.id, issuer: 'incubyte-dealership', audience: 'incubyte-web', expiresIn: 3600,
      });
      const response = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(200);
      expect(response.body.user.role).toBe('USER');
    });
  });

  it('does not disguise unexpected database errors as invalid credentials', async () => {
    await withTestApp(async ({ app, database: transaction }) => {
      const lookup = vi.spyOn(transaction.user, 'findUnique').mockRejectedValueOnce(new Error('private connection details'));
      try {
        const response = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${signToken(randomUUID())}`);
        expect(response.status).toBe(500);
        expect(response.body.error.code).toBe('INTERNAL_ERROR');
        expect(response.text).not.toContain('private connection details');
      } finally { lookup.mockRestore(); }
    });
  });
});

describe('authentication rate limiting', () => {
  it('limits repeated requests, ignores spoofed forwarding headers, and recovers after the window', async () => {
    const now = vi.spyOn(Date, 'now').mockReturnValue(1000);
    const app = express();
    app.use(createAuthRateLimit({ maxRequests: 2, windowMs: 1000 }));
    app.get('/', (_req, res) => { res.json({ ok: true }); });
    app.use(errorHandler);
    try {
      expect((await request(app).get('/')).status).toBe(200);
      expect((await request(app).get('/')).status).toBe(200);
      const limited = await request(app).get('/').set('X-Forwarded-For', '203.0.113.5');
      expect(limited.status).toBe(429);
      expect(limited.body.error.code).toBe('RATE_LIMITED');
      expect(Number(limited.headers['retry-after'])).toBeGreaterThan(0);
      now.mockReturnValue(2001);
      expect((await request(app).get('/')).status).toBe(200);
    } finally { now.mockRestore(); }
  });
});
