import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

/**
 * POST /api/v1/auth/login
 * Login user
 */
router.post('/login', (req, res) => authController.login(req, res));

/**
 * POST /api/v1/auth/refresh
 * Refresh access token
 */
router.post('/refresh', (req, res) => authController.refresh(req, res));

/**
 * POST /api/v1/auth/logout
 * Logout user (requires authentication)
 */
router.post('/logout', authenticate, (req, res) => authController.logout(req, res));

/**
 * GET /api/v1/auth/me
 * Get current user info (requires authentication)
 */
router.get('/me', authenticate, (req, res) => authController.getCurrentUser(req, res));

export default router;
