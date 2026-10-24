import { randomUUID } from 'node:crypto';
import type { Prisma, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createApp } from '../../src/app.js';
import { database } from '../../src/config/database.js';

export const TEST_JWT_CONFIG = { secret: 'test-only-secret-for-incubyte-at-least-32-characters', expiresInSeconds: 3600 };
export const TEST_PASSWORD = 'test-password-123';
let passwordHash: Promise<string> | undefined;

export async function testUser(transaction: Prisma.TransactionClient, role: UserRole = 'USER') {
  passwordHash ??= bcrypt.hash(TEST_PASSWORD, 12);
  const user = await transaction.user.create({ data: {
    name: 'Test Driver', email: `test-${randomUUID()}@example.com`, role,
    passwordHash: await passwordHash,
  } });
  const token = jwt.sign({}, TEST_JWT_CONFIG.secret, {
    subject: user.id, algorithm: 'HS256', expiresIn: TEST_JWT_CONFIG.expiresInSeconds,
    issuer: 'incubyte-dealership', audience: 'incubyte-web',
  });
  return { user, token };
}

interface TestContext {
  app: ReturnType<typeof createApp>;
  database: Prisma.TransactionClient;
}

// Every test owns one transaction. No cleanup deletes, truncation, or schema changes.
export async function withTestApp<T>(run: (context: TestContext) => Promise<T>): Promise<T> {
  const rollback = new Error('Rollback successful test transaction');
  let result!: T;

  try {
    await database.$transaction(async (transaction) => {
      const options = { frontendUrl: 'http://localhost:5173', database: transaction, jwt: TEST_JWT_CONFIG };
      result = await run({ app: createApp(options), database: transaction });
      throw rollback;
    }, { timeout: 15000 });
  } catch (error) {
    // Assertion failures and database errors must still fail the test.
    if (error !== rollback) throw error;
  }

  return result;
}
