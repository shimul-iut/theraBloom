import { z } from 'zod';

export const createPricingSchema = z.object({
  therapyTypeId: z.string().min(1, 'Therapy type is required'),
  sessionDuration: z.number().int().positive('Duration must be positive'),
  sessionCost: z.number().positive('Cost must be positive'),
});

export const updatePricingSchema = z.object({
  sessionDuration: z.number().int().positive('Duration must be positive').optional(),
  sessionCost: z.number().positive('Cost must be positive').optional(),
  active: z.boolean().optional(),
});

export type CreatePricingInput = z.infer<typeof createPricingSchema>;
export type UpdatePricingInput = z.infer<typeof updatePricingSchema>;
