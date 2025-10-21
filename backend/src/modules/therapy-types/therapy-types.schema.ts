import { z } from 'zod';

export const createTherapyTypeSchema = z.object({
  name: z.string().min(1, 'Therapy type name is required'),
  description: z.string().optional(),
  defaultDuration: z.number().int().positive('Duration must be positive'),
  defaultCost: z.number().positive('Cost must be positive'),
});

export const updateTherapyTypeSchema = z.object({
  name: z.string().min(1, 'Therapy type name is required').optional(),
  description: z.string().optional(),
  defaultDuration: z.number().int().positive('Duration must be positive').optional(),
  defaultCost: z.number().positive('Cost must be positive').optional(),
  active: z.boolean().optional(),
});

export type CreateTherapyTypeInput = z.infer<typeof createTherapyTypeSchema>;
export type UpdateTherapyTypeInput = z.infer<typeof updateTherapyTypeSchema>;
