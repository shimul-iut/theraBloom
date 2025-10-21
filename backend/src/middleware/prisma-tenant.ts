import { Prisma } from '@prisma/client';
import prisma from '../config/database';
import { logger } from '../utils/logger';

// Models that don't have tenant isolation (system-level models)
const SYSTEM_MODELS = ['Tenant'];

// Current tenant context (set by request middleware)
let currentTenantId: string | null = null;

/**
 * Set the current tenant context
 */
export function setTenantContext(tenantId: string) {
  currentTenantId = tenantId;
}

/**
 * Clear the current tenant context
 */
export function clearTenantContext() {
  currentTenantId = null;
}

/**
 * Get the current tenant context
 */
export function getTenantContext(): string | null {
  return currentTenantId;
}

/**
 * Prisma middleware for automatic tenant filtering
 * Automatically adds tenantId to all queries for tenant-scoped models
 */
export function setupTenantMiddleware() {
  prisma.$use(async (params: Prisma.MiddlewareParams, next) => {
    // Skip system models
    if (!params.model || SYSTEM_MODELS.includes(params.model)) {
      return next(params);
    }

    const tenantId = getTenantContext();

    // For read operations, automatically filter by tenantId
    if (
      params.action === 'findUnique' ||
      params.action === 'findFirst' ||
      params.action === 'findMany' ||
      params.action === 'count' ||
      params.action === 'aggregate'
    ) {
      if (tenantId) {
        // Add tenantId to where clause
        params.args.where = {
          ...params.args.where,
          tenantId,
        };

        logger.debug(`[Tenant Filter] ${params.model}.${params.action} - tenantId: ${tenantId}`);
      } else {
        logger.warn(
          `[Tenant Filter] ${params.model}.${params.action} - No tenant context! This may be intentional for system operations.`
        );
      }
    }

    // For create operations, automatically add tenantId
    if (params.action === 'create') {
      if (tenantId) {
        params.args.data = {
          ...params.args.data,
          tenantId,
        };

        logger.debug(`[Tenant Filter] ${params.model}.create - Added tenantId: ${tenantId}`);
      } else {
        logger.warn(
          `[Tenant Filter] ${params.model}.create - No tenant context! This may cause issues.`
        );
      }
    }

    // For createMany operations
    if (params.action === 'createMany') {
      if (tenantId && Array.isArray(params.args.data)) {
        params.args.data = params.args.data.map((item: any) => ({
          ...item,
          tenantId,
        }));

        logger.debug(
          `[Tenant Filter] ${params.model}.createMany - Added tenantId to ${params.args.data.length} records`
        );
      }
    }

    // For update operations, ensure tenantId in where clause
    if (
      params.action === 'update' ||
      params.action === 'updateMany' ||
      params.action === 'delete' ||
      params.action === 'deleteMany'
    ) {
      if (tenantId) {
        params.args.where = {
          ...params.args.where,
          tenantId,
        };

        logger.debug(`[Tenant Filter] ${params.model}.${params.action} - tenantId: ${tenantId}`);
      } else {
        logger.warn(
          `[Tenant Filter] ${params.model}.${params.action} - No tenant context! Operation may fail.`
        );
      }
    }

    return next(params);
  });

  logger.info('✅ Prisma tenant middleware initialized');
}

/**
 * Execute a function with tenant context
 * Useful for background jobs or system operations
 */
export async function withTenantContext<T>(
  tenantId: string,
  fn: () => Promise<T>
): Promise<T> {
  const previousTenantId = getTenantContext();

  try {
    setTenantContext(tenantId);
    return await fn();
  } finally {
    if (previousTenantId) {
      setTenantContext(previousTenantId);
    } else {
      clearTenantContext();
    }
  }
}

/**
 * Execute a function without tenant context (for system operations)
 */
export async function withoutTenantContext<T>(fn: () => Promise<T>): Promise<T> {
  const previousTenantId = getTenantContext();

  try {
    clearTenantContext();
    return await fn();
  } finally {
    if (previousTenantId) {
      setTenantContext(previousTenantId);
    }
  }
}
