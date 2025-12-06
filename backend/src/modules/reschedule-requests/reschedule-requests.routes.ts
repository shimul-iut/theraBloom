import { Router } from 'express';
import { rescheduleRequestsController } from './reschedule-requests.controller';
import { authenticate } from '../../middleware/auth';
import { requireTherapist, requireAdminOrOperator } from '../../middleware/rbac';
import { setAuditContext } from '../../middleware/audit.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Set audit context after authentication
router.use(setAuditContext);

/**
 * GET /api/v1/reschedule-requests
 * List reschedule requests
 */
router.get('/', (req, res) => rescheduleRequestsController.getRescheduleRequests(req, res));

/**
 * GET /api/v1/reschedule-requests/:id
 * Get reschedule request by ID
 */
router.get('/:id', (req, res) => rescheduleRequestsController.getRescheduleRequestById(req, res));

/**
 * POST /api/v1/reschedule-requests
 * Create reschedule request (therapist only, 48hr check)
 */
router.post('/', requireTherapist, (req, res) =>
  rescheduleRequestsController.createRescheduleRequest(req, res)
);

/**
 * PUT /api/v1/reschedule-requests/:id/approve
 * Approve reschedule request (admin/operator)
 */
router.put('/:id/approve', requireAdminOrOperator, (req, res) =>
  rescheduleRequestsController.approveRescheduleRequest(req, res)
);

/**
 * PUT /api/v1/reschedule-requests/:id/reject
 * Reject reschedule request (admin/operator)
 */
router.put('/:id/reject', requireAdminOrOperator, (req, res) =>
  rescheduleRequestsController.rejectRescheduleRequest(req, res)
);

/**
 * DELETE /api/v1/reschedule-requests/:id
 * Cancel reschedule request (therapist only - own requests)
 */
router.delete('/:id', requireTherapist, (req, res) =>
  rescheduleRequestsController.cancelRescheduleRequest(req, res)
);

export default router;
