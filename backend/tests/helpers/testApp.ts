import type { Prisma } from '@prisma/client';
import { createApp } from '../../src/app.js';
import { database } from '../../src/config/database.js';

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
      const options = { frontendUrl: 'http://localhost:5173', database: transaction };
      result = await run({ app: createApp(options), database: transaction });
      throw rollback;
    }, { timeout: 15000 });
  } catch (error) {
    // Assertion failures and database errors must still fail the test.
    if (error !== rollback) throw error;
  }

  return result;
}
