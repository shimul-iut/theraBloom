import { Router } from 'express';
import { therapistUnavailabilityController } from './therapist-unavailability.controller';
import { authenticate } from '../../middleware/auth';
import { requireAdminOrOperator } from '../../middleware/rbac';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/therapists/:therapistId/unavailability
 * Get therapist unavailability periods
 */
router.get('/:therapistId/unavailability', (req, res) =>
  therapistUnavailabilityController.getTherapistUnavailability(req, res)
);

/**
 * GET /api/v1/therapists/:therapistId/unavailability/affected-sessions
 * Get sessions affected by unavailability period
 */
router.get('/:therapistId/unavailability/affected-sessions', (req, res) =>
  therapistUnavailabilityController.getAffectedSessions(req, res)
);

/**
 * GET /api/v1/therapists/:therapistId/unavailability/reschedule-slots
 * Get available slots for rescheduling
 */
router.get('/:therapistId/unavailability/reschedule-slots', (req, res) =>
  therapistUnavailabilityController.getAvailableRescheduleSlots(req, res)
);

/**
 * GET /api/v1/therapists/:therapistId/unavailability/:id
 * Get unavailability period by ID
 */
router.get('/:therapistId/unavailability/:id', (req, res) =>
  therapistUnavailabilityController.getUnavailabilityById(req, res)
);

/**
 * POST /api/v1/therapists/:therapistId/unavailability
 * Create unavailability period (admin/operator)
 */
router.post('/:therapistId/unavailability', requireAdminOrOperator, (req, res) =>
  therapistUnavailabilityController.createUnavailability(req, res)
);

/**
 * PUT /api/v1/therapists/:therapistId/unavailability/:id
 * Update unavailability period (admin/operator)
 */
router.put('/:therapistId/unavailability/:id', requireAdminOrOperator, (req, res) =>
  therapistUnavailabilityController.updateUnavailability(req, res)
);

/**
 * DELETE /api/v1/therapists/:therapistId/unavailability/:id
 * Delete unavailability period (admin/operator)
 */
router.delete('/:therapistId/unavailability/:id', requireAdminOrOperator, (req, res) =>
  therapistUnavailabilityController.deleteUnavailability(req, res)
);

export default router;
