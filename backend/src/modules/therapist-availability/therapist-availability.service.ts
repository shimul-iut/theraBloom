import prisma from '../../config/database';
import { CreateAvailabilityInput, UpdateAvailabilityInput } from './therapist-availability.schema';
import { DayOfWeek } from '@prisma/client';

export class TherapistAvailabilityService {
  /**
   * Get therapist availability
   */
  async getTherapistAvailability(
    tenantId: string,
    therapistId: string,
    dayOfWeek?: DayOfWeek,
    therapyTypeId?: string
  ) {
    const where: any = {
      tenantId,
      therapistId,
      active: true,
    };

    if (dayOfWeek) {
      where.dayOfWeek = dayOfWeek;
    }

    if (therapyTypeId) {
      where.therapyTypeId = therapyTypeId;
    }

    const availability = await prisma.therapistAvailability.findMany({
      where,
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      include: {
        therapyType: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return availability;
  }

  /**
   * Get availability slot by ID
   */
  async getAvailabilityById(tenantId: string, therapistId: string, slotId: string) {
    const slot = await prisma.therapistAvailability.findFirst({
      where: {
        id: slotId,
        tenantId,
        therapistId,
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

    if (!slot) {
      throw new Error('Availability slot not found');
    }

    return slot;
  }

  /**
   * Create availability slot
   */
  async createAvailability(
    tenantId: string,
    therapistId: string,
    input: CreateAvailabilityInput
  ) {
    // Verify therapist exists and belongs to tenant
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

    // Check for overlapping slots
    const hasOverlap = await this.checkTimeOverlap(
      tenantId,
      therapistId,
      input.therapyTypeId,
      input.dayOfWeek,
      input.startTime,
      input.endTime
    );

    if (hasOverlap) {
      throw new Error('Time slot overlaps with existing availability');
    }

    const availability = await prisma.therapistAvailability.create({
      data: {
        tenantId,
        therapistId,
        therapyTypeId: input.therapyTypeId,
        dayOfWeek: input.dayOfWeek,
        startTime: input.startTime,
        endTime: input.endTime,
        slotType: input.slotType || 'AVAILABLE',
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

    return availability;
  }

  /**
   * Update availability slot
   */
  async updateAvailability(
    tenantId: string,
    therapistId: string,
    slotId: string,
    input: UpdateAvailabilityInput
  ) {
    // Check if slot exists
    const existing = await prisma.therapistAvailability.findFirst({
      where: {
        id: slotId,
        tenantId,
        therapistId,
      },
    });

    if (!existing) {
      throw new Error('Availability slot not found');
    }

    // If time is being updated, check for overlaps
    if (input.startTime || input.endTime || input.dayOfWeek) {
      const startTime = input.startTime || existing.startTime;
      const endTime = input.endTime || existing.endTime;
      const dayOfWeek = input.dayOfWeek || existing.dayOfWeek;

      const hasOverlap = await this.checkTimeOverlap(
        tenantId,
        therapistId,
        existing.therapyTypeId,
        dayOfWeek,
        startTime,
        endTime,
        slotId // Exclude current slot from overlap check
      );

      if (hasOverlap) {
        throw new Error('Time slot overlaps with existing availability');
      }
    }

    const availability = await prisma.therapistAvailability.update({
      where: { id: slotId },
      data: {
        ...(input.dayOfWeek && { dayOfWeek: input.dayOfWeek }),
        ...(input.startTime && { startTime: input.startTime }),
        ...(input.endTime && { endTime: input.endTime }),
        ...(input.slotType && { slotType: input.slotType }),
        ...(input.active !== undefined && { active: input.active }),
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

    return availability;
  }

  /**
   * Delete availability slot
   */
  async deleteAvailability(tenantId: string, therapistId: string, slotId: string) {
    const slot = await prisma.therapistAvailability.findFirst({
      where: {
        id: slotId,
        tenantId,
        therapistId,
      },
    });

    if (!slot) {
      throw new Error('Availability slot not found');
    }

    await prisma.therapistAvailability.delete({
      where: { id: slotId },
    });

    return { message: 'Availability slot deleted successfully' };
  }

  /**
   * Check for time slot overlap
   */
  private async checkTimeOverlap(
    tenantId: string,
    therapistId: string,
    therapyTypeId: string,
    dayOfWeek: DayOfWeek,
    startTime: string,
    endTime: string,
    excludeSlotId?: string
  ): Promise<boolean> {
    const where: any = {
      tenantId,
      therapistId,
      therapyTypeId,
      dayOfWeek,
      active: true,
    };

    if (excludeSlotId) {
      where.id = { not: excludeSlotId };
    }

    const existingSlots = await prisma.therapistAvailability.findMany({
      where,
      select: {
        startTime: true,
        endTime: true,
      },
    });

    // Convert time strings to minutes for comparison
    const [newStartHour, newStartMin] = startTime.split(':').map(Number);
    const [newEndHour, newEndMin] = endTime.split(':').map(Number);
    const newStart = newStartHour * 60 + newStartMin;
    const newEnd = newEndHour * 60 + newEndMin;

    for (const slot of existingSlots) {
      const [existingStartHour, existingStartMin] = slot.startTime.split(':').map(Number);
      const [existingEndHour, existingEndMin] = slot.endTime.split(':').map(Number);
      const existingStart = existingStartHour * 60 + existingStartMin;
      const existingEnd = existingEndHour * 60 + existingEndMin;

      // Check for overlap
      if (
        (newStart >= existingStart && newStart < existingEnd) ||
        (newEnd > existingStart && newEnd <= existingEnd) ||
        (newStart <= existingStart && newEnd >= existingEnd)
      ) {
        return true;
      }
    }

    return false;
  }
}

export const therapistAvailabilityService = new TherapistAvailabilityService();
