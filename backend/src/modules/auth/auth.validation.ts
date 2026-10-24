import { z } from 'zod';

export const registrationSchema = z.strictObject({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
  // bcrypt truncates beyond 72 UTF-8 bytes. Passwords must never be trimmed.
  password: z.string().min(12)
    .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'Password must be at most 72 UTF-8 bytes')
    .refine((value) => !value.includes('\0'), 'Password must not contain NUL'),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;
