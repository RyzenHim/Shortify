import { z } from "zod";

export function normalizeUrlInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return trimmed;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

export const destinationUrlField = z
  .string()
  .transform((val) => normalizeUrlInput(val))
  .pipe(z.string().min(1, "Enter a valid URL").url("Enter a valid URL"));
