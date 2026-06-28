import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must contain at least 2 characters').trim(),
  email: z.string().email('Enter a valid email address').toLowerCase(),
  password: z.string().min(8, 'Password must contain at least 8 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must contain at least 2 characters').trim(),
});

export const updatePreferencesSchema = z.object({
  theme: z.enum(['light', 'dark']),
  accentColor: z.enum(['teal', 'blue', 'violet', 'rose', 'amber']),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must contain at least 8 characters'),
    confirmPassword: z
      .string()
      .min(8, 'Confirm password must contain at least 8 characters'),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: 'New passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
export type UpdatePreferencesDto = z.infer<typeof updatePreferencesSchema>;
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;
