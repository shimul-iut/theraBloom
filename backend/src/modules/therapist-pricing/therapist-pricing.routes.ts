import { Router } from 'express';
import { therapistPricingController } from './therapist-pricing.controller';
import { authenticate } from '../../middleware/auth';
import { requireAdminOrOperator } from '../../middleware/rbac';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/therapists/:therapistId/pricing
 * Get all therapist pricing
 */
router.get('/:therapistId/pricing', (req, res) =>
  therapistPricingController.getTherapistPricing(req, res)
);

/**
 * GET /api/v1/therapists/:therapistId/pricing/:therapyTypeId
 * Get pricing for specific therapy type (with fallback to defaults)
 */
router.get('/:therapistId/pricing/:therapyTypeId', (req, res) =>
  therapistPricingController.getPricingForTherapyType(req, res)
);

/**
 * POST /api/v1/therapists/:therapistId/pricing
 * Create therapist pricing (admin/operator)
 */
router.post('/:therapistId/pricing', requireAdminOrOperator, (req, res) =>
  therapistPricingController.createPricing(req, res)
);

/**
 * PUT /api/v1/therapists/:therapistId/pricing/:pricingId
 * Update therapist pricing (admin/operator)
 */
router.put('/:therapistId/pricing/:pricingId', requireAdminOrOperator, (req, res) =>
  therapistPricingController.updatePricing(req, res)
);

/**
 * DELETE /api/v1/therapists/:therapistId/pricing/:pricingId
 * Delete therapist pricing (admin/operator)
 */
router.delete('/:therapistId/pricing/:pricingId', requireAdminOrOperator, (req, res) =>
  therapistPricingController.deletePricing(req, res)
);

export default router;
