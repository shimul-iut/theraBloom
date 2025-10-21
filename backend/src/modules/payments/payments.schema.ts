import { z } from 'zod';
import { PaymentMethod } from '@prisma/client';

export const recordPaymentSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  amount: z.number().positive('Amount must be positive'),
  method: z.nativeEnum(PaymentMethod, {
    errorMap: () => ({ message: 'Invalid payment method' }),
  }),
  date: z.string().datetime('Invalid date format').optional(),
  description: z.string().optional(),
});

export const paymentFiltersSchema = z.object({
  patientId: z.string().optional(),
  method: z.nativeEnum(PaymentMethod).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
export type PaymentFiltersInput = z.infer<typeof paymentFiltersSchema>;
