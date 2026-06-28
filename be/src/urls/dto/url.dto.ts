import { z } from 'zod';

const optionalString = (schema: z.ZodString) =>
  z.preprocess(
    (value) => (value === '' || value === undefined ? undefined : value),
    schema.optional(),
  );

const shortCodeSchema = z
  .string()
  .trim()
  .min(4, 'Short code must contain at least 4 characters')
  .max(32, 'Short code cannot exceed 32 characters')
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    'Short code may only contain letters, numbers, underscores, and dashes',
  );

export const createUrlSchema = z.object({
  originalUrl: z.string().url('Enter a valid URL'),
  title: optionalString(z.string().trim().max(80)),
  customCode: optionalString(shortCodeSchema),
});

export const createGuestUrlSchema = z.object({
  originalUrl: z.string().url('Enter a valid URL'),
});

export const updateUrlSchema = z.object({
  originalUrl: z.string().url('Enter a valid URL').optional(),
  title: optionalString(z.string().trim().max(80)),
  isActive: z.boolean().optional(),
  resetClicks: z.boolean().optional(),
});

export type CreateUrlDto = z.infer<typeof createUrlSchema>;
export type CreateGuestUrlDto = z.infer<typeof createGuestUrlSchema>;
export type UpdateUrlDto = z.infer<typeof updateUrlSchema>;
