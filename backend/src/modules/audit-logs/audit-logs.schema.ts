import { z } from 'zod';
import { AuditAction } from '@prisma/client';

export const auditLogFiltersSchema = z.object({
  userId: z.string().optional(),
  action: z.nativeEnum(AuditAction).optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export const createAuditLogSchema = z.object({
  action: z.nativeEnum(AuditAction),
  entityType: z.string().min(1),
  entityId: z.string().min(1),
  changes: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
});

export type AuditLogFiltersInput = z.infer<typeof auditLogFiltersSchema>;
export type CreateAuditLogInput = z.infer<typeof createAuditLogSchema>;
