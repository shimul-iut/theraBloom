import { Router } from 'express';
import { therapyTypesController } from './therapy-types.controller';
import { authenticate } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/rbac';
import { setAuditContext } from '../../middleware/audit.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Set audit context after authentication
router.use(setAuditContext);

/**
 * GET /api/v1/therapy-types
 * List all therapy types
 */
router.get('/', (req, res) => therapyTypesController.getTherapyTypes(req, res));

/**
 * GET /api/v1/therapy-types/:id
 * Get therapy type by ID
 */
router.get('/:id', (req, res) => therapyTypesController.getTherapyTypeById(req, res));

/**
 * POST /api/v1/therapy-types
 * Create new therapy type (admin only)
 */
router.post('/', requireAdmin, (req, res) => therapyTypesController.createTherapyType(req, res));

/**
 * PUT /api/v1/therapy-types/:id
 * Update therapy type (admin only)
 */
router.put('/:id', requireAdmin, (req, res) =>
  therapyTypesController.updateTherapyType(req, res)
);

/**
 * DELETE /api/v1/therapy-types/:id
 * Delete therapy type (admin only)
 */
router.delete('/:id', requireAdmin, (req, res) =>
  therapyTypesController.deleteTherapyType(req, res)
);

export default router;
