import { Router } from 'express';
import { usersController } from './users.controller';
import { authenticate } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/rbac';
import { setAuditContext } from '../../middleware/audit.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Set audit context after authentication
router.use(setAuditContext);

/**
 * GET /api/v1/users
 * List all users (admin only)
 */
router.get('/', requireAdmin, (req, res) => usersController.getUsers(req, res));

/**
 * POST /api/v1/users
 * Create new user (admin only)
 */
router.post('/', requireAdmin, (req, res) => usersController.createUser(req, res));

/**
 * POST /api/v1/users/change-password
 * Change own password (any authenticated user)
 */
router.post('/change-password', (req, res) => usersController.changePassword(req, res));

/**
 * GET /api/v1/users/:id
 * Get user by ID (admin only)
 */
router.get('/:id', requireAdmin, (req, res) => usersController.getUserById(req, res));

/**
 * PUT /api/v1/users/:id
 * Update user (admin only)
 */
router.put('/:id', requireAdmin, (req, res) => usersController.updateUser(req, res));

/**
 * DELETE /api/v1/users/:id
 * Deactivate user (admin only)
 */
router.delete('/:id', requireAdmin, (req, res) => usersController.deactivateUser(req, res));

/**
 * POST /api/v1/users/:id/activate
 * Activate user (admin only)
 */
router.post('/:id/activate', requireAdmin, (req, res) => usersController.activateUser(req, res));

export default router;
