import prisma from '../../config/database';
import { hashPassword, comparePassword } from '../../utils/password';
import { CreateUserInput, UpdateUserInput, ChangePasswordInput } from './users.schema';
import { UserRole } from '@prisma/client';
import { auditLogsService } from '../audit-logs/audit-logs.service';
import { AuditContext } from '../../middleware/audit.middleware';

export class UsersService {
  /**
   * Get all users (with pagination)
   */
  async getUsers(tenantId: string, page = 1, limit = 20, role?: UserRole) {
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (role) {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          phoneNumber: true,
          firstName: true,
          lastName: true,
          role: true,
          specializationId: true,
          TherapyType: {
            select: {
              id: true,
              name: true,
            },
          },
          sessionDuration: true,
          sessionCost: true,
          active: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(tenantId: string, userId: string) {
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        tenantId,
      },
      select: {
        id: true,
        phoneNumber: true,
        firstName: true,
        lastName: true,
        role: true,
        specializationId: true,
        TherapyType: {
          select: {
            id: true,
            name: true,
          },
        },
        sessionDuration: true,
        sessionCost: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  /**
   * Create new user
   */
  async createUser(tenantId: string, input: CreateUserInput, auditContext?: AuditContext) {
    // Check if phone number already exists in this tenant
    const existingPhone = await prisma.user.findFirst({
      where: {
        phoneNumber: input.phoneNumber,
        tenantId,
      },
    });

    if (existingPhone) {
      throw new Error('Phone number already exists');
    }

    // Hash password
    const passwordHash = await hashPassword(input.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        tenantId,
        phoneNumber: input.phoneNumber,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        role: input.role,
        active: true,
        // Therapist-specific fields
        ...(input.specializationId && { specializationId: input.specializationId }),
        ...(input.sessionDuration && { sessionDuration: input.sessionDuration }),
        ...(input.sessionCost && { sessionCost: input.sessionCost }),
      },
      select: {
        id: true,
        phoneNumber: true,
        firstName: true,
        lastName: true,
        role: true,
        specializationId: true,
        TherapyType: {
          select: {
            id: true,
            name: true,
          },
        },
        sessionDuration: true,
        sessionCost: true,
        active: true,
        createdAt: true,
      },
    });

    // Log audit trail
    if (auditContext) {
      await auditLogsService.logAction(
        tenantId,
        auditContext.userId,
        'CREATE',
        'User',
        user.id,
        undefined,
        {
          ip: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
        }
      );
    }

    return user;
  }

  /**
   * Update user
   */
  async updateUser(tenantId: string, userId: string, input: UpdateUserInput, auditContext?: AuditContext) {
    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        id: userId,
        tenantId,
      },
    });

    if (!existingUser) {
      throw new Error('User not found');
    }

    // If phone number is being updated, check for duplicates
    if (input.phoneNumber && input.phoneNumber !== existingUser.phoneNumber) {
      const phoneExists = await prisma.user.findFirst({
        where: {
          phoneNumber: input.phoneNumber,
          tenantId,
          id: { not: userId },
        },
      });

      if (phoneExists) {
        throw new Error('Phone number already exists');
      }
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(input.phoneNumber && { phoneNumber: input.phoneNumber }),
        ...(input.firstName && { firstName: input.firstName }),
        ...(input.lastName && { lastName: input.lastName }),
        ...(input.role && { role: input.role }),
        ...(input.active !== undefined && { active: input.active }),
        // Therapist-specific fields
        ...(input.specializationId !== undefined && { specializationId: input.specializationId }),
        ...(input.sessionDuration !== undefined && { sessionDuration: input.sessionDuration }),
        ...(input.sessionCost !== undefined && { sessionCost: input.sessionCost }),
      },
      select: {
        id: true,
        phoneNumber: true,
        firstName: true,
        lastName: true,
        role: true,
        specializationId: true,
        TherapyType: {
          select: {
            id: true,
            name: true,
          },
        },
        sessionDuration: true,
        sessionCost: true,
        active: true,
        updatedAt: true,
      },
    });

    // Calculate changes for audit log
    if (auditContext) {
      const changes: Record<string, { old: any; new: any }> = {};
      
      if (input.firstName && input.firstName !== existingUser.firstName) {
        changes.firstName = { old: existingUser.firstName, new: input.firstName };
      }
      if (input.lastName && input.lastName !== existingUser.lastName) {
        changes.lastName = { old: existingUser.lastName, new: input.lastName };
      }
      if (input.phoneNumber && input.phoneNumber !== existingUser.phoneNumber) {
        changes.phoneNumber = { old: existingUser.phoneNumber, new: input.phoneNumber };
      }
      if (input.role && input.role !== existingUser.role) {
        changes.role = { old: existingUser.role, new: input.role };
      }
      if (input.active !== undefined && input.active !== existingUser.active) {
        changes.active = { old: existingUser.active, new: input.active };
      }

      if (Object.keys(changes).length > 0) {
        await auditLogsService.logAction(
          tenantId,
          auditContext.userId,
          'UPDATE',
          'User',
          user.id,
          changes,
          {
            ip: auditContext.ipAddress,
            userAgent: auditContext.userAgent,
          }
        );
      }
    }

    return user;
  }

  /**
   * Deactivate user (soft delete)
   */
  async deactivateUser(tenantId: string, userId: string, auditContext?: AuditContext) {
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        tenantId,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.active) {
      throw new Error('User is already inactive');
    }

    await prisma.user.update({
      where: { id: userId },
      data: { active: false },
    });

    if (auditContext) {
      await auditLogsService.logAction(
        tenantId,
        auditContext.userId,
        'DELETE', // Using DELETE for deactivation as per requirement or convention
        'User',
        userId,
        { active: { old: true, new: false } },
        {
          ip: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
        }
      );
    }

    return { message: 'User deactivated successfully' };
  }

  /**
   * Activate user
   */
  async activateUser(tenantId: string, userId: string, auditContext?: AuditContext) {
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        tenantId,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.active) {
      throw new Error('User is already active');
    }

    await prisma.user.update({
      where: { id: userId },
      data: { active: true },
    });

    if (auditContext) {
      await auditLogsService.logAction(
        tenantId,
        auditContext.userId,
        'UPDATE',
        'User',
        userId,
        { active: { old: false, new: true } },
        {
          ip: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
        }
      );
    }

    return { message: 'User activated successfully' };
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, input: ChangePasswordInput, auditContext?: AuditContext) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValidPassword = await comparePassword(input.currentPassword, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await hashPassword(input.newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    if (auditContext) {
      await auditLogsService.logAction(
        user.tenantId,
        auditContext.userId,
        'UPDATE',
        'User',
        userId,
        { password: { old: '***', new: '***' } }, // Don't log actual password
        {
          ip: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
        }
      );
    }

    return { message: 'Password changed successfully' };
  }

  /**
   * Get users by role
   */
  async getUsersByRole(tenantId: string, role: UserRole) {
    return prisma.user.findMany({
      where: {
        tenantId,
        role,
        active: true,
      },
      select: {
        id: true,
        phoneNumber: true,
        firstName: true,
        lastName: true,
        role: true,
      },
      orderBy: { firstName: 'asc' },
    });
  }
}

export const usersService = new UsersService();
