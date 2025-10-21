import { Request, Response, NextFunction } from 'express';
import { auditLogsService } from '../modules/audit-logs/audit-logs.service';
import { getTenantId, getUserId } from './tenant';
import { AuditAction } from '@prisma/client';
import { logger } from '../utils/logger';

/**
 * Audit middleware to log create/update/delete operations
 */
export const auditMiddleware = (
  action: AuditAction,
  entityType: string,
  getEntityId?: (req: Request) => string
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Store original send function
    const originalSend = res.json;

    // Override res.json to capture response
    res.json = function (data: any) {
      // Only log if request was successful
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Run audit logging asynchronously (don't block response)
        setImmediate(async () => {
          try {
            const tenantId = getTenantId(req);
            const userId = getUserId(req);

            // Determine entity ID
            let entityId: string;
            if (getEntityId) {
              entityId = getEntityId(req);
            } else if (req.params.id) {
              entityId = req.params.id;
            } else if (data?.data?.id) {
              entityId = data.data.id;
            } else {
              // Skip audit if we can't determine entity ID
              return;
            }

            // Capture changes for update operations
            let changes: Record<string, any> | undefined;
            if (action === 'UPDATE' && req.body) {
              changes = req.body;
            }

            // Capture metadata
            const metadata = {
              method: req.method,
              path: req.path,
              ip: req.ip,
              userAgent: req.get('user-agent'),
            };

            await auditLogsService.logAction(
              tenantId,
              userId,
              action,
              entityType,
              entityId,
              changes,
              metadata
            );
          } catch (error) {
            // Log error but don't fail the request
            logger.error('Audit logging failed:', error);
          }
        });
      }

      // Call original send function
      return originalSend.call(this, data);
    };

    next();
  };
};

/**
 * Helper to create audit middleware for common operations
 */
export const auditCreate = (entityType: string, getEntityId?: (req: Request) => string) =>
  auditMiddleware('CREATE', entityType, getEntityId);

export const auditUpdate = (entityType: string, getEntityId?: (req: Request) => string) =>
  auditMiddleware('UPDATE', entityType, getEntityId);

export const auditDelete = (entityType: string, getEntityId?: (req: Request) => string) =>
  auditMiddleware('DELETE', entityType, getEntityId);

/**
 * Manual audit logging helper for use in controllers
 */
export const logAudit = async (
  req: Request,
  action: AuditAction,
  entityType: string,
  entityId: string,
  changes?: Record<string, any>
) => {
  try {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);

    const metadata = {
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    };

    await auditLogsService.logAction(
      tenantId,
      userId,
      action,
      entityType,
      entityId,
      changes,
      metadata
    );
  } catch (error) {
    logger.error('Manual audit logging failed:', error);
  }
};
