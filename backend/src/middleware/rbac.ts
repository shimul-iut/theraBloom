import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';

/**
 * Role-based access control middleware
 * Checks if user has one of the required roles
 */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Required roles: ${roles.join(', ')}`,
        },
      });
    }

    next();
  };
}

/**
 * Check if user is admin
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  return requireRole(UserRole.WORKSPACE_ADMIN)(req, res, next);
}

/**
 * Check if user is admin or operator
 */
export function requireAdminOrOperator(req: Request, res: Response, next: NextFunction) {
  return requireRole(UserRole.WORKSPACE_ADMIN, UserRole.OPERATOR)(req, res, next);
}

/**
 * Check if user is therapist
 */
export function requireTherapist(req: Request, res: Response, next: NextFunction) {
  return requireRole(UserRole.THERAPIST)(req, res, next);
}

/**
 * Check if user is accountant or admin
 */
export function requireAccountantOrAdmin(req: Request, res: Response, next: NextFunction) {
  return requireRole(UserRole.ACCOUNTANT, UserRole.WORKSPACE_ADMIN)(req, res, next);
}

/**
 * Check if user has permission to access resource
 * For example, therapists can only access their own data
 */
export function checkResourceOwnership(resourceUserId: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    // Admins and operators can access all resources
    if (
      req.user.role === UserRole.WORKSPACE_ADMIN ||
      req.user.role === UserRole.OPERATOR
    ) {
      return next();
    }

    // Other users can only access their own resources
    if (req.user.userId !== resourceUserId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You can only access your own resources',
        },
      });
    }

    next();
  };
}
