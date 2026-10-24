
import { Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AppError } from '../../shared/errors.js';
import type {
  LoginInput,
  RegistrationInput,
} from './auth.validation.js';

export type AuthDatabase = Pick<Prisma.TransactionClient, 'user'>;

export interface JwtConfig {
  secret: string;
  expiresInSeconds: number;
}

export function createAuthService(
  database: AuthDatabase,
  jwtConfig: JwtConfig,
) {
  return {
    async register(input: RegistrationInput) {
      const passwordHash = await bcrypt.hash(input.password, 12);

      try {
        return await database.user.create({
          data: {
            name: input.name,
            email: input.email,
            passwordHash,
            role: 'USER',
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          throw new AppError(
            409,
            'EMAIL_ALREADY_EXISTS',
            'An account with this email already exists',
          );
        }

        throw error;
      }
    },

    async login(input: LoginInput) {
      const user = await database.user.findUnique({
        where: { email: input.email },
      });

      if (
        !user ||
        !(await bcrypt.compare(input.password, user.passwordHash))
      ) {
        throw new AppError(
          401,
          'INVALID_CREDENTIALS',
          'Invalid email or password',
        );
      }

      const token = jwt.sign({}, jwtConfig.secret, {
        subject: user.id,
        algorithm: 'HS256',
        expiresIn: jwtConfig.expiresInSeconds,
        issuer: 'incubyte-dealership',
        audience: 'incubyte-web',
      });

      return {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      };
    },

    async getCurrentUser(userId: string) {
      const user = await database.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });

      if (!user) {
        throw new AppError(
          401,
          'UNAUTHORIZED',
          'Authenticated user no longer exists',
        );
      }

      return user;
    },
  };
}
