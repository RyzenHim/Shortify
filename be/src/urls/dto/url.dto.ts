import { z } from 'zod';

const normalizeUrl = (value: unknown) => {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return trimmed;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
};

const urlField = z.preprocess(
  normalizeUrl,
  z.string().url('Enter a valid URL'),
);

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
  originalUrl: urlField,
  title: optionalString(z.string().trim().max(80)),
  customCode: optionalString(shortCodeSchema),
});

export const createGuestUrlSchema = z.object({
  originalUrl: urlField,
});

export const updateUrlSchema = z.object({
  originalUrl: urlField.optional(),
  title: optionalString(z.string().trim().max(80)),
  isActive: z.boolean().optional(),
  resetClicks: z.boolean().optional(),
});

export type CreateUrlDto = z.infer<typeof createUrlSchema>;
export type CreateGuestUrlDto = z.infer<typeof createGuestUrlSchema>;
export type UpdateUrlDto = z.infer<typeof updateUrlSchema>;
