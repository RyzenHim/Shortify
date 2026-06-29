import { z } from "zod";

export function normalizeUrlInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

// Checks the URL has a real-looking domain (at least one dot, valid TLD chars)
function hasValidDomain(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    // Must have a dot and at least 2-char TLD, no consecutive dots, no trailing dot
    return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i.test(
      hostname,
    );
  } catch {
    return false;
  }
}

export const destinationUrlField = z
  .string()
  .min(1, "Enter a destination URL")
  .transform((val) => normalizeUrlInput(val))
  .pipe(
    z
      .string()
      .min(1, "Enter a destination URL")
      .url("Enter a valid URL — e.g. https://example.com")
      .refine((val) => {
        try {
          const { protocol } = new URL(val);
          return protocol === "http:" || protocol === "https:";
        } catch {
          return false;
        }
      }, "Only http:// and https:// URLs are supported")
      .refine(hasValidDomain, "Enter a valid domain — e.g. example.com")
      .refine((val) => {
        try {
          const { hostname } = new URL(val);
          return !/^(localhost|127\.|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(
            hostname,
          );
        } catch {
          return false;
        }
      }, "Local or private addresses can't be shortened"),
  );

// Max 60 chars, trimmed
export const titleField = z
  .string()
  .transform((val) => val.trim())
  .pipe(z.string().max(60, "Title must be 60 characters or fewer"));

// Alphanumeric + hyphens only, 4–50 chars, no leading/trailing/consecutive hyphens.
// Backend auto-generates 7-char base64url codes; custom aliases sit alongside those
// so we keep a generous upper bound (50) while blocking obviously bad input.
const ALIAS_PATTERN = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/i;

export const customCodeField = z
  .string()
  .transform((val) => val.trim().toLowerCase())
  .pipe(
    z
      .string()
      .refine(
        (val) => val === "" || val.length >= 4,
        "Alias must be at least 4 characters",
      )
      .refine(
        (val) => val === "" || val.length <= 50,
        "Alias must be 50 characters or fewer",
      )
      .refine(
        (val) => val === "" || ALIAS_PATTERN.test(val),
        "Only letters, numbers, and hyphens — can't start or end with a hyphen",
      )
      .refine(
        (val) => val === "" || !val.includes("--"),
        "Consecutive hyphens aren't allowed",
      ),
  );

export const createUrlSchema = z.object({
  originalUrl: destinationUrlField,
  title: titleField,
  customCode: customCodeField,
});

export const editUrlSchema = z.object({
  originalUrl: destinationUrlField,
  title: titleField,
  isActive: z.boolean(),
  resetClicks: z.boolean(),
});

export type CreateUrlForm = z.infer<typeof createUrlSchema>;
export type EditUrlForm = z.infer<typeof editUrlSchema>;
