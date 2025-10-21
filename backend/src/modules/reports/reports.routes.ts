import { Router } from 'express';
import { reportsController } from './reports.controller';
import { authenticate } from '../../middleware/auth';
import { requireAdminOrOperator } from '../../middleware/rbac';

const router = Router();

// All routes require authentication and admin/operator role
router.use(authenticate);
router.use(requireAdminOrOperator);

/**
 * GET /api/v1/reports/dashboard
 * Get dashboard KPIs
 */
router.get('/dashboard', (req, res) => reportsController.getDashboardKPIs(req, res));

/**
 * GET /api/v1/reports/financial
 * Get financial summary
 */
router.get('/financial', (req, res) => reportsController.getFinancialSummary(req, res));

/**
 * GET /api/v1/reports/sessions
 * Get session reports
 */
router.get('/sessions', (req, res) => reportsController.getSessionReports(req, res));

/**
 * GET /api/v1/reports/revenue-trend
 * Get revenue trend data for charts
 */
router.get('/revenue-trend', (req, res) => reportsController.getRevenueTrend(req, res));

/**
 * GET /api/v1/reports/export
 * Export reports as CSV
 */
router.get('/export', (req, res) => reportsController.exportReport(req, res));

export default router;
