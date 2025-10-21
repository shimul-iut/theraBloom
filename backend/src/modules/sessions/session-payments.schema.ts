import { z } from 'zod';
import { PaymentMethod } from '@prisma/client';

export const recordSessionPaymentSchema = z.object({
    amountPaid: z.number().positive('Amount paid must be positive'),
    paymentMethod: z.nativeEnum(PaymentMethod, {
        errorMap: () => ({ message: 'Invalid payment method' }),
    }),
    paidAt: z.string().datetime('Invalid date format').optional(),
    dueDate: z.string().datetime('Invalid date format').optional(),
});

export type RecordSessionPaymentInput = z.infer<typeof recordSessionPaymentSchema>;
