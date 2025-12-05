import prisma from '../../config/database';
import { CreateTherapyTypeInput, UpdateTherapyTypeInput } from './therapy-types.schema';

export class TherapyTypesService {
  /**
   * Get all therapy types
   */
  async getTherapyTypes(tenantId: string, activeOnly = false) {
    const where: any = { tenantId };

    if (activeOnly) {
      where.active = true;
    }

    const therapyTypes = await prisma.therapyType.findMany({
      where,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        defaultDuration: true,
        defaultCost: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            Session: true,
            TherapistPricing: true,
          },
        },
      },
    });

    return therapyTypes;
  }

  /**
   * Get therapy type by ID
   */
  async getTherapyTypeById(tenantId: string, therapyTypeId: string) {
    const therapyType = await prisma.therapyType.findFirst({
      where: {
        id: therapyTypeId,
        tenantId,
      },
      include: {
        _count: {
          select: {
            Session: true,
            TherapistPricing: true,
            TherapistAvailability: true,
          },
        },
      },
    });

    if (!therapyType) {
      throw new Error('Therapy type not found');
    }

    return therapyType;
  }

  /**
   * Create new therapy type
   */
  async createTherapyType(tenantId: string, input: CreateTherapyTypeInput) {
    // Check if therapy type with same name already exists
    const existing = await prisma.therapyType.findFirst({
      where: {
        tenantId,
        name: input.name,
      },
    });

    if (existing) {
      throw new Error('Therapy type with this name already exists');
    }

    const therapyType = await prisma.therapyType.create({
      data: {
        id: crypto.randomUUID(),
        tenantId,
        name: input.name,
        description: input.description || null,
        defaultDuration: input.defaultDuration,
        defaultCost: input.defaultCost,
        active: true,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        description: true,
        defaultDuration: true,
        defaultCost: true,
        active: true,
        createdAt: true,
      },
    });

    return therapyType;
  }

  /**
   * Update therapy type
   */
  async updateTherapyType(
    tenantId: string,
    therapyTypeId: string,
    input: UpdateTherapyTypeInput
  ) {
    // Check if therapy type exists
    const existing = await prisma.therapyType.findFirst({
      where: {
        id: therapyTypeId,
        tenantId,
      },
    });

    if (!existing) {
      throw new Error('Therapy type not found');
    }

    // If name is being updated, check for duplicates
    if (input.name && input.name !== existing.name) {
      const duplicate = await prisma.therapyType.findFirst({
        where: {
          tenantId,
          name: input.name,
          id: { not: therapyTypeId },
        },
      });

      if (duplicate) {
        throw new Error('Therapy type with this name already exists');
      }
    }

    const therapyType = await prisma.therapyType.update({
      where: { id: therapyTypeId },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.description !== undefined && { description: input.description || null }),
        ...(input.defaultDuration && { defaultDuration: input.defaultDuration }),
        ...(input.defaultCost && { defaultCost: input.defaultCost }),
        ...(input.active !== undefined && { active: input.active }),
      },
      select: {
        id: true,
        name: true,
        description: true,
        defaultDuration: true,
        defaultCost: true,
        active: true,
        updatedAt: true,
      },
    });

    return therapyType;
  }

  /**
   * Delete therapy type (with validation)
   */
  async deleteTherapyType(tenantId: string, therapyTypeId: string) {
    // Check if therapy type exists
    const therapyType = await prisma.therapyType.findFirst({
      where: {
        id: therapyTypeId,
        tenantId,
      },
      include: {
        _count: {
          select: {
            Session: true,
          },
        },
      },
    });

    if (!therapyType) {
      throw new Error('Therapy type not found');
    }

    // Prevent deletion if there are active sessions
    if (therapyType._count.Session > 0) {
      throw new Error(
        'Cannot delete therapy type with existing sessions. Deactivate it instead.'
      );
    }

    await prisma.therapyType.delete({
      where: { id: therapyTypeId },
    });

    return { message: 'Therapy type deleted successfully' };
  }
}

export const therapyTypesService = new TherapyTypesService();
