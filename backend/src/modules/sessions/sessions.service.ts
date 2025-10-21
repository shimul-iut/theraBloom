import prisma from '../../config/database';
import { CreateSessionInput, UpdateSessionInput, CancelSessionInput } from './sessions.schema';
import { SessionStatus, DayOfWeek } from '@prisma/client';
import { therapistPricingService } from '../therapist-pricing/therapist-pricing.service';

export class SessionsService {
  /**
   * Get sessions with filters and pagination
   */
  async getSessions(
    tenantId: string,
    filters: {
      patientId?: string;
      therapistId?: string;
      therapyTypeId?: string;
      status?: SessionStatus;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };

    if (filters.patientId) where.patientId = filters.patientId;
    if (filters.therapistId) where.therapistId = filters.therapistId;
    if (filters.therapyTypeId) where.therapyTypeId = filters.therapyTypeId;
    if (filters.status) where.status = filters.status;

    if (filters.startDate || filters.endDate) {
      where.scheduledDate = {};
      if (filters.startDate) where.scheduledDate.gte = new Date(filters.startDate);
      if (filters.endDate) where.scheduledDate.lte = new Date(filters.endDate);
    }

    const [sessions, total] = await Promise.all([
      prisma.session.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduledDate: 'desc' },
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          therapist: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          therapyType: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.session.count({ where }),
    ]);

    return {
      sessions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get session by ID
   */
  async getSessionById(tenantId: string, sessionId: string) {
    const session = await prisma.session.findFirst({
      where: {
        id: sessionId,
        tenantId,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            guardianName: true,
            guardianPhone: true,
          },
        },
        therapist: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        therapyType: {
          select: {
            id: true,
            name: true,
            defaultDuration: true,
            defaultCost: true,
          },
        },
        sessionPayments: true,
        progressReports: {
          select: {
            id: true,
            reportDate: true,
            notes: true,
          },
        },
      },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    return session;
  }

  /**
   * Create new session with availability validation and pricing lookup
   */
  async createSession(tenantId: string, input: CreateSessionInput) {
    // Verify patient exists
    const patient = await prisma.patient.findFirst({
      where: { id: input.patientId, tenantId, active: true },
    });

    if (!patient) {
      throw new Error('Patient not found');
    }

    // Verify therapist exists
    const therapist = await prisma.user.findFirst({
      where: { id: input.therapistId, tenantId, role: 'THERAPIST', active: true },
    });

    if (!therapist) {
      throw new Error('Therapist not found');
    }

    // Verify therapy type exists
    const therapyType = await prisma.therapyType.findFirst({
      where: { id: input.therapyTypeId, tenantId, active: true },
    });

    if (!therapyType) {
      throw new Error('Therapy type not found');
    }

    // Validate therapist availability
    const scheduledDate = new Date(input.scheduledDate);
    const dayOfWeek = this.getDayOfWeek(scheduledDate);

    const isAvailable = await this.checkTherapistAvailability(
      tenantId,
      input.therapistId,
      input.therapyTypeId,
      dayOfWeek,
      input.startTime,
      input.endTime
    );

    if (!isAvailable) {
      throw new Error('Therapist is not available at the requested time');
    }

    // Check for scheduling conflicts
    const hasConflict = await this.checkSchedulingConflict(
      tenantId,
      input.therapistId,
      scheduledDate,
      input.startTime,
      input.endTime
    );

    if (hasConflict) {
      throw new Error('Therapist already has a session scheduled at this time');
    }

    // Get pricing (therapist-specific or default)
    const pricingResult = await therapistPricingService.getPricingForTherapyType(
      tenantId,
      input.therapistId,
      input.therapyTypeId
    );

    const sessionCost = Number(pricingResult.pricing.sessionCost);

    // Check if patient has sufficient credit if paying with credit
    if (input.paidWithCredit && Number(patient.creditBalance) < sessionCost) {
      throw new Error('Insufficient credit balance');
    }

    // Create session
    const session = await prisma.session.create({
      data: {
        tenantId,
        patientId: input.patientId,
        therapistId: input.therapistId,
        therapyTypeId: input.therapyTypeId,
        scheduledDate,
        startTime: input.startTime,
        endTime: input.endTime,
        status: 'SCHEDULED',
        notes: input.notes || null,
        cost: sessionCost,
        paidWithCredit: input.paidWithCredit,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        therapist: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        therapyType: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // If paid with credit, deduct from patient's credit balance
    if (input.paidWithCredit) {
      await prisma.patient.update({
        where: { id: input.patientId },
        data: {
          creditBalance: {
            decrement: sessionCost,
          },
        },
      });
    }

    return session;
  }

  /**
   * Update session (reschedule)
   */
  async updateSession(tenantId: string, sessionId: string, input: UpdateSessionInput) {
    // Get existing session
    const existing = await prisma.session.findFirst({
      where: { id: sessionId, tenantId },
    });

    if (!existing) {
      throw new Error('Session not found');
    }

    // Don't allow updates to completed or cancelled sessions
    if (existing.status === 'COMPLETED' || existing.status === 'CANCELLED') {
      throw new Error(`Cannot update ${existing.status.toLowerCase()} session`);
    }

    // If rescheduling, validate availability
    if (input.scheduledDate || input.startTime || input.endTime) {
      const scheduledDate = input.scheduledDate
        ? new Date(input.scheduledDate)
        : existing.scheduledDate;
      const startTime = input.startTime || existing.startTime;
      const endTime = input.endTime || existing.endTime;
      const dayOfWeek = this.getDayOfWeek(scheduledDate);

      const isAvailable = await this.checkTherapistAvailability(
        tenantId,
        existing.therapistId,
        existing.therapyTypeId,
        dayOfWeek,
        startTime,
        endTime
      );

      if (!isAvailable) {
        throw new Error('Therapist is not available at the requested time');
      }

      // Check for conflicts (excluding current session)
      const hasConflict = await this.checkSchedulingConflict(
        tenantId,
        existing.therapistId,
        scheduledDate,
        startTime,
        endTime,
        sessionId
      );

      if (hasConflict) {
        throw new Error('Therapist already has a session scheduled at this time');
      }
    }

    const session = await prisma.session.update({
      where: { id: sessionId },
      data: {
        ...(input.scheduledDate && { scheduledDate: new Date(input.scheduledDate) }),
        ...(input.startTime && { startTime: input.startTime }),
        ...(input.endTime && { endTime: input.endTime }),
        ...(input.status && { status: input.status }),
        ...(input.notes !== undefined && { notes: input.notes || null }),
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        therapist: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        therapyType: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return session;
  }

  /**
   * Cancel session with credit refund
   */
  async cancelSession(tenantId: string, sessionId: string, input: CancelSessionInput) {
    const session = await prisma.session.findFirst({
      where: { id: sessionId, tenantId },
      include: {
        patient: true,
      },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    if (session.status === 'CANCELLED') {
      throw new Error('Session is already cancelled');
    }

    if (session.status === 'COMPLETED') {
      throw new Error('Cannot cancel completed session');
    }

    // Update session status
    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: {
        status: 'CANCELLED',
        cancelReason: input.cancelReason,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        therapist: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        therapyType: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Refund credit if session was paid with credit
    if (session.paidWithCredit) {
      await prisma.patient.update({
        where: { id: session.patientId },
        data: {
          creditBalance: {
            increment: Number(session.cost),
          },
        },
      });
    }

    return updatedSession;
  }

  /**
   * Get calendar view data
   */
  async getCalendarSessions(
    tenantId: string,
    startDate: string,
    endDate: string,
    therapistId?: string
  ) {
    const where: any = {
      tenantId,
      scheduledDate: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
      status: {
        in: ['SCHEDULED', 'COMPLETED'],
      },
    };

    if (therapistId) {
      where.therapistId = therapistId;
    }

    const sessions = await prisma.session.findMany({
      where,
      orderBy: { scheduledDate: 'asc' },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        therapist: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        therapyType: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return sessions;
  }

  /**
   * Check therapist availability for given time slot
   */
  private async checkTherapistAvailability(
    tenantId: string,
    therapistId: string,
    therapyTypeId: string,
    dayOfWeek: DayOfWeek,
    startTime: string,
    endTime: string
  ): Promise<boolean> {
    const availability = await prisma.therapistAvailability.findFirst({
      where: {
        tenantId,
        therapistId,
        therapyTypeId,
        dayOfWeek,
        active: true,
      },
    });

    if (!availability) {
      return false;
    }

    // Convert times to minutes for comparison
    const [reqStartHour, reqStartMin] = startTime.split(':').map(Number);
    const [reqEndHour, reqEndMin] = endTime.split(':').map(Number);
    const reqStart = reqStartHour * 60 + reqStartMin;
    const reqEnd = reqEndHour * 60 + reqEndMin;

    const [availStartHour, availStartMin] = availability.startTime.split(':').map(Number);
    const [availEndHour, availEndMin] = availability.endTime.split(':').map(Number);
    const availStart = availStartHour * 60 + availStartMin;
    const availEnd = availEndHour * 60 + availEndMin;

    // Check if requested time is within availability window
    return reqStart >= availStart && reqEnd <= availEnd;
  }

  /**
   * Check for scheduling conflicts
   */
  private async checkSchedulingConflict(
    tenantId: string,
    therapistId: string,
    scheduledDate: Date,
    startTime: string,
    endTime: string,
    excludeSessionId?: string
  ): Promise<boolean> {
    const where: any = {
      tenantId,
      therapistId,
      scheduledDate,
      status: {
        in: ['SCHEDULED', 'COMPLETED'],
      },
    };

    if (excludeSessionId) {
      where.id = { not: excludeSessionId };
    }

    const existingSessions = await prisma.session.findMany({
      where,
      select: {
        startTime: true,
        endTime: true,
      },
    });

    // Convert requested time to minutes
    const [reqStartHour, reqStartMin] = startTime.split(':').map(Number);
    const [reqEndHour, reqEndMin] = endTime.split(':').map(Number);
    const reqStart = reqStartHour * 60 + reqStartMin;
    const reqEnd = reqEndHour * 60 + reqEndMin;

    // Check for overlaps
    for (const session of existingSessions) {
      const [existStartHour, existStartMin] = session.startTime.split(':').map(Number);
      const [existEndHour, existEndMin] = session.endTime.split(':').map(Number);
      const existStart = existStartHour * 60 + existStartMin;
      const existEnd = existEndHour * 60 + existEndMin;

      // Check for overlap
      if (
        (reqStart >= existStart && reqStart < existEnd) ||
        (reqEnd > existStart && reqEnd <= existEnd) ||
        (reqStart <= existStart && reqEnd >= existEnd)
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get day of week from date
   */
  private getDayOfWeek(date: Date): DayOfWeek {
    const days: DayOfWeek[] = [
      'SUNDAY',
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
    ];
    return days[date.getDay()];
  }
}

export const sessionsService = new SessionsService();
