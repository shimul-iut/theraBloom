import { Router } from 'express';
import { patientsController } from './patients.controller';
import { authenticate } from '../../middleware/auth';
import { requireAdminOrOperator } from '../../middleware/rbac';
import { setAuditContext } from '../../middleware/audit.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Set audit context after authentication
router.use(setAuditContext);

/**
 * GET /api/v1/patients
 * List all patients (admin/operator)
 */
router.get('/', requireAdminOrOperator, (req, res) => patientsController.getPatients(req, res));

/**
 * POST /api/v1/patients
 * Create new patient (admin/operator)
 */
router.post('/', requireAdminOrOperator, (req, res) => patientsController.createPatient(req, res));

/**
 * GET /api/v1/patients/:id
 * Get patient by ID (admin/operator)
 */
router.get('/:id', requireAdminOrOperator, (req, res) =>
  patientsController.getPatientById(req, res)
);

/**
 * PUT /api/v1/patients/:id
 * Update patient (admin/operator)
 */
router.put('/:id', requireAdminOrOperator, (req, res) =>
  patientsController.updatePatient(req, res)
);

/**
 * GET /api/v1/patients/:id/sessions
 * Get patient session history (admin/operator)
 */
router.get('/:id/sessions', requireAdminOrOperator, (req, res) =>
  patientsController.getPatientSessions(req, res)
);

/**
 * GET /api/v1/patients/:id/payments
 * Get patient payment history (admin/operator)
 */
router.get('/:id/payments', requireAdminOrOperator, (req, res) =>
  patientsController.getPatientPayments(req, res)
);

/**
 * GET /api/v1/patients/:id/outstanding-dues
 * Get patient outstanding dues (admin/operator)
 */
router.get('/:id/outstanding-dues', requireAdminOrOperator, (req, res) =>
  patientsController.getPatientOutstandingDues(req, res)
);

export default router;
