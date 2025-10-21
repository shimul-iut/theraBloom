import { z } from 'zod';
import { UserRole } from '@prisma/client';

// Bangladesh phone number validation: 11 digits starting with '01'
export const phoneNumberSchema = z.string().regex(/^01\d{9}$/, 'Phone number must be 11 digits starting with 01');

export const createUserSchema = z.object({
  phoneNumber: phoneNumberSchema,
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.nativeEnum(UserRole, { errorMap: () => ({ message: 'Invalid role' }) }),
});

export const updateUserSchema = z.object({
  phoneNumber: phoneNumberSchema.optional(),
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  role: z.nativeEnum(UserRole).optional(),
  active: z.boolean().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
