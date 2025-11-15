import { z } from 'zod';
import { PaymentMethod } from '@prisma/client';

export const createInvoiceSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  sessionIds: z.array(z.string()).min(1, 'At least one session is required'),
  paidAmount: z.number().min(0, 'Paid amount cannot be negative'),
  paymentMethod: z.nativeEnum(PaymentMethod, {
    errorMap: () => ({ message: 'Invalid payment method' }),
  }),
  creditUsed: z.number().min(0, 'Credit used cannot be negative'),
  notes: z.string().optional(),
});

export const uninvoicedSessionsFiltersSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  patientId: z.string().optional(),
  therapistId: z.string().optional(),
});

export const invoiceFiltersSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UninvoicedSessionsFiltersInput = z.infer<typeof uninvoicedSessionsFiltersSchema>;
export type InvoiceFiltersInput = z.infer<typeof invoiceFiltersSchema>;
