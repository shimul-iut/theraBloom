import { Router } from 'express';
import { paymentsController } from './payments.controller';
import { authenticate } from '../../middleware/auth';
import { requireAdminOrOperator } from '../../middleware/rbac';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/payments
 * List payments with filters
 */
router.get('/', (req, res) => paymentsController.getPayments(req, res));

/**
 * GET /api/v1/payments/:id
 * Get payment by ID
 */
router.get('/:id', (req, res) => paymentsController.getPaymentById(req, res));

/**
 * POST /api/v1/payments
 * Record payment (admin/operator)
 */
router.post('/', requireAdminOrOperator, (req, res) =>
  paymentsController.recordPayment(req, res)
);

/**
 * GET /api/v1/patients/:patientId/credits
 * Get patient credit balance and history
 */
router.get('/patients/:patientId/credits', (req, res) =>
  paymentsController.getPatientCreditBalance(req, res)
);

/**
 * GET /api/v1/patients/:patientId/payment-history
 * Get patient payment history
 */
router.get('/patients/:patientId/payment-history', (req, res) =>
  paymentsController.getPatientPaymentHistory(req, res)
);

export default router;
