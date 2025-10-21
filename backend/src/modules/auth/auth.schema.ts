import { z } from 'zod';

// Bangladesh phone number validation: 11 digits starting with '01'
export const phoneNumberSchema = z.string().regex(/^01\d{9}$/, 'Phone number must be 11 digits starting with 01');

export const loginSchema = z.object({
  phoneNumber: phoneNumberSchema,
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
