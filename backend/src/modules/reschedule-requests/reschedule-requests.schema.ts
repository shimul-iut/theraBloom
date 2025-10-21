import { z } from 'zod';

// Time format validation (HH:MM)
const timeSchema = z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)');

export const createRescheduleRequestSchema = z.object({
  sessionId: z.string().min(1, 'Session is required'),
  requestedDate: z.string().datetime('Invalid date format'),
  requestedTime: timeSchema,
  reason: z.string().min(1, 'Reason is required'),
});

export const reviewRescheduleRequestSchema = z.object({
  reviewNotes: z.string().optional(),
});

export type CreateRescheduleRequestInput = z.infer<typeof createRescheduleRequestSchema>;
export type ReviewRescheduleRequestInput = z.infer<typeof reviewRescheduleRequestSchema>;
