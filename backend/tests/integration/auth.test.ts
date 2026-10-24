import { randomUUID } from 'node:crypto';
import bcrypt from 'bcrypt';
import request from 'supertest';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { database } from '../../src/config/database.js';
import { withTestApp } from '../helpers/testApp.js';

const endpoint = '/api/auth/register';
const registration = () => ({
  name: 'Test Driver',
  email: `registration-${randomUUID()}@example.com`,
  password: 'a-secure-password-123',
});

afterAll(async () => {
  await database.$disconnect();
});

describe('POST /api/auth/register', { concurrent: false }, () => {
  it('persists a normal user with a bcrypt hash and returns only public fields', async () => {
    const input = registration();

    await withTestApp(async ({ app, database: transaction }) => {
      const response = await request(app).post(endpoint).send({
        ...input, name: `  ${input.name}  `, email: `  ${input.email.toUpperCase()}  `,
      });

      expect(response.status).toBe(201);
      const stored = await transaction.user.findUniqueOrThrow({ where: { email: input.email } });
      expect(stored).toMatchObject({ name: input.name, email: input.email, role: 'USER' });
      expect(stored.passwordHash).not.toBe(input.password);
      expect(bcrypt.getRounds(stored.passwordHash)).toBe(12);
      expect(await bcrypt.compare(input.password, stored.passwordHash)).toBe(true);
      expect(response.body).toEqual({
        user: { id: stored.id, name: input.name, email: input.email, role: 'USER' },
      });
      expect(response.headers['cache-control']).toBe('no-store');
    });

    // This lookup occurs outside the test transaction and proves successful tests roll back.
    expect(await database.user.findUnique({ where: { email: input.email } })).toBeNull();
  });

  it.each([
    ['ASCII with surrounding spaces', ` ${'p'.repeat(70)} `],
    ['multibyte characters', '🙂'.repeat(18)],
  ])('accepts a 72-byte password unchanged: %s', async (_label, password) => {
    const input = { ...registration(), password };
    expect(Buffer.byteLength(password, 'utf8')).toBe(72);

    await withTestApp(async ({ app, database: transaction }) => {
      const response = await request(app).post(endpoint).send(input);
      expect(response.status).toBe(201);
      const stored = await transaction.user.findUniqueOrThrow({ where: { email: input.email } });
      expect(await bcrypt.compare(password, stored.passwordHash)).toBe(true);
      if (password !== password.trim()) {
        expect(await bcrypt.compare(password.trim(), stored.passwordHash)).toBe(false);
      }
    });
  });

  it('rejects an existing email after case and whitespace normalization', async () => {
    const input = registration();

    await withTestApp(async ({ app }) => {
      expect((await request(app).post(endpoint).send(input)).status).toBe(201);
      const duplicate = await request(app).post(endpoint).send({
        ...input, email: ` ${input.email.toUpperCase()} `,
      });
      expect(duplicate.status).toBe(409);
      expect(duplicate.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
      // A PostgreSQL unique violation aborts this transaction. Do not query it again.
    });
  });

  const invalidInputs: Array<[string, Record<string, unknown>]> = [
    ['missing name', { name: undefined }],
    ['missing email', { email: undefined }],
    ['missing password', { password: undefined }],
    ['non-string name', { name: 123 }],
    ['non-string email', { email: ['driver@example.com'] }],
    ['non-string password', { password: 123456789012 }],
    ['blank name', { name: '   ' }],
    ['oversized name', { name: 'a'.repeat(101) }],
    ['invalid email', { email: 'not-an-email' }],
    ['oversized email', { email: `${'a'.repeat(243)}@example.com` }],
    ['short password', { password: 'a'.repeat(11) }],
    ['password over 72 ASCII bytes', { password: 'a'.repeat(73) }],
    ['password over 72 UTF-8 bytes', { password: '🙂'.repeat(19) }],
    ['password containing NUL', { password: 'long-password\u0000-value' }],
    ['client-supplied admin role', { role: 'ADMIN' }],
    ['client-supplied id', { id: randomUUID() }],
    ['client-supplied password hash', { passwordHash: 'untrusted-hash' }],
  ];

  it.each(invalidInputs)('rejects %s before persistence', async (_label, override) => {
    await withTestApp(async ({ app, database: transaction }) => {
      const create = vi.spyOn(transaction.user, 'create');
      try {
        const response = await request(app).post(endpoint).send({ ...registration(), ...override });
        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
        expect(create).not.toHaveBeenCalled();
      } finally {
        create.mockRestore();
      }
    });
  });

  it('rejects a missing JSON body', async () => {
    await withTestApp(async ({ app }) => {
      const response = await request(app).post(endpoint).set('Content-Type', 'application/json');
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  it('rejects an array in place of the registration object', async () => {
    await withTestApp(async ({ app }) => {
      const response = await request(app).post(endpoint).send([]);
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  it('rejects a null JSON body', async () => {
    await withTestApp(async ({ app }) => {
      const response = await request(app).post(endpoint)
        .set('Content-Type', 'application/json').send('null');
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_JSON');
    });
  });

  it('rejects a non-JSON body', async () => {
    await withTestApp(async ({ app }) => {
      const response = await request(app).post(endpoint).type('form').send(registration());
      expect(response.status).toBe(415);
      expect(response.body.error.code).toBe('UNSUPPORTED_MEDIA_TYPE');
    });
  });

  it('rejects malformed JSON', async () => {
    await withTestApp(async ({ app }) => {
      const response = await request(app).post(endpoint)
        .set('Content-Type', 'application/json').send('{');
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_JSON');
    });
  });

  it('rejects JSON over the body limit', async () => {
    await withTestApp(async ({ app }) => {
      const response = await request(app).post(endpoint).send({ ...registration(), name: 'a'.repeat(17000) });
      expect(response.status).toBe(413);
      expect(response.body.error.code).toBe('PAYLOAD_TOO_LARGE');
    });
  });

  it('returns a safe error when persistence unexpectedly fails', async () => {
    await withTestApp(async ({ app, database: transaction }) => {
      const create = vi.spyOn(transaction.user, 'create')
        .mockRejectedValueOnce(new Error('Sensitive database connection details'));
      try {
        const response = await request(app).post(endpoint).send(registration());
        expect(response.status).toBe(500);
        expect(response.body).toEqual({
          error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
        });
        expect(create).toHaveBeenCalledOnce();
      } finally {
        create.mockRestore();
      }
    });
  });

  it('rolls back writes and preserves an assertion failure', async () => {
    const input = registration();

    await expect(withTestApp(async ({ app }) => {
      expect((await request(app).post(endpoint).send(input)).status).toBe(201);
      expect.fail('Deliberate test assertion failure');
    })).rejects.toThrow('Deliberate test assertion failure');

    expect(await database.user.findUnique({ where: { email: input.email } })).toBeNull();
  });
});
