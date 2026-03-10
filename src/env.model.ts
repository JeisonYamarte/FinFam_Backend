import 'dotenv/config';
import { z } from 'zod';

export const envSchema = z
  .object({
    PORT: z.string().min(1, 'PORT is required.').transform(Number),
    ALLOWED_ORIGINS: z
      .string()
      .min(1, 'ALLOWED_ORIGINS is required.')
      .transform((val) => val.split(',').map((origin) => origin.trim())),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required.'),
    JWT_SECRET: z.string().min(1, 'JWT_SECRET is required.'),
    REDIS_HOST: z.string().min(1, 'REDIS_HOST is required.'),
    REDIS_PORT: z.string().min(1, 'REDIS_PORT is required.').transform(Number),
    REDIS_TTL: z.string().min(1, 'REDIS_TTL is required.').transform(Number),
    EMAIL_PASSWORD: z.string().min(1, 'EMAIL_PASSWORD is required.'),
    EMAIL_FROM: z.string().min(1, 'EMAIL_FROM is required.'),
    NODE_ENV: z.enum(['development', 'production']).default('development'),
  })
  .passthrough();

type envType = z.infer<typeof envSchema>;

const envParsed = envSchema.safeParse(process.env);

if (!envParsed.success) {
  console.error('❌ Config validation error:', envParsed.error.format());
  throw new Error('Invalid environment variables');
}

export const envs: envType = {
  PORT: envParsed.data.PORT,
  ALLOWED_ORIGINS: envParsed.data.ALLOWED_ORIGINS,
  DATABASE_URL: envParsed.data.DATABASE_URL,
  JWT_SECRET: envParsed.data.JWT_SECRET,
  REDIS_HOST: envParsed.data.REDIS_HOST,
  REDIS_PORT: envParsed.data.REDIS_PORT,
  REDIS_TTL: envParsed.data.REDIS_TTL,
  EMAIL_PASSWORD: envParsed.data.EMAIL_PASSWORD,
  EMAIL_FROM: envParsed.data.EMAIL_FROM,
  NODE_ENV: envParsed.data.NODE_ENV,
};
