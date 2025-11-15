import { Router } from 'express';
import { invoicesController } from './invoices.controller';
import { authenticate } from '../../middleware/auth';
import { requireAdminOrOperator } from '../../middleware/rbac';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/invoices/unpaid-sessions
 * Get all uninvoiced sessions grouped by patient
 */
router.get('/unpaid-sessions', (req, res) =>
  invoicesController.getUninvoicedSessions(req, res)
);

/**
 * POST /api/v1/invoices/create
 * Create invoice for selected sessions (admin/operator)
 */
router.post('/create', requireAdminOrOperator, (req, res) =>
  invoicesController.createInvoice(req, res)
);

/**
 * GET /api/v1/invoices/patient/:patientId/balance
 * Get patient financial balance with uninvoiced sessions
 */
router.get('/patient/:patientId/balance', (req, res) =>
  invoicesController.getPatientBalance(req, res)
);

/**
 * GET /api/v1/invoices/patient/:patientId
 * Get all invoices for a patient
 */
router.get('/patient/:patientId', (req, res) =>
  invoicesController.getPatientInvoices(req, res)
);

/**
 * GET /api/v1/invoices/:invoiceId
 * Get invoice details by ID
 */
router.get('/:invoiceId', (req, res) => invoicesController.getInvoiceById(req, res));

export default router;
