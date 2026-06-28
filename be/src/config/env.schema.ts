import { z } from 'zod';

export const envSchema = z
  .object({
    PORT: z.coerce.number().default(8080),
    MONGODB_URI: z.string().optional(),
    URI: z.string().optional(),
    JWT_ACCESS_SECRET: z.string().default('change-me-access-secret'),
    JWT_REFRESH_SECRET: z.string().default('change-me-refresh-secret'),
    JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
    FRONTEND_URL: z.string().url().default('http://localhost:3000'),
    API_BASE_URL: z.string().url().default('http://localhost:8080'),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GOOGLE_CALLBACK_URL: z
      .string()
      .url()
      .default('http://localhost:8080/api/auth/google/callback'),
  })
  .refine((env) => env.MONGODB_URI || env.URI, {
    message: 'MONGODB_URI or URI is required',
  });
