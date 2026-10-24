import { z } from 'zod';

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  DATABASE_URL: z.url().refine((value) => /^postgres(ql)?:\/\//.test(value)),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().regex(/^\d+[smhd]$/).default('1h'),
  FRONTEND_URL: z.url().refine((value) => /^https?:\/\//.test(value))
    .default('http://localhost:5173'),
});

export function parseEnvironment(source: NodeJS.ProcessEnv) {
  return environmentSchema.parse(source);
}
