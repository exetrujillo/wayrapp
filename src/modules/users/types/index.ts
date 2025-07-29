/**
 * User Module Types
 * Type definitions for user management
 */

import { z } from "zod";
import { UserRole } from "@/shared/types";

// User model interface
export interface User {
  id: string;
  email: string;
  username?: string | null | undefined;
  country_code?: string | null | undefined;
  registration_date: Date;
  last_login_date?: Date | null | undefined;
  profile_picture_url?: string | null | undefined;
  is_active: boolean;
  role: string;
  created_at: Date;
  updated_at: Date;
}

// DTOs (Data Transfer Objects)
export interface CreateUserDto {
  email: string;
  username?: string;
  country_code?: string;
  profile_picture_url?: string;
  role?: UserRole;
}

export interface UpdateUserDto {
  username?: string;
  country_code?: string;
  profile_picture_url?: string;
  is_active?: boolean;
  role?: string;
}

export interface UpdatePasswordDto {
  current_password: string;
  new_password: string;
}

export interface UpdateRoleDto {
  role: UserRole;
}

// Zod validation schemas
export const CreateUserSchema = z.object({
  email: z.string().email("Invalid email format"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .optional(),
  country_code: z
    .string()
    .length(2, "Country code must be 2 characters")
    .optional(),
  profile_picture_url: z.string().url("Invalid URL format").optional(),
  role: z.enum(["student", "content_creator", "admin"]).default("student"),
});

export const UpdateUserSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .optional(),
  country_code: z
    .string()
    .length(2, "Country code must be 2 characters")
    .optional(),
  profile_picture_url: z.string().url("Invalid URL format").optional(),
});

export const UpdatePasswordSchema = z.object({
  current_password: z.string().min(1, "Current password is required"),
  new_password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[^A-Za-z0-9]/,
      "Password must contain at least one special character"
    ),
});

export const UpdateRoleSchema = z.object({
  role: z.enum(["student", "content_creator", "admin"]),
});

// Whitelist DTO for profile updates (security hardening)
export type AllowedProfileUpdateDto = {
  username?: string;
  country_code?: string;
  profile_picture_url?: string;
};

// Export types for Zod schemas
export type CreateUserSchemaType = z.infer<typeof CreateUserSchema>;
export type UpdateUserSchemaType = z.infer<typeof UpdateUserSchema>;
export type UpdatePasswordSchemaType = z.infer<typeof UpdatePasswordSchema>;
export type UpdateRoleSchemaType = z.infer<typeof UpdateRoleSchema>;