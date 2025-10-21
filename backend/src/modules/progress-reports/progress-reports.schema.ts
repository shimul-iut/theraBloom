import { z } from 'zod';

export const createProgressReportSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  sessionId: z.string().optional(),
  reportDate: z.string().datetime('Invalid date format').optional(),
  notes: z.string().min(1, 'Report notes are required'),
});

export const updateProgressReportSchema = z.object({
  reportDate: z.string().datetime('Invalid date format').optional(),
  notes: z.string().min(1, 'Report notes are required').optional(),
});

export const progressReportFiltersSchema = z.object({
  patientId: z.string().optional(),
  therapistId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export type CreateProgressReportInput = z.infer<typeof createProgressReportSchema>;
export type UpdateProgressReportInput = z.infer<typeof updateProgressReportSchema>;
export type ProgressReportFiltersInput = z.infer<typeof progressReportFiltersSchema>;
