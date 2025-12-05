import { Request, Response } from 'express';
import { usersService } from './users.service';
import { createUserSchema, updateUserSchema, changePasswordSchema } from './users.schema';
import { getTenantId, getUserId } from '../../middleware/tenant';
import { logger } from '../../utils/logger';
import { UserRole } from '@prisma/client';

export class UsersController {
    /**
     * GET /api/v1/users
     */
    async getUsers(req: Request, res: Response) {
        try {
            const tenantId = getTenantId(req);
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const role = req.query.role as UserRole | undefined;

            const result = await usersService.getUsers(tenantId, page, limit, role);

            return res.json({
                success: true,
                data: result,
            });
        } catch (error) {
            logger.error('Get users error:', error);
            return res.status(500).json({
                success: false,
                error: {
                    code: 'FETCH_USERS_FAILED',
                    message: 'Failed to fetch users',
                },
            });
        }
    }

    /**
     * GET /api/v1/users/:id
     */
    async getUserById(req: Request, res: Response) {
        try {
            const tenantId = getTenantId(req);
            const userId = req.params.id;

            const user = await usersService.getUserById(tenantId, userId);

            return res.json({
                success: true,
                data: user,
            });
        } catch (error) {
            logger.error('Get user error:', error);

            if (error instanceof Error && error.message === 'User not found') {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'USER_NOT_FOUND',
                        message: 'User not found',
                    },
                });
            }

            return res.status(500).json({
                success: false,
                error: {
                    code: 'FETCH_USER_FAILED',
                    message: 'Failed to fetch user',
                },
            });
        }
    }

    /**
     * POST /api/v1/users
     */
    async createUser(req: Request, res: Response) {
        try {
            const tenantId = getTenantId(req);
            const input = createUserSchema.parse(req.body);

            const user = await usersService.createUser(tenantId, input, req.auditContext);

            logger.info(`User created: ${user.phoneNumber} by ${req.user?.phoneNumber}`);

            return res.status(201).json({
                success: true,
                data: user,
            });
        } catch (error) {
            logger.error('Create user error:', error);

            if (error instanceof Error) {
                if (error.message === 'Phone number already exists') {
                    return res.status(409).json({
                        success: false,
                        error: {
                            code: 'PHONE_EXISTS',
                            message: 'Phone number already exists',
                        },
                    });
                }
            }

            return res.status(500).json({
                success: false,
                error: {
                    code: 'CREATE_USER_FAILED',
                    message: 'Failed to create user',
                },
            });
        }
    }

    /**
     * PUT /api/v1/users/:id
     */
    async updateUser(req: Request, res: Response) {
        try {
            const tenantId = getTenantId(req);
            const userId = req.params.id;
            const input = updateUserSchema.parse(req.body);

            const user = await usersService.updateUser(tenantId, userId, input, req.auditContext);

            logger.info(`User updated: ${userId} by ${req.user?.phoneNumber}`);

            return res.json({
                success: true,
                data: user,
            });
        } catch (error) {
            logger.error('Update user error:', error);

            if (error instanceof Error) {
                if (error.message === 'User not found') {
                    return res.status(404).json({
                        success: false,
                        error: {
                            code: 'USER_NOT_FOUND',
                            message: 'User not found',
                        },
                    });
                }

                if (error.message === 'Phone number already exists') {
                    return res.status(409).json({
                        success: false,
                        error: {
                            code: 'PHONE_EXISTS',
                            message: 'Phone number already exists',
                        },
                    });
                }
            }

            return res.status(500).json({
                success: false,
                error: {
                    code: 'UPDATE_USER_FAILED',
                    message: 'Failed to update user',
                },
            });
        }
    }

    /**
     * DELETE /api/v1/users/:id
     */
    async deactivateUser(req: Request, res: Response) {
        try {
            const tenantId = getTenantId(req);
            const userId = req.params.id;

            // Prevent self-deactivation
            if (userId === req.user?.userId) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'CANNOT_DEACTIVATE_SELF',
                        message: 'You cannot deactivate your own account',
                    },
                });
            }

            const result = await usersService.deactivateUser(tenantId, userId, req.auditContext);

            logger.info(`User deactivated: ${userId} by ${req.user?.phoneNumber}`);

            return res.json({
                success: true,
                data: result,
            });
        } catch (error) {
            logger.error('Deactivate user error:', error);

            if (error instanceof Error) {
                if (error.message === 'User not found') {
                    return res.status(404).json({
                        success: false,
                        error: {
                            code: 'USER_NOT_FOUND',
                            message: 'User not found',
                        },
                    });
                }

                if (error.message === 'User is already inactive') {
                    return res.status(400).json({
                        success: false,
                        error: {
                            code: 'USER_ALREADY_INACTIVE',
                            message: 'User is already inactive',
                        },
                    });
                }
            }

            return res.status(500).json({
                success: false,
                error: {
                    code: 'DEACTIVATE_USER_FAILED',
                    message: 'Failed to deactivate user',
                },
            });
        }
    }

    /**
     * POST /api/v1/users/:id/activate
     */
    async activateUser(req: Request, res: Response) {
        try {
            const tenantId = getTenantId(req);
            const userId = req.params.id;

            const result = await usersService.activateUser(tenantId, userId, req.auditContext);

            logger.info(`User activated: ${userId} by ${req.user?.phoneNumber}`);

            return res.json({
                success: true,
                data: result,
            });
        } catch (error) {
            logger.error('Activate user error:', error);

            if (error instanceof Error) {
                if (error.message === 'User not found') {
                    return res.status(404).json({
                        success: false,
                        error: {
                            code: 'USER_NOT_FOUND',
                            message: 'User not found',
                        },
                    });
                }

                if (error.message === 'User is already active') {
                    return res.status(400).json({
                        success: false,
                        error: {
                            code: 'USER_ALREADY_ACTIVE',
                            message: 'User is already active',
                        },
                    });
                }
            }

            return res.status(500).json({
                success: false,
                error: {
                    code: 'ACTIVATE_USER_FAILED',
                    message: 'Failed to activate user',
                },
            });
        }
    }

    /**
     * POST /api/v1/users/change-password
     */
    async changePassword(req: Request, res: Response) {
        try {
            const userId = getUserId(req);
            const input = changePasswordSchema.parse(req.body);

            const result = await usersService.changePassword(userId, input, req.auditContext);

            logger.info(`Password changed for user: ${userId}`);

            return res.json({
                success: true,
                data: result,
            });
        } catch (error) {
            logger.error('Change password error:', error);

            if (error instanceof Error) {
                if (error.message === 'Current password is incorrect') {
                    return res.status(400).json({
                        success: false,
                        error: {
                            code: 'INVALID_PASSWORD',
                            message: 'Current password is incorrect',
                        },
                    });
                }
            }

            return res.status(500).json({
                success: false,
                error: {
                    code: 'CHANGE_PASSWORD_FAILED',
                    message: 'Failed to change password',
                },
            });
        }
    }
}

export const usersController = new UsersController();
