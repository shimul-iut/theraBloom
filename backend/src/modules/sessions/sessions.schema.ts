import { z } from 'zod';
import { SessionStatus } from '@prisma/client';

// Time format validation (HH:MM)
const timeSchema = z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)');

// UUID validation helper
const uuidSchema = z.string().uuid('Invalid ID format');

export const createSessionSchema = z
  .object({
    patientId: uuidSchema.describe('Patient ID'),
    therapistId: uuidSchema.describe('Therapist ID'),
    therapyTypeId: uuidSchema.describe('Therapy type ID'),
    scheduledDate: z
      .string()
      .datetime('Invalid date format')
      .describe('Session scheduled date in ISO format'),
    startTime: timeSchema.describe('Session start time (HH:MM)'),
    endTime: timeSchema.describe('Session end time (HH:MM)'),
    notes: z
      .string()
      .max(1000, 'Notes cannot exceed 1000 characters')
      .optional()
      .describe('Optional session notes'),
    paidWithCredit: z
      .boolean()
      .default(false)
      .describe('Whether session is paid with patient credit'),
  })
  .refine(
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
  )
  .refine(
    (data) => {
      // Validate that scheduled date is not in the past
      const scheduledDate = new Date(data.scheduledDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return scheduledDate >= today;
    },
    {
      message: 'Cannot schedule sessions in the past',
      path: ['scheduledDate'],
    }
  );

export const updateSessionSchema = z
  .object({
    scheduledDate: z
      .string()
      .datetime('Invalid date format')
      .optional()
      .describe('New scheduled date in ISO format'),
    startTime: timeSchema.optional().describe('New start time (HH:MM)'),
    endTime: timeSchema.optional().describe('New end time (HH:MM)'),
    status: z
      .nativeEnum(SessionStatus)
      .optional()
      .describe('Session status'),
    notes: z
      .string()
      .max(1000, 'Notes cannot exceed 1000 characters')
      .optional()
      .describe('Session notes'),
  })
  .refine(
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
  )
  .refine(
    (data) => {
      // Validate that scheduled date is not in the past if provided
      if (data.scheduledDate) {
        const scheduledDate = new Date(data.scheduledDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return scheduledDate >= today;
      }
      return true;
    },
    {
      message: 'Cannot reschedule sessions to the past',
      path: ['scheduledDate'],
    }
  );

export const cancelSessionSchema = z.object({
  cancelReason: z
    .string()
    .min(5, 'Cancel reason must be at least 5 characters')
    .max(500, 'Cancel reason cannot exceed 500 characters')
    .describe('Reason for cancellation'),
});

export const sessionFiltersSchema = z.object({
  patientId: z.string().uuid('Invalid patient ID').optional(),
  therapistId: z.string().uuid('Invalid therapist ID').optional(),
  therapyTypeId: z.string().uuid('Invalid therapy type ID').optional(),
  status: z.nativeEnum(SessionStatus).optional(),
  startDate: z.string().datetime('Invalid start date format').optional(),
  endDate: z.string().datetime('Invalid end date format').optional(),
  page: z
    .number()
    .int('Page must be an integer')
    .positive('Page must be positive')
    .default(1),
  limit: z
    .number()
    .int('Limit must be an integer')
    .positive('Limit must be positive')
    .max(100, 'Limit cannot exceed 100')
    .default(20),
});

// Calendar view filters
export const calendarFiltersSchema = z.object({
  startDate: z.string().datetime('Invalid start date format'),
  endDate: z.string().datetime('Invalid end date format'),
  therapistId: z.string().uuid('Invalid therapist ID').optional(),
});

// Session ID parameter validation
export const sessionIdParamSchema = z.object({
  id: uuidSchema.describe('Session ID'),
});

// Type exports
export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;
export type CancelSessionInput = z.infer<typeof cancelSessionSchema>;
export type SessionFiltersInput = z.infer<typeof sessionFiltersSchema>;
export type CalendarFiltersInput = z.infer<typeof calendarFiltersSchema>;
export type SessionIdParam = z.infer<typeof sessionIdParamSchema>;
