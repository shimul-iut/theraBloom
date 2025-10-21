import { z } from 'zod';

export const createPatientSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().refine((date) => {
    // Accept both date strings (YYYY-MM-DD) and datetime strings
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const datetimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    return dateRegex.test(date) || datetimeRegex.test(date);
  }, 'Invalid date format'),
  guardianName: z.string().min(1, 'Guardian name is required'),
  guardianPhone: z.string().min(10, 'Valid phone number is required'),
  guardianEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
  medicalNotes: z.string().optional(),
  creditBalance: z.number().min(0, 'Credit balance cannot be negative').default(0),
});

export const updatePatientSchema = z.object({
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  dateOfBirth: z.string().refine((date) => {
    // Accept both date strings (YYYY-MM-DD) and datetime strings
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const datetimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    return dateRegex.test(date) || datetimeRegex.test(date);
  }, 'Invalid date format').optional(),
  guardianName: z.string().min(1, 'Guardian name is required').optional(),
  guardianPhone: z.string().min(10, 'Valid phone number is required').optional(),
  guardianEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
  medicalNotes: z.string().optional(),
  creditBalance: z.number().min(0, 'Credit balance cannot be negative').optional(),
  active: z.boolean().optional(),
});

export const searchPatientsSchema = z.object({
  query: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  active: z.boolean().optional(),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
export type SearchPatientsInput = z.infer<typeof searchPatientsSchema>;
