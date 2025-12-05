import { Request, Response, NextFunction } from 'express';

export interface AuditContext {
  userId: string;
  tenantId: string;
  ipAddress: string;
  userAgent: string;
}

// Extend Express Request type to include auditContext
declare global {
  namespace Express {
    interface Request {
      auditContext?: AuditContext;
      user?: {
        id: string;
        userId?: string;
        tenantId: string;
        [key: string]: any;
      };
    }
  }
}

/**
 * Middleware to capture audit context (IP address, user agent)
 * Should be applied after authentication middleware
 */
export function auditMiddleware(req: Request, _res: Response, next: NextFunction) {
  // Extract IP address (handle proxies and load balancers)
  const ipAddress =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    (req.headers['x-real-ip'] as string) ||
    req.socket.remoteAddress ||
    'unknown';

  // Extract user agent
  const userAgent = (req.headers['user-agent'] as string) || 'unknown';

  // Attach audit context to request (if user is authenticated)
  if (req.user) {
    req.auditContext = {
      userId: (req.user as any).id || req.user.userId,
      tenantId: req.user.tenantId,
      ipAddress,
      userAgent,
    };
  }

  next();
}
