import { z } from 'zod';
import { UnavailabilityReason } from '@prisma/client';

export const createUnavailabilitySchema = z.object({
  startDate: z.string().datetime('Invalid start date format'),
  endDate: z.string().datetime('Invalid end date format'),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)').optional().nullable(),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)').optional().nullable(),
  reason: z.nativeEnum(UnavailabilityReason, { errorMap: () => ({ message: 'Invalid reason' }) }),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional().nullable(),
  rescheduleSessionIds: z.array(z.string().uuid()).optional(),
}).refine(
  (data) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return end >= start;
  },
  {
    message: 'End date must be after or equal to start date',
    path: ['endDate'],
  }
).refine(
  (data) => {
    // If both times provided, validate that endTime is after startTime
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

export const updateUnavailabilitySchema = z.object({
  startDate: z.string().datetime('Invalid start date format').optional(),
  endDate: z.string().datetime('Invalid end date format').optional(),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)').optional().nullable(),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)').optional().nullable(),
  reason: z.nativeEnum(UnavailabilityReason).optional(),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional().nullable(),
});

export type CreateUnavailabilityInput = z.infer<typeof createUnavailabilitySchema>;
export type UpdateUnavailabilityInput = z.infer<typeof updateUnavailabilitySchema>;
