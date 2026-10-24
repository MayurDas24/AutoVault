
import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(12, 'Password must contain at least 12 characters')
  .refine(
    (value) => Buffer.byteLength(value, 'utf8') <= 72,
    'Password must not exceed 72 UTF-8 bytes',
  )
  .refine(
    (value) => !value.includes('\0'),
    'Password must not contain NUL characters',
  );

const loginPasswordSchema = z
  .string()
  .min(1, 'Password is required')
  .refine(
    (value) => Buffer.byteLength(value, 'utf8') <= 72,
    'Password must not exceed 72 UTF-8 bytes',
  )
  .refine(
    (value) => !value.includes('\0'),
    'Password must not contain NUL characters',
  );

export const registrationSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: z
      .string()
      .trim()
      .email()
      .max(254)
      .transform((value) => value.toLowerCase()),
    password: passwordSchema,
  })
  .strict();

export const loginSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email()
      .max(254)
      .transform((value) => value.toLowerCase()),
    password: loginPasswordSchema,
  })
  .strict();

export type RegistrationInput = z.infer<typeof registrationSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
