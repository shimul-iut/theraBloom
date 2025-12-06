import { Router } from 'express';
import { therapistAvailabilityController } from './therapist-availability.controller';
import { authenticate } from '../../middleware/auth';
import { requireAdminOrOperator } from '../../middleware/rbac';
import { setAuditContext } from '../../middleware/audit.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Set audit context after authentication
router.use(setAuditContext);

/**
 * GET /api/v1/therapists/:therapistId/availability
 * Get therapist availability
 */
router.get('/:therapistId/availability', (req, res) =>
  therapistAvailabilityController.getTherapistAvailability(req, res)
);

/**
 * GET /api/v1/therapists/:therapistId/availability/:slotId
 * Get availability slot by ID
 */
router.get('/:therapistId/availability/:slotId', (req, res) =>
  therapistAvailabilityController.getAvailabilityById(req, res)
);

/**
 * POST /api/v1/therapists/:therapistId/availability
 * Create availability slot (admin/operator)
 */
router.post('/:therapistId/availability', requireAdminOrOperator, (req, res) =>
  therapistAvailabilityController.createAvailability(req, res)
);

/**
 * PUT /api/v1/therapists/:therapistId/availability/:slotId
 * Update availability slot (admin/operator)
 */
router.put('/:therapistId/availability/:slotId', requireAdminOrOperator, (req, res) =>
  therapistAvailabilityController.updateAvailability(req, res)
);

/**
 * DELETE /api/v1/therapists/:therapistId/availability/:slotId
 * Delete availability slot (admin/operator)
 */
router.delete('/:therapistId/availability/:slotId', requireAdminOrOperator, (req, res) =>
  therapistAvailabilityController.deleteAvailability(req, res)
);

export default router;
