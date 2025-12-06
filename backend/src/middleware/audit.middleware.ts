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
 * This can be applied globally - it will set auditContext whenever req.user exists
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

  // Store IP and user agent for later use
  (req as any)._auditMetadata = { ipAddress, userAgent };

  // If user is already authenticated (shouldn't happen in global middleware),
  // set auditContext immediately
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

/**
 * Middleware to set audit context after authentication
 * Use this in routes after authenticate() middleware
 */
export function setAuditContext(req: Request, _res: Response, next: NextFunction) {
  console.log('🔍 DEBUG setAuditContext - req.user exists:', !!req.user);
  console.log('🔍 DEBUG setAuditContext - req.auditContext exists:', !!req.auditContext);

  if (req.user && !req.auditContext) {
    const metadata = (req as any)._auditMetadata || {
      ipAddress: req.socket.remoteAddress || 'unknown',
      userAgent: (req.headers['user-agent'] as string) || 'unknown',
    };

    req.auditContext = {
      userId: (req.user as any).id || req.user.userId,
      tenantId: req.user.tenantId,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    };

    console.log('✅ Audit context set:', {
      userId: req.auditContext.userId,
      tenantId: req.auditContext.tenantId,
      ipAddress: req.auditContext.ipAddress,
    });
  } else if (!req.user) {
    console.log('❌ No req.user - cannot set audit context');
  } else if (req.auditContext) {
    console.log('ℹ️ Audit context already set');
  }

  next();
}
