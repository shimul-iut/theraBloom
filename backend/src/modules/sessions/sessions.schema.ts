import { z } from 'zod';
import { SessionStatus } from '@prisma/client';

// Time format validation (HH:MM)
const timeSchema = z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)');

export const createSessionSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  therapistId: z.string().min(1, 'Therapist is required'),
  therapyTypeId: z.string().min(1, 'Therapy type is required'),
  scheduledDate: z.string().datetime('Invalid date format'),
  startTime: timeSchema,
  endTime: timeSchema,
  notes: z.string().optional(),
  paidWithCredit: z.boolean().default(false),
}).refine(
  (data) => {
    // Validate that endTime is after startTime
    const [startHour, startMin] = data.startTime.split(':').map(Number);
    const [endHour, endMin] = data.endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    return endMinutes > startMinutes;
  },
  {
    message: 'End time must be after start time',
    path: ['endTime'],
  }
);

export const updateSessionSchema = z.object({
  scheduledDate: z.string().datetime('Invalid date format').optional(),
  startTime: timeSchema.optional(),
  endTime: timeSchema.optional(),
  status: z.nativeEnum(SessionStatus).optional(),
  notes: z.string().optional(),
}).refine(
  (data) => {
    // If both times are provided, validate that endTime is after startTime
    if (data.startTime && data.endTime) {
      const [startHour, startMin] = data.startTime.split(':').map(Number);
      const [endHour, endMin] = data.endTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      return endMinutes > startMinutes;
    }
    return true;
  },
  {
    message: 'End time must be after start time',
    path: ['endTime'],
  }
);

export const cancelSessionSchema = z.object({
  cancelReason: z.string().min(1, 'Cancel reason is required'),
});

export const sessionFiltersSchema = z.object({
  patientId: z.string().optional(),
  therapistId: z.string().optional(),
  therapyTypeId: z.string().optional(),
  status: z.nativeEnum(SessionStatus).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;
export type CancelSessionInput = z.infer<typeof cancelSessionSchema>;
export type SessionFiltersInput = z.infer<typeof sessionFiltersSchema>;
