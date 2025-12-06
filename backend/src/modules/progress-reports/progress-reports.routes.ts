import { Router } from 'express';
import { progressReportsController } from './progress-reports.controller';
import { authenticate } from '../../middleware/auth';
import { requireTherapist } from '../../middleware/rbac';
import { setAuditContext } from '../../middleware/audit.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Set audit context after authentication
router.use(setAuditContext);

/**
 * GET /api/v1/progress-reports
 * List progress reports with filters
 */
router.get('/', (req, res) => progressReportsController.getProgressReports(req, res));

/**
 * GET /api/v1/progress-reports/:id
 * Get progress report by ID
 */
router.get('/:id', (req, res) => progressReportsController.getProgressReportById(req, res));

/**
 * POST /api/v1/progress-reports
 * Create progress report (therapist only)
 */
router.post('/', requireTherapist, (req, res) =>
  progressReportsController.createProgressReport(req, res)
);

/**
 * PUT /api/v1/progress-reports/:id
 * Update progress report (therapist only - own reports)
 */
router.put('/:id', requireTherapist, (req, res) =>
  progressReportsController.updateProgressReport(req, res)
);

/**
 * GET /api/v1/patients/:patientId/progress-reports
 * Get patient progress reports
 */
router.get('/patients/:patientId/progress-reports', (req, res) =>
  progressReportsController.getPatientProgressReports(req, res)
);

export default router;
