import { z } from 'zod';
import { DayOfWeek } from '@prisma/client';

// Time format validation (HH:MM)
const timeSchema = z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)');

export const createAvailabilitySchema = z.object({
  therapyTypeId: z.string().min(1, 'Therapy type is required'),
  dayOfWeek: z.nativeEnum(DayOfWeek, { errorMap: () => ({ message: 'Invalid day of week' }) }),
  startTime: timeSchema,
  endTime: timeSchema,
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

export const updateAvailabilitySchema = z.object({
  dayOfWeek: z.nativeEnum(DayOfWeek).optional(),
  startTime: timeSchema.optional(),
  endTime: timeSchema.optional(),
  active: z.boolean().optional(),
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

export type CreateAvailabilityInput = z.infer<typeof createAvailabilitySchema>;
export type UpdateAvailabilityInput = z.infer<typeof updateAvailabilitySchema>;
