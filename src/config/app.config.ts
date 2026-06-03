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
    REDIS_URL: z.string().url('REDIS_URL must be a valid URL.').optional(),
    REDIS_HOST: z.string().min(1, 'REDIS_HOST is required.').optional(),
    REDIS_PORT: z
      .string()
      .min(1, 'REDIS_PORT is required.')
      .transform(Number)
      .optional(),
    REDIS_TTL: z.string().min(1, 'REDIS_TTL is required.').transform(Number),
    EMAIL_PASSWORD: z.string().optional(),
    EMAIL_FROM: z.string().min(1, 'EMAIL_FROM is required.'),
    EMAIL_PROVIDER: z.enum(['brevo', 'gmail']).default('brevo'),
    BREVO_KEY_API: z.string().min(1, 'BREVO_KEY_API is required.'),
    FRONTEND_URL: z.string().min(1, 'FRONTEND_URL is required.'),
    NODE_ENV: z.enum(['development', 'production']).default('development'),

    // Cloudinary — Settings > API Keys en tu dashboard de Cloudinary
    CLOUDINARY_CLOUD_NAME: z
      .string()
      .min(1, 'CLOUDINARY_CLOUD_NAME is required.'),
    CLOUDINARY_API_KEY: z.string().min(1, 'CLOUDINARY_API_KEY is required.'),
    CLOUDINARY_API_SECRET: z
      .string()
      .min(1, 'CLOUDINARY_API_SECRET is required.'),
  })
  .superRefine((data, ctx) => {
    const hasRedisUrl = !!data.REDIS_URL;
    const hasHostAndPort = !!data.REDIS_HOST && data.REDIS_PORT !== undefined;

    if (!hasRedisUrl && !hasHostAndPort) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Provide REDIS_URL or both REDIS_HOST and REDIS_PORT environment variables.',
        path: ['REDIS_URL'],
      });
    }

    if (data.EMAIL_PROVIDER === 'gmail' && !data.EMAIL_PASSWORD) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'EMAIL_PASSWORD is required when EMAIL_PROVIDER=gmail.',
        path: ['EMAIL_PASSWORD'],
      });
    }

    if (data.EMAIL_PROVIDER === 'brevo' && !data.BREVO_KEY_API) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'BREVO_KEY_API is required when EMAIL_PROVIDER=brevo.',
        path: ['BREVO_KEY_API'],
      });
    }
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
  REDIS_URL: envParsed.data.REDIS_URL,
  REDIS_HOST: envParsed.data.REDIS_HOST,
  REDIS_PORT: envParsed.data.REDIS_PORT,
  REDIS_TTL: envParsed.data.REDIS_TTL,
  EMAIL_PASSWORD: envParsed.data.EMAIL_PASSWORD,
  EMAIL_FROM: envParsed.data.EMAIL_FROM,
  EMAIL_PROVIDER: envParsed.data.EMAIL_PROVIDER,
  BREVO_KEY_API: envParsed.data.BREVO_KEY_API,
  FRONTEND_URL: envParsed.data.FRONTEND_URL,
  NODE_ENV: envParsed.data.NODE_ENV,
  CLOUDINARY_CLOUD_NAME: envParsed.data.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: envParsed.data.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: envParsed.data.CLOUDINARY_API_SECRET,
};
