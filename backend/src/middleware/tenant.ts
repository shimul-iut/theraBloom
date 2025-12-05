import { Request, Response, NextFunction } from 'express';
import { setTenantContext, clearTenantContext } from './prisma-tenant';

/**
 * Tenant context middleware - sets tenant context for Prisma middleware
 * Must be used after authentication middleware
 */
export function setTenantContextMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.user?.tenantId) {
    setTenantContext(req.user.tenantId);
  }

  // Clear tenant context after response
  res.on('finish', () => {
    clearTenantContext();
  });

  next();
}

/**
 * Require tenant middleware - ensures tenant context is available
 * Must be used after authentication middleware
 */
export function requireTenant(req: Request, res: Response, next: NextFunction) {
  if (!req.user?.tenantId) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Tenant context required. Please authenticate first.',
      },
    });
  }

  next();
  return;
}

/**
 * Get tenant ID from request
 */
export function getTenantId(req: Request): string {
  if (!req.user?.tenantId) {
    throw new Error('Tenant context not available');
  }
  return req.user.tenantId;
}

/**
 * Get user ID from request
 */
export function getUserId(req: Request): string {
  if (!req.user?.userId) {
    throw new Error('User context not available');
  }
  return req.user.userId;
}
