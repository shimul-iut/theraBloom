import { Request, Response } from 'express';
import { authService } from './auth.service';
import { loginSchema, refreshTokenSchema } from './auth.schema';
import { logger } from '../../utils/logger';

export class AuthController {
  /**
   * POST /api/v1/auth/login
   */
  async login(req: Request, res: Response) {
    try {
      // Validate input
      const input = loginSchema.parse(req.body);

      // Login
      const result = await authService.login(input);

      logger.info(`User logged in: ${result.user.phoneNumber}`);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Login error:', error);

      if (error instanceof Error) {
        if (error.message.includes('Invalid credentials')) {
          return res.status(401).json({
            success: false,
            error: {
              code: 'INVALID_CREDENTIALS',
              message: 'Invalid phone number or password',
            },
          });
        }

        if (error.message.includes('inactive')) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'ACCOUNT_INACTIVE',
              message: error.message,
            },
          });
        }
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'LOGIN_FAILED',
          message: 'Login failed. Please try again.',
        },
      });
    }
  }

  /**
   * POST /api/v1/auth/refresh
   */
  async refresh(req: Request, res: Response) {
    try {
      // Validate input
      const input = refreshTokenSchema.parse(req.body);

      // Refresh token
      const result = await authService.refreshToken(input.refreshToken);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Token refresh error:', error);

      if (error instanceof Error) {
        if (
          error.message.includes('Invalid') ||
          error.message.includes('expired') ||
          error.message.includes('inactive')
        ) {
          return res.status(401).json({
            success: false,
            error: {
              code: 'INVALID_REFRESH_TOKEN',
              message: error.message,
            },
          });
        }
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'REFRESH_FAILED',
          message: 'Token refresh failed. Please login again.',
        },
      });
    }
  }

  /**
   * POST /api/v1/auth/logout
   */
  async logout(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      await authService.logout(req.user.userId);

      logger.info(`User logged out: ${req.user.phoneNumber}`);

      res.json({
        success: true,
        data: {
          message: 'Logged out successfully',
        },
      });
    } catch (error) {
      logger.error('Logout error:', error);

      res.status(500).json({
        success: false,
        error: {
          code: 'LOGOUT_FAILED',
          message: 'Logout failed. Please try again.',
        },
      });
    }
  }

  /**
   * GET /api/v1/auth/me
   */
  async getCurrentUser(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const user = await authService.getCurrentUser(req.user.userId);

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      logger.error('Get current user error:', error);

      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_USER_FAILED',
          message: 'Failed to fetch user information',
        },
      });
    }
  }
}

export const authController = new AuthController();
