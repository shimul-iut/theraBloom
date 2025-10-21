import prisma from '../../config/database';
import { SessionStatus } from '@prisma/client';
import { CompleteSessionInput } from './therapist-dashboard.schema';

export class TherapistDashboardService {
  /**
   * Get therapist dashboard overview
   */
  async getTherapistDashboard(tenantId: string, therapistId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    // Get today's sessions
    const todaySessions = await prisma.session.findMany({
      where: {
        tenantId,
        therapistId,
        scheduledDate: {
          gte: today,
          lt: tomorrow,
        },
        status: {
          in: ['SCHEDULED', 'COMPLETED'],
        },
      },
      orderBy: { startTime: 'asc' },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            guardianPhone: true,
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

    // Get this week's sessions count
    const weekSessionsCount = await prisma.session.count({
      where: {
        tenantId,
        therapistId,
        scheduledDate: {
          gte: weekStart,
          lt: weekEnd,
        },
        status: {
          in: ['SCHEDULED', 'COMPLETED'],
        },
      },
    });

    // Get completed sessions this week
    const completedThisWeek = await prisma.session.count({
      where: {
        tenantId,
        therapistId,
        scheduledDate: {
          gte: weekStart,
          lt: weekEnd,
        },
        status: 'COMPLETED',
      },
    });

    // Get pending reschedule requests
    const pendingRescheduleRequests = await prisma.rescheduleRequest.count({
      where: {
        tenantId,
        therapistId,
        status: 'PENDING',
      },
    });

    // Get unique patients count this week
    const weekSessions = await prisma.session.findMany({
      where: {
        tenantId,
        therapistId,
        scheduledDate: {
          gte: weekStart,
          lt: weekEnd,
        },
      },
      select: {
        patientId: true,
      },
      distinct: ['patientId'],
    });

    return {
      todaySessions,
      stats: {
        todaySessionsCount: todaySessions.length,
        weekSessionsCount,
        completedThisWeek,
        pendingRescheduleRequests,
        uniquePatientsThisWeek: weekSessions.length,
      },
    };
  }

  /**
   * Get therapist schedule with filters
   */
  async getTherapistSchedule(
    tenantId: string,
    therapistId: string,
    filters: {
      startDate?: string;
      endDate?: string;
      status?: SessionStatus;
    }
  ) {
    const where: any = {
      tenantId,
      therapistId,
    };

    if (filters.startDate || filters.endDate) {
      where.scheduledDate = {};
      if (filters.startDate) where.scheduledDate.gte = new Date(filters.startDate);
      if (filters.endDate) where.scheduledDate.lte = new Date(filters.endDate);
    }

    if (filters.status) {
      where.status = filters.status;
    }

    const sessions = await prisma.session.findMany({
      where,
      orderBy: [
        { scheduledDate: 'asc' },
        { startTime: 'asc' },
      ],
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
        therapyType: {
          select: {
            id: true,
            name: true,
          },
        },
        sessionPayments: {
          select: {
            id: true,
            amountPaid: true,
            paidAt: true,
          },
        },
      },
    });

    return sessions;
  }

  /**
   * Get therapist's patients
   */
  async getTherapistPatients(tenantId: string, therapistId: string) {
    // Get all unique patients who have had sessions with this therapist
    const sessions = await prisma.session.findMany({
      where: {
        tenantId,
        therapistId,
      },
      select: {
        patientId: true,
      },
      distinct: ['patientId'],
    });

    const patientIds = sessions.map(s => s.patientId);

    if (patientIds.length === 0) {
      return [];
    }

    const patients = await prisma.patient.findMany({
      where: {
        tenantId,
        id: {
          in: patientIds,
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        guardianName: true,
        guardianPhone: true,
        guardianEmail: true,
        creditBalance: true,
        totalOutstandingDues: true,
        _count: {
          select: {
            sessions: {
              where: {
                therapistId,
              },
            },
          },
        },
      },
      orderBy: {
        firstName: 'asc',
      },
    });

    return patients;
  }

  /**
   * Get upcoming sessions for therapist
   */
  async getUpcomingSessions(tenantId: string, therapistId: string, limit = 10) {
    const now = new Date();

    const sessions = await prisma.session.findMany({
      where: {
        tenantId,
        therapistId,
        scheduledDate: {
          gte: now,
        },
        status: 'SCHEDULED',
      },
      take: limit,
      orderBy: [
        { scheduledDate: 'asc' },
        { startTime: 'asc' },
      ],
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            guardianPhone: true,
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
   * Get today's sessions for therapist
   */
  async getTodaySessions(tenantId: string, therapistId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sessions = await prisma.session.findMany({
      where: {
        tenantId,
        therapistId,
        scheduledDate: {
          gte: today,
          lt: tomorrow,
        },
        status: {
          in: ['SCHEDULED', 'COMPLETED'],
        },
      },
      orderBy: { startTime: 'asc' },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            guardianPhone: true,
          },
        },
        therapyType: {
          select: {
            id: true,
            name: true,
          },
        },
        sessionPayments: {
          select: {
            id: true,
            amountPaid: true,
            paidAt: true,
          },
        },
      },
    });

    return sessions;
  }

  /**
   * Complete a session
   */
  async completeSession(
    tenantId: string,
    therapistId: string,
    sessionId: string,
    input: CompleteSessionInput
  ) {
    // Verify session belongs to therapist
    const session = await prisma.session.findFirst({
      where: {
        id: sessionId,
        tenantId,
        therapistId,
      },
    });

    if (!session) {
      throw new Error('Session not found or does not belong to this therapist');
    }

    if (session.status === 'CANCELLED') {
      throw new Error('Cannot complete a cancelled session');
    }

    if (session.status === 'COMPLETED') {
      throw new Error('Session is already completed');
    }

    // Update session status
    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
        notes: input.notes || session.notes,
      },
      include: {
        patient: {
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

    // If progress notes provided, create a progress report
    if (input.progressNotes) {
      await prisma.progressReport.create({
        data: {
          tenantId,
          sessionId,
          patientId: session.patientId,
          therapistId,
          reportDate: new Date(),
          notes: input.progressNotes,
        },
      });
    }

    return updatedSession;
  }

  /**
   * Get therapist's weekly overview
   */
  async getWeeklyOverview(tenantId: string, therapistId: string, weekStart?: Date) {
    const start = weekStart || new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - start.getDay()); // Start of week (Sunday)
    
    const end = new Date(start);
    end.setDate(start.getDate() + 7);

    // Get all sessions for the week
    const sessions = await prisma.session.findMany({
      where: {
        tenantId,
        therapistId,
        scheduledDate: {
          gte: start,
          lt: end,
        },
      },
      orderBy: [
        { scheduledDate: 'asc' },
        { startTime: 'asc' },
      ],
      include: {
        patient: {
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

    // Group sessions by day
    const sessionsByDay: { [key: string]: any[] } = {
      Sunday: [],
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
    };

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    sessions.forEach(session => {
      const dayName = dayNames[session.scheduledDate.getDay()];
      sessionsByDay[dayName].push(session);
    });

    // Calculate stats
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(s => s.status === 'COMPLETED').length;
    const scheduledSessions = sessions.filter(s => s.status === 'SCHEDULED').length;
    const cancelledSessions = sessions.filter(s => s.status === 'CANCELLED').length;

    return {
      weekStart: start,
      weekEnd: end,
      sessionsByDay,
      stats: {
        totalSessions,
        completedSessions,
        scheduledSessions,
        cancelledSessions,
      },
    };
  }
}

export const therapistDashboardService = new TherapistDashboardService();
