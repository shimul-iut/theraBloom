import { Router } from 'express';
import { sessionsController } from './sessions.controller';
import { sessionPaymentsController } from './session-payments.controller';
import { authenticate } from '../../middleware/auth';
import { requireAdminOrOperator } from '../../middleware/rbac';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/sessions/calendar
 * Get calendar view sessions
 */
router.get('/calendar', (req, res) => sessionsController.getCalendarSessions(req, res));

/**
 * GET /api/v1/sessions
 * List sessions with filters
 */
router.get('/', (req, res) => sessionsController.getSessions(req, res));

/**
 * GET /api/v1/sessions/:id
 * Get session by ID
 */
router.get('/:id', (req, res) => sessionsController.getSessionById(req, res));

/**
 * POST /api/v1/sessions
 * Create new session (admin/operator)
 */
router.post('/', requireAdminOrOperator, (req, res) => sessionsController.createSession(req, res));

/**
 * PUT /api/v1/sessions/:id
 * Update/reschedule session (admin/operator)
 */
router.put('/:id', requireAdminOrOperator, (req, res) =>
  sessionsController.updateSession(req, res)
);

/**
 * POST /api/v1/sessions/:id/cancel
 * Cancel session (admin/operator)
 */
router.post('/:id/cancel', requireAdminOrOperator, (req, res) =>
  sessionsController.cancelSession(req, res)
);

/**
 * GET /api/v1/sessions/:sessionId/payments
 * Get session payments
 */
router.get('/:sessionId/payments', (req, res) =>
  sessionPaymentsController.getSessionPayments(req, res)
);

/**
 * POST /api/v1/sessions/:sessionId/payments
 * Record session payment (admin/operator)
 */
router.post('/:sessionId/payments', requireAdminOrOperator, (req, res) =>
  sessionPaymentsController.recordSessionPayment(req, res)
);

/**
 * GET /api/v1/sessions/:sessionId/payment-summary
 * Get payment summary for session
 */
router.get('/:sessionId/payment-summary', (req, res) =>
  sessionPaymentsController.getPaymentSummary(req, res)
);

export default router;
