import { Request, Response } from 'express';
import { auditLogsService } from './audit-logs.service';
import { getTenantId } from '../../middleware/tenant';
import { logger } from '../../utils/logger';
import { AuditAction } from '@prisma/client';

export class AuditLogsController {
  /**
   * GET /api/v1/audit-logs
   */
  async getAuditLogs(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);

      const filters = {
        userId: req.query.userId as string | undefined,
        action: req.query.action as AuditAction | undefined,
        entityType: req.query.entityType as string | undefined,
        entityId: req.query.entityId as string | undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      };

      const result = await auditLogsService.getAuditLogs(tenantId, filters);

      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Get audit logs error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_LOGS_FAILED',
          message: 'Failed to fetch audit logs',
        },
      });
    }
  }

  /**
   * GET /api/v1/audit-logs/:id
   */
  async getAuditLogById(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const logId = req.params.id;

      const log = await auditLogsService.getAuditLogById(tenantId, logId);

      return res.json({
        success: true,
        data: log,
      });
    } catch (error) {
      logger.error('Get audit log error:', error);

      if (error instanceof Error && error.message === 'Audit log not found') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'LOG_NOT_FOUND',
            message: 'Audit log not found',
          },
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_LOG_FAILED',
          message: 'Failed to fetch audit log',
        },
      });
    }
  }

  /**
   * GET /api/v1/audit-logs/entity/:entityType/:entityId
   */
  async getEntityAuditLogs(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const entityType = req.params.entityType;
      const entityId = req.params.entityId;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

      const result = await auditLogsService.getEntityAuditLogs(
        tenantId,
        entityType,
        entityId,
        page,
        limit
      );

      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Get entity audit logs error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_LOGS_FAILED',
          message: 'Failed to fetch entity audit logs',
        },
      });
    }
  }

  /**
   * GET /api/v1/audit-logs/user/:userId
   */
  async getUserActivityLogs(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const userId = req.params.userId;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

      const result = await auditLogsService.getUserActivityLogs(
        tenantId,
        userId,
        page,
        limit
      );

      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Get user activity logs error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_LOGS_FAILED',
          message: 'Failed to fetch user activity logs',
        },
      });
    }
  }

  /**
   * GET /api/v1/audit-logs/statistics
   */
  async getAuditStatistics(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : undefined;
      const endDate = req.query.endDate
        ? new Date(req.query.endDate as string)
        : undefined;

      const statistics = await auditLogsService.getAuditStatistics(
        tenantId,
        startDate,
        endDate
      );

      return res.json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      logger.error('Get audit statistics error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_STATISTICS_FAILED',
          message: 'Failed to fetch audit statistics',
        },
      });
    }
  }
}

export const auditLogsController = new AuditLogsController();
