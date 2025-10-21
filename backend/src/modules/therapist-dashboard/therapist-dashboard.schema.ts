import { z } from 'zod';

export const therapistScheduleFiltersSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED']).optional(),
});

export const completeSessionSchema = z.object({
  notes: z.string().optional(),
  progressNotes: z.string().optional(),
});

export type TherapistScheduleFiltersInput = z.infer<typeof therapistScheduleFiltersSchema>;
export type CompleteSessionInput = z.infer<typeof completeSessionSchema>;
