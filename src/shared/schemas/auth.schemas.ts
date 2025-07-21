import { z } from 'zod';
import { EmailSchema, UsernameSchema, CountryCodeSchema, UrlSchema } from './common';

/**
 * Authentication validation schemas
 */

// Password validation with strong requirements
export const PasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password cannot exceed 100 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).+$/,
    'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character'
  );

// Registration schema
export const RegisterSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  username: UsernameSchema.optional(),
  country_code: CountryCodeSchema.optional(),
  profile_picture_url: UrlSchema.optional()
});

// Login schema
export const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, 'Password is required')
});

// Refresh token schema
export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(10, 'Valid refresh token is required')
});

// Password update schema
export const PasswordUpdateSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: PasswordSchema
}).refine(data => data.current_password !== data.new_password, {
  message: 'New password must be different from current password',
  path: ['new_password']
});

// Export types
export type RegisterRequest = z.infer<typeof RegisterSchema>;
export type LoginRequest = z.infer<typeof LoginSchema>;
export type RefreshTokenRequest = z.infer<typeof RefreshTokenSchema>;
export type PasswordUpdateRequest = z.infer<typeof PasswordUpdateSchema>;