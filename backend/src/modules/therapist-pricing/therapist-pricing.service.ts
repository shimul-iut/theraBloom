import prisma from '../../config/database';
import { CreatePricingInput, UpdatePricingInput } from './therapist-pricing.schema';

export class TherapistPricingService {
  /**
   * Get all therapist pricing
   */
  async getTherapistPricing(tenantId: string, therapistId: string) {
    // Verify therapist exists
    const therapist = await prisma.user.findFirst({
      where: {
        id: therapistId,
        tenantId,
        role: 'THERAPIST',
      },
    });

    if (!therapist) {
      throw new Error('Therapist not found');
    }

    const pricing = await prisma.therapistPricing.findMany({
      where: {
        tenantId,
        therapistId,
        active: true,
      },
      include: {
        therapyType: {
          select: {
            id: true,
            name: true,
            defaultDuration: true,
            defaultCost: true,
          },
        },
      },
      orderBy: {
        therapyType: {
          name: 'asc',
        },
      },
    });

    return pricing;
  }

  /**
   * Get pricing for specific therapy type
   * Returns therapist-specific pricing if exists, otherwise returns therapy type defaults
   */
  async getPricingForTherapyType(
    tenantId: string,
    therapistId: string,
    therapyTypeId: string
  ) {
    // Verify therapist exists
    const therapist = await prisma.user.findFirst({
      where: {
        id: therapistId,
        tenantId,
        role: 'THERAPIST',
      },
    });

    if (!therapist) {
      throw new Error('Therapist not found');
    }

    // Try to find therapist-specific pricing
    const therapistPricing = await prisma.therapistPricing.findFirst({
      where: {
        tenantId,
        therapistId,
        therapyTypeId,
        active: true,
      },
      include: {
        therapyType: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (therapistPricing) {
      return {
        source: 'therapist',
        pricing: therapistPricing,
      };
    }

    // Fallback to therapy type defaults
    const therapyType = await prisma.therapyType.findFirst({
      where: {
        id: therapyTypeId,
        tenantId,
        active: true,
      },
    });

    if (!therapyType) {
      throw new Error('Therapy type not found');
    }

    return {
      source: 'default',
      pricing: {
        therapyType: {
          id: therapyType.id,
          name: therapyType.name,
        },
        sessionDuration: therapyType.defaultDuration,
        sessionCost: therapyType.defaultCost,
      },
    };
  }

  /**
   * Get pricing by ID
   */
  async getPricingById(tenantId: string, therapistId: string, pricingId: string) {
    const pricing = await prisma.therapistPricing.findFirst({
      where: {
        id: pricingId,
        tenantId,
        therapistId,
      },
      include: {
        therapyType: {
          select: {
            id: true,
            name: true,
            defaultDuration: true,
            defaultCost: true,
          },
        },
      },
    });

    if (!pricing) {
      throw new Error('Pricing not found');
    }

    return pricing;
  }

  /**
   * Create therapist pricing
   */
  async createPricing(tenantId: string, therapistId: string, input: CreatePricingInput) {
    // Verify therapist exists
    const therapist = await prisma.user.findFirst({
      where: {
        id: therapistId,
        tenantId,
        role: 'THERAPIST',
        active: true,
      },
    });

    if (!therapist) {
      throw new Error('Therapist not found');
    }

    // Verify therapy type exists
    const therapyType = await prisma.therapyType.findFirst({
      where: {
        id: input.therapyTypeId,
        tenantId,
        active: true,
      },
    });

    if (!therapyType) {
      throw new Error('Therapy type not found');
    }

    // Check if pricing already exists for this combination
    const existing = await prisma.therapistPricing.findFirst({
      where: {
        tenantId,
        therapistId,
        therapyTypeId: input.therapyTypeId,
      },
    });

    if (existing) {
      throw new Error('Pricing already exists for this therapy type');
    }

    const pricing = await prisma.therapistPricing.create({
      data: {
        tenantId,
        therapistId,
        therapyTypeId: input.therapyTypeId,
        sessionDuration: input.sessionDuration,
        sessionCost: input.sessionCost,
        active: true,
      },
      include: {
        therapyType: {
          select: {
            id: true,
            name: true,
            defaultDuration: true,
            defaultCost: true,
          },
        },
      },
    });

    return pricing;
  }

  /**
   * Update therapist pricing
   */
  async updatePricing(
    tenantId: string,
    therapistId: string,
    pricingId: string,
    input: UpdatePricingInput
  ) {
    // Check if pricing exists
    const existing = await prisma.therapistPricing.findFirst({
      where: {
        id: pricingId,
        tenantId,
        therapistId,
      },
    });

    if (!existing) {
      throw new Error('Pricing not found');
    }

    const pricing = await prisma.therapistPricing.update({
      where: { id: pricingId },
      data: {
        ...(input.sessionDuration && { sessionDuration: input.sessionDuration }),
        ...(input.sessionCost && { sessionCost: input.sessionCost }),
        ...(input.active !== undefined && { active: input.active }),
      },
      include: {
        therapyType: {
          select: {
            id: true,
            name: true,
            defaultDuration: true,
            defaultCost: true,
          },
        },
      },
    });

    return pricing;
  }

  /**
   * Delete therapist pricing
   */
  async deletePricing(tenantId: string, therapistId: string, pricingId: string) {
    const pricing = await prisma.therapistPricing.findFirst({
      where: {
        id: pricingId,
        tenantId,
        therapistId,
      },
    });

    if (!pricing) {
      throw new Error('Pricing not found');
    }

    await prisma.therapistPricing.delete({
      where: { id: pricingId },
    });

    return { message: 'Pricing deleted successfully' };
  }
}

export const therapistPricingService = new TherapistPricingService();
