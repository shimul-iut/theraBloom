import { z } from 'zod';
import { PaymentMethod } from '@prisma/client';

// UUID validation helper
const uuidSchema = z.string().uuid('Invalid ID format');

export const recordSessionPaymentSchema = z.object({
  amountPaid: z
    .number()
    .positive('Amount paid must be positive')
    .max(1000000, 'Amount paid cannot exceed 1,000,000')
    .describe('Amount paid for the session'),
  paymentMethod: z.nativeEnum(PaymentMethod, {
    errorMap: () => ({ message: 'Invalid payment method' }),
  }).describe('Payment method used'),
  paidAt: z
    .string()
    .datetime('Invalid date format')
    .optional()
    .describe('Payment date (defaults to now)'),
  dueDate: z
    .string()
    .datetime('Invalid date format')
    .optional()
    .describe('Due date for remaining payment'),
  notes: z
    .string()
    .max(500, 'Notes cannot exceed 500 characters')
    .optional()
    .describe('Payment notes'),
});

// Session payment filters
export const sessionPaymentFiltersSchema = z.object({
  sessionId: uuidSchema.describe('Session ID'),
});

// Payment summary request
export const paymentSummaryParamSchema = z.object({
  sessionId: uuidSchema.describe('Session ID'),
});

// Type exports
export type RecordSessionPaymentInput = z.infer<typeof recordSessionPaymentSchema>;
export type SessionPaymentFiltersInput = z.infer<typeof sessionPaymentFiltersSchema>;
export type PaymentSummaryParam = z.infer<typeof paymentSummaryParamSchema>;
