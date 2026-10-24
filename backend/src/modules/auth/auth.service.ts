import { Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';
import { AppError } from '../../shared/errors.js';
import type { RegistrationInput } from './auth.validation.js';

export type AuthDatabase = Pick<Prisma.TransactionClient, 'user'>;

export function createAuthService(database: AuthDatabase) {
  return {
    async register(input: RegistrationInput) {
      const passwordHash = await bcrypt.hash(input.password, 12);
      try {
        return await database.user.create({
          data: { name: input.name, email: input.email, passwordHash, role: 'USER' },
          select: { id: true, name: true, email: true, role: true },
        });
      } catch (error) {
        // Enforce uniqueness at INSERT, including competing requests, not a check-then-create query.
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          throw new AppError(409, 'EMAIL_ALREADY_EXISTS', 'An account with this email already exists');
        }
        throw error;
      }
    },
  };
}
