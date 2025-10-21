import prisma from '../../config/database';
import { AuditAction } from '@prisma/client';
import { CreateAuditLogInput } from './audit-logs.schema';

export class AuditLogsService {
  /**
   * Create audit log entry
   */
  async createAuditLog(
    tenantId: string,
    userId: string,
    input: CreateAuditLogInput
  ) {
    const auditLog = await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action: input.action,
        resourceType: input.entityType,
        resourceId: input.entityId,
        changes: input.changes || {},
        ipAddress: input.metadata?.ip,
        userAgent: input.metadata?.userAgent,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            role: true,
          },
        },
      },
    });

    return auditLog;
  }

  /**
   * Get audit logs with filters and pagination
   */
  async getAuditLogs(
    tenantId: string,
    filters: {
      userId?: string;
      action?: AuditAction;
      entityType?: string;
      entityId?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };

    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = filters.action;
    if (filters.entityType) where.resourceType = filters.entityType;
    if (filters.entityId) where.resourceId = filters.entityId;

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phoneNumber: true,
              role: true,
            },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get audit log by ID
   */
  async getAuditLogById(tenantId: string, logId: string) {
    const log = await prisma.auditLog.findFirst({
      where: {
        id: logId,
        tenantId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            role: true,
          },
        },
      },
    });

    if (!log) {
      throw new Error('Audit log not found');
    }

    return log;
  }

  /**
   * Get audit logs for specific entity
   */
  async getEntityAuditLogs(
    tenantId: string,
    entityType: string,
    entityId: string,
    page = 1,
    limit = 20
  ) {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: {
          tenantId,
          resourceType: entityType,
          resourceId: entityId,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phoneNumber: true,
              role: true,
            },
          },
        },
      }),
      prisma.auditLog.count({
        where: {
          tenantId,
          resourceType: entityType,
          resourceId: entityId,
        },
      }),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get user activity logs
   */
  async getUserActivityLogs(
    tenantId: string,
    userId: string,
    page = 1,
    limit = 20
  ) {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: {
          tenantId,
          userId,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phoneNumber: true,
              role: true,
            },
          },
        },
      }),
      prisma.auditLog.count({
        where: {
          tenantId,
          userId,
        },
      }),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get audit statistics
   */
  async getAuditStatistics(tenantId: string, startDate?: Date, endDate?: Date) {
    const where: any = { tenantId };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    // Get total logs count
    const totalLogs = await prisma.auditLog.count({ where });

    // Get logs by action
    const logsByAction = await prisma.auditLog.groupBy({
      by: ['action'],
      where,
      _count: {
        action: true,
      },
    });

    // Get logs by entity type
    const logsByEntityType = await prisma.auditLog.groupBy({
      by: ['resourceType'],
      where,
      _count: {
        resourceType: true,
      },
    });

    // Get most active users
    const mostActiveUsers = await prisma.auditLog.groupBy({
      by: ['userId'],
      where,
      _count: {
        userId: true,
      },
      orderBy: {
        _count: {
          userId: 'desc',
        },
      },
      take: 10,
    });

    // Get user details for most active users
    const userIds = mostActiveUsers.map((u) => u.userId);
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    const mostActiveUsersWithDetails = mostActiveUsers.map((u) => {
      const user = users.find((usr) => usr.id === u.userId);
      return {
        userId: u.userId,
        count: u._count.userId,
        user,
      };
    });

    return {
      totalLogs,
      logsByAction: logsByAction.map((l) => ({
        action: l.action,
        count: l._count.action,
      })),
      logsByEntityType: logsByEntityType.map((l) => ({
        entityType: l.resourceType,
        count: l._count?.resourceType || 0,
      })),
      mostActiveUsers: mostActiveUsersWithDetails,
    };
  }

  /**
   * Helper method to log common actions
   */
  async logAction(
    tenantId: string,
    userId: string,
    action: AuditAction,
    entityType: string,
    entityId: string,
    changes?: Record<string, any>,
    metadata?: Record<string, any>
  ) {
    return this.createAuditLog(tenantId, userId, {
      action,
      entityType,
      entityId,
      changes,
      metadata,
    });
  }
}

export const auditLogsService = new AuditLogsService();
