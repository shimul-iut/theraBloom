import prisma from '../../config/database';
import { CreateSessionInput, UpdateSessionInput, CancelSessionInput } from './sessions.schema';
import { SessionStatus, DayOfWeek } from '@prisma/client';
import { therapistPricingService } from '../therapist-pricing/therapist-pricing.service';
import { auditLogsService } from '../audit-logs/audit-logs.service';
import { AuditContext } from '../../middleware/audit.middleware';

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
          Patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          User: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          TherapyType: {
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
        Patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            guardianName: true,
            guardianPhone: true,
          },
        },
        User: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        TherapyType: {
          select: {
            id: true,
            name: true,
            defaultDuration: true,
            defaultCost: true,
          },
        },
        InvoiceLineItem: {
          include: {
            Invoice: {
              select: {
                id: true,
                invoiceNumber: true,
                invoiceDate: true,
              },
            },
          },
        },
        ProgressReport: {
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
  async createSession(tenantId: string, input: CreateSessionInput, auditContext?: AuditContext) {
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

    // Check for therapist scheduling conflicts
    const hasTherapistConflict = await this.checkTherapistSchedulingConflict(
      tenantId,
      input.therapistId,
      scheduledDate,
      input.startTime,
      input.endTime
    );

    if (hasTherapistConflict) {
      throw new Error('Therapist already has a session scheduled at this time');
    }

    // Check for patient scheduling conflicts
    const hasPatientConflict = await this.checkPatientSchedulingConflict(
      tenantId,
      input.patientId,
      scheduledDate,
      input.startTime,
      input.endTime
    );

    if (hasPatientConflict) {
      throw new Error('Patient already has a session scheduled at this time');
    }

    // Get pricing (therapist-specific or default)
    const pricingResult = await therapistPricingService.getPricingForTherapyType(
      tenantId,
      input.therapistId,
      input.therapyTypeId
    );

    const sessionCost = Number(pricingResult.pricing.sessionCost);

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
      },
      include: {
        Patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        User: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        TherapyType: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });


    if (auditContext) {
      // Get the creator's name for the description
      const creator = await prisma.user.findUnique({
        where: { id: auditContext.userId },
        select: { firstName: true, lastName: true },
      });

      const formattedDate = scheduledDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const description = `${creator?.firstName} ${creator?.lastName} scheduled ${session.TherapyType.name} session for patient ${session.Patient.firstName} ${session.Patient.lastName} with therapist ${session.User.firstName} ${session.User.lastName} on ${formattedDate} from ${input.startTime} to ${input.endTime}`;

      await auditLogsService.logAction(
        tenantId,
        auditContext.userId,
        'CREATE',
        'Session',
        session.id,
        undefined,
        {
          ip: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
        },
        description
      );
    }

    return session;
  }

  /**
   * Update session (reschedule)
   */
  async updateSession(tenantId: string, sessionId: string, input: UpdateSessionInput, auditContext?: AuditContext) {
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

      // Check for therapist conflicts (excluding current session)
      const hasTherapistConflict = await this.checkTherapistSchedulingConflict(
        tenantId,
        existing.therapistId,
        scheduledDate,
        startTime,
        endTime,
        sessionId
      );

      if (hasTherapistConflict) {
        throw new Error('Therapist already has a session scheduled at this time');
      }

      // Check for patient conflicts (excluding current session)
      const hasPatientConflict = await this.checkPatientSchedulingConflict(
        tenantId,
        existing.patientId,
        scheduledDate,
        startTime,
        endTime,
        sessionId
      );

      if (hasPatientConflict) {
        throw new Error('Patient already has a session scheduled at this time');
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
        Patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        User: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        TherapyType: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (auditContext) {
      const changes: Record<string, any> = {};
      if (input.scheduledDate) changes.scheduledDate = { old: existing.scheduledDate, new: session.scheduledDate };
      if (input.startTime) changes.startTime = { old: existing.startTime, new: session.startTime };
      if (input.endTime) changes.endTime = { old: existing.endTime, new: session.endTime };
      if (input.status) changes.status = { old: existing.status, new: session.status };
      if (input.notes !== undefined) changes.notes = { old: existing.notes, new: session.notes };

      await auditLogsService.logAction(
        tenantId,
        auditContext.userId,
        'UPDATE',
        'Session',
        session.id,
        changes,
        {
          ip: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
        }
      );
    }

    return session;
  }

  /**
   * Cancel session with invoice-aware financial adjustments
   * Handles credit refunds and outstanding dues adjustments
   */
  async cancelSession(tenantId: string, sessionId: string, input: CancelSessionInput, auditContext?: AuditContext) {
    const session = await prisma.session.findFirst({
      where: { id: sessionId, tenantId },
      include: {
        Patient: true,
        InvoiceLineItem: {
          include: {
            Invoice: true,
          },
        },
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

    const sessionCost = Number(session.cost);

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Update session status
      const updatedSession = await tx.session.update({
        where: { id: sessionId },
        data: {
          status: 'CANCELLED',
          cancelReason: input.cancelReason,
        },
        include: {
          Patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              creditBalance: true,
              totalOutstandingDues: true,
            },
          },
          User: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          TherapyType: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      let creditAdded = 0;
      let duesReduced = 0;
      let adjustmentType: 'none' | 'credit' | 'dues' = 'none';

      // Check if session is in an invoice
      if (session.InvoiceLineItem) {
        const invoice = session.InvoiceLineItem.Invoice;
        const outstandingAmount = Number(invoice.outstandingAmount);

        if (outstandingAmount === 0) {
          // Invoice is fully paid - add session cost to credit
          await tx.patient.update({
            where: { id: session.patientId },
            data: {
              creditBalance: {
                increment: sessionCost,
              },
            },
          });
          creditAdded = sessionCost;
          adjustmentType = 'credit';
        } else {
          // Invoice has outstanding - reduce outstanding dues
          const newOutstanding = Math.max(0, outstandingAmount - sessionCost);
          const duesReduction = outstandingAmount - newOutstanding;

          await tx.invoice.update({
            where: { id: invoice.id },
            data: {
              outstandingAmount: newOutstanding,
              totalAmount: {
                decrement: sessionCost,
              },
            },
          });

          await tx.patient.update({
            where: { id: session.patientId },
            data: {
              totalOutstandingDues: {
                decrement: duesReduction,
              },
            },
          });

          duesReduced = duesReduction;
          adjustmentType = 'dues';
        }

        // Remove invoice line item
        await tx.invoiceLineItem.delete({
          where: { id: session.InvoiceLineItem.id },
        });

        // Check if invoice is now empty
        const remainingLineItems = await tx.invoiceLineItem.count({
          where: { invoiceId: invoice.id },
        });

        if (remainingLineItems === 0) {
          // Mark invoice as void when all line items are removed
          await tx.invoice.update({
            where: { id: invoice.id },
            data: {
              status: 'VOID',
              totalAmount: 0,
              outstandingAmount: 0,
            },
          });
        }
      }
      // If session not invoiced, no financial adjustment needed

      return {
        session: updatedSession,
        creditAdded,
        duesReduced,
        adjustmentType,
      };
    });

    // Log audit trail
    if (auditContext) {
      await auditLogsService.logAction(
        tenantId,
        auditContext.userId,
        'UPDATE',
        'Session',
        sessionId,
        {
          status: { old: session.status, new: 'CANCELLED' },
          cancelReason: { old: null, new: input.cancelReason },
          financialAdjustment: {
            type: result.adjustmentType,
            creditAdded: result.creditAdded,
            duesReduced: result.duesReduced
          }
        },
        {
          ip: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
        }
      );
    }

    return {
      ...result.session,
      creditAdded: result.creditAdded,
      duesReduced: result.duesReduced,
      adjustmentType: result.adjustmentType,
    };
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
        Patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        User: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        TherapyType: {
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
   * Check therapist availability for a specific date and time
   * Returns detailed availability information including conflicts
   */
  async checkAvailability(
    tenantId: string,
    therapistId: string,
    date: string,
    startTime: string,
    endTime: string
  ) {
    // Get therapist info
    const therapist = await prisma.user.findFirst({
      where: {
        id: therapistId,
        tenantId,
        role: 'THERAPIST',
        active: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        specializationId: true,
      },
    });

    if (!therapist) {
      throw new Error('Therapist not found');
    }

    const scheduledDate = new Date(date);
    const dayOfWeek = this.getDayOfWeek(scheduledDate);

    // Check therapist availability schedule
    const hasAvailabilitySchedule = await this.checkTherapistAvailability(
      tenantId,
      therapistId,
      therapist.specializationId || '',
      dayOfWeek,
      startTime,
      endTime
    );

    // Check for scheduling conflicts
    const hasTherapistConflict = await this.checkTherapistSchedulingConflict(
      tenantId,
      therapistId,
      scheduledDate,
      startTime,
      endTime
    );

    // Get existing sessions for this therapist on this date
    const existingSessions = await prisma.session.findMany({
      where: {
        tenantId,
        therapistId,
        scheduledDate,
        status: {
          in: ['SCHEDULED', 'COMPLETED'],
        },
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        Patient: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    return {
      available: hasAvailabilitySchedule && !hasTherapistConflict,
      hasAvailabilitySchedule,
      hasConflict: hasTherapistConflict,
      User: {
        id: therapist.id,
        name: `${therapist.firstName} ${therapist.lastName}`,
      },
      date,
      startTime,
      endTime,
      existingSessions: existingSessions.map((session) => ({
        id: session.id,
        startTime: session.startTime,
        endTime: session.endTime,
        patientName: `${session.Patient.firstName} ${session.Patient.lastName}`,
      })),
    };
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
   * Check for therapist scheduling conflicts
   */
  private async checkTherapistSchedulingConflict(
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
        id: true,
        startTime: true,
        endTime: true,
      },
    });

    return this.hasTimeOverlap(existingSessions, startTime, endTime);
  }

  /**
   * Check for patient scheduling conflicts
   */
  private async checkPatientSchedulingConflict(
    tenantId: string,
    patientId: string,
    scheduledDate: Date,
    startTime: string,
    endTime: string,
    excludeSessionId?: string
  ): Promise<boolean> {
    const where: any = {
      tenantId,
      patientId,
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
        id: true,
        startTime: true,
        endTime: true,
      },
    });

    return this.hasTimeOverlap(existingSessions, startTime, endTime);
  }

  /**
   * Check if requested time overlaps with any existing sessions
   */
  private hasTimeOverlap(
    existingSessions: Array<{ startTime: string; endTime: string }>,
    requestedStartTime: string,
    requestedEndTime: string
  ): boolean {
    // Convert requested time to minutes
    const [reqStartHour, reqStartMin] = requestedStartTime.split(':').map(Number);
    const [reqEndHour, reqEndMin] = requestedEndTime.split(':').map(Number);
    const reqStart = reqStartHour * 60 + reqStartMin;
    const reqEnd = reqEndHour * 60 + reqEndMin;

    // Check for overlaps with any existing session
    for (const session of existingSessions) {
      const [existStartHour, existStartMin] = session.startTime.split(':').map(Number);
      const [existEndHour, existEndMin] = session.endTime.split(':').map(Number);
      const existStart = existStartHour * 60 + existStartMin;
      const existEnd = existEndHour * 60 + existEndMin;

      // Check for any overlap (including touching boundaries)
      // Sessions overlap if:
      // 1. New session starts during existing session
      // 2. New session ends during existing session
      // 3. New session completely contains existing session
      // 4. Sessions share the same start or end time
      if (
        (reqStart >= existStart && reqStart < existEnd) || // Starts during existing
        (reqEnd > existStart && reqEnd <= existEnd) || // Ends during existing
        (reqStart <= existStart && reqEnd >= existEnd) || // Contains existing
        (reqStart === existStart || reqEnd === existEnd) // Shares boundary
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
