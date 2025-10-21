import { Router } from 'express';
import { auditLogsController } from './audit-logs.controller';
import { authenticate } from '../../middleware/auth';
import { requireAdminOrOperator } from '../../middleware/rbac';

const router = Router();

// All routes require authentication and admin/operator role
router.use(authenticate);
router.use(requireAdminOrOperator);

/**
 * GET /api/v1/audit-logs
 * List audit logs with filters
 */
router.get('/', (req, res) => auditLogsController.getAuditLogs(req, res));

/**
 * GET /api/v1/audit-logs/statistics
 * Get audit statistics
 */
router.get('/statistics', (req, res) => auditLogsController.getAuditStatistics(req, res));

/**
 * GET /api/v1/audit-logs/entity/:entityType/:entityId
 * Get audit logs for specific entity
 */
router.get('/entity/:entityType/:entityId', (req, res) =>
  auditLogsController.getEntityAuditLogs(req, res)
);

/**
 * GET /api/v1/audit-logs/user/:userId
 * Get user activity logs
 */
router.get('/user/:userId', (req, res) => auditLogsController.getUserActivityLogs(req, res));

/**
 * GET /api/v1/audit-logs/:id
 * Get audit log by ID
 */
router.get('/:id', (req, res) => auditLogsController.getAuditLogById(req, res));

export default router;
