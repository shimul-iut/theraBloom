import prisma from '../../config/database';
import {
  CreateUnavailabilityInput,
  UpdateUnavailabilityInput,
} from './therapist-unavailability.schema';

export class TherapistUnavailabilityService {
  /**
   * Get therapist unavailability periods
   */
  async getTherapistUnavailability(
    tenantId: string,
    therapistId: string,
    startDate?: string,
    endDate?: string
  ) {
    const where: any = {
      tenantId,
      therapistId,
    };

    if (startDate || endDate) {
      where.OR = [
        {
          startDate: {
            gte: startDate ? new Date(startDate) : undefined,
            lte: endDate ? new Date(endDate) : undefined,
          },
        },
        {
          endDate: {
            gte: startDate ? new Date(startDate) : undefined,
            lte: endDate ? new Date(endDate) : undefined,
          },
        },
      ];
    }

    return prisma.therapistUnavailability.findMany({
      where,
      orderBy: { startDate: 'asc' },
    });
  }

  /**
   * Get unavailability by ID
   */
  async getUnavailabilityById(tenantId: string, therapistId: string, id: string) {
    const unavailability = await prisma.therapistUnavailability.findFirst({
      where: {
        id,
        tenantId,
        therapistId,
      },
    });

    if (!unavailability) {
      throw new Error('Unavailability period not found');
    }

    return unavailability;
  }

  /**
   * Get affected sessions for unavailability period
   */
  async getAffectedSessions(
    tenantId: string,
    therapistId: string,
    startDate: Date,
    endDate: Date,
    startTime?: string,
    endTime?: string
  ) {
    const where: any = {
      tenantId,
      therapistId,
      scheduledDate: {
        gte: startDate,
        lte: endDate,
      },
      status: {
        in: ['SCHEDULED'],
      },
    };

    // If specific time range provided, filter by time
    if (startTime && endTime) {
      where.AND = [
        {
          OR: [
            // Session starts within unavailable time
            {
              startTime: {
                gte: startTime,
                lt: endTime,
              },
            },
            // Session ends within unavailable time
            {
              endTime: {
                gt: startTime,
                lte: endTime,
              },
            },
            // Session spans the unavailable time
            {
              AND: [
                { startTime: { lte: startTime } },
                { endTime: { gte: endTime } },
              ],
            },
          ],
        },
      ];
    }

    return prisma.session.findMany({
      where,
      include: {
        Patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [{ scheduledDate: 'asc' }, { startTime: 'asc' }],
    });
  }

  /**
   * Get available time slots for rescheduling
   */
  async getAvailableRescheduleSlots(
    tenantId: string,
    therapistId: string,
    sessionDuration: number,
    startDate: Date,
    daysAhead: number = 30
  ) {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + daysAhead);

    // Get therapist availability
    const availability = await prisma.therapistAvailability.findMany({
      where: {
        tenantId,
        therapistId,
        active: true,
        slotType: 'AVAILABLE',
      },
    });

    // Get existing sessions
    const existingSessions = await prisma.session.findMany({
      where: {
        tenantId,
        therapistId,
        scheduledDate: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: ['SCHEDULED', 'COMPLETED'],
        },
      },
      select: {
        scheduledDate: true,
        startTime: true,
        endTime: true,
      },
    });

    // Get unavailability periods
    const unavailability = await prisma.therapistUnavailability.findMany({
      where: {
        tenantId,
        therapistId,
        OR: [
          {
            startDate: { lte: endDate },
            endDate: { gte: startDate },
          },
        ],
      },
    });

    // Generate available slots
    const availableSlots: Array<{
      date: string;
      startTime: string;
      endTime: string;
      dayOfWeek: string;
    }> = [];

    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dayOfWeek = this.getDayOfWeek(currentDate);
      const dateStr = currentDate.toISOString().split('T')[0];

      // Check if day has availability
      const dayAvailability = availability.filter((a) => a.dayOfWeek === dayOfWeek);

      for (const avail of dayAvailability) {
        // Generate time slots based on session duration
        const slots = this.generateTimeSlots(
          avail.startTime,
          avail.endTime,
          sessionDuration
        );

        for (const slot of slots) {
          // Check if slot is not booked
          const isBooked = existingSessions.some(
            (session) =>
              session.scheduledDate.toISOString().split('T')[0] === dateStr &&
              this.hasTimeOverlap(
                session.startTime,
                session.endTime,
                slot.startTime,
                slot.endTime
              )
          );

          // Check if slot is not in unavailability period
          const isUnavailable = unavailability.some((unavail) => {
            const unavailStart = unavail.startDate.toISOString().split('T')[0];
            const unavailEnd = unavail.endDate.toISOString().split('T')[0];

            if (dateStr < unavailStart || dateStr > unavailEnd) {
              return false;
            }

            // If specific time range, check time overlap
            if (unavail.startTime && unavail.endTime) {
              return this.hasTimeOverlap(
                unavail.startTime,
                unavail.endTime,
                slot.startTime,
                slot.endTime
              );
            }

            // Entire day unavailable
            return true;
          });

          if (!isBooked && !isUnavailable) {
            availableSlots.push({
              date: dateStr,
              startTime: slot.startTime,
              endTime: slot.endTime,
              dayOfWeek,
            });
          }
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return availableSlots;
  }

  /**
   * Create unavailability period
   */
  async createUnavailability(
    tenantId: string,
    therapistId: string,
    input: CreateUnavailabilityInput
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

    // Get affected sessions
    const affectedSessions = await this.getAffectedSessions(
      tenantId,
      therapistId,
      new Date(input.startDate),
      new Date(input.endDate),
      input.startTime || undefined,
      input.endTime || undefined
    );

    if (affectedSessions.length > 0 && !input.rescheduleSessionIds) {
      throw new Error(
        `There are ${affectedSessions.length} scheduled sessions during this period. Please provide reschedule information.`
      );
    }

    // Create unavailability
    const unavailability = await prisma.therapistUnavailability.create({
      data: {
        tenantId,
        therapistId,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        startTime: input.startTime || null,
        endTime: input.endTime || null,
        reason: input.reason,
        notes: input.notes || null,
      },
    });

    return {
      unavailability,
      affectedSessions,
    };
  }

  /**
   * Update unavailability period
   */
  async updateUnavailability(
    tenantId: string,
    therapistId: string,
    id: string,
    input: UpdateUnavailabilityInput
  ) {
    const existing = await this.getUnavailabilityById(tenantId, therapistId, id);

    const unavailability = await prisma.therapistUnavailability.update({
      where: { id: existing.id },
      data: {
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined,
        startTime: input.startTime !== undefined ? input.startTime : undefined,
        endTime: input.endTime !== undefined ? input.endTime : undefined,
        reason: input.reason,
        notes: input.notes !== undefined ? input.notes : undefined,
      },
    });

    return unavailability;
  }

  /**
   * Delete unavailability period
   */
  async deleteUnavailability(tenantId: string, therapistId: string, id: string) {
    const existing = await this.getUnavailabilityById(tenantId, therapistId, id);

    await prisma.therapistUnavailability.delete({
      where: { id: existing.id },
    });

    return { message: 'Unavailability period deleted successfully' };
  }

  /**
   * Helper: Get day of week
   */
  private getDayOfWeek(date: Date): string {
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    return days[date.getDay()];
  }

  /**
   * Helper: Generate time slots
   */
  private generateTimeSlots(
    startTime: string,
    endTime: string,
    duration: number
  ): Array<{ startTime: string; endTime: string }> {
    const slots: Array<{ startTime: string; endTime: string }> = [];
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    let currentMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    while (currentMinutes + duration <= endMinutes) {
      const slotStartHour = Math.floor(currentMinutes / 60);
      const slotStartMin = currentMinutes % 60;
      const slotEndMinutes = currentMinutes + duration;
      const slotEndHour = Math.floor(slotEndMinutes / 60);
      const slotEndMin = slotEndMinutes % 60;

      slots.push({
        startTime: `${String(slotStartHour).padStart(2, '0')}:${String(slotStartMin).padStart(2, '0')}`,
        endTime: `${String(slotEndHour).padStart(2, '0')}:${String(slotEndMin).padStart(2, '0')}`,
      });

      currentMinutes += duration;
    }

    return slots;
  }

  /**
   * Helper: Check time overlap
   */
  private hasTimeOverlap(
    start1: string,
    end1: string,
    start2: string,
    end2: string
  ): boolean {
    return start1 < end2 && start2 < end1;
  }
}

export const therapistUnavailabilityService = new TherapistUnavailabilityService();
