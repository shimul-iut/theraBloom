import { z } from 'zod';
import { ExpenseCategory, PaymentMethod } from '@prisma/client';

export const createExpenseSchema = z.object({
  category: z.nativeEnum(ExpenseCategory),
  amount: z.number().positive('Amount must be positive'),
  date: z.string().datetime('Invalid date format'),
  description: z.string().min(1, 'Description is required'),
  paymentMethod: z.nativeEnum(PaymentMethod),
});

export const updateExpenseSchema = z.object({
  category: z.nativeEnum(ExpenseCategory).optional(),
  amount: z.number().positive('Amount must be positive').optional(),
  date: z.string().datetime('Invalid date format').optional(),
  description: z.string().min(1, 'Description is required').optional(),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
});

export const expenseFiltersSchema = z.object({
  category: z.nativeEnum(ExpenseCategory).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ExpenseFiltersInput = z.infer<typeof expenseFiltersSchema>;
