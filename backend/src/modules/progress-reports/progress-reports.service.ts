import prisma from '../../config/database';
import { CreateProgressReportInput, UpdateProgressReportInput } from './progress-reports.schema';

export class ProgressReportsService {
  /**
   * Get progress reports with filters and pagination
   */
  async getProgressReports(
    tenantId: string,
    filters: {
      patientId?: string;
      therapistId?: string;
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

    if (filters.startDate || filters.endDate) {
      where.reportDate = {};
      if (filters.startDate) where.reportDate.gte = new Date(filters.startDate);
      if (filters.endDate) where.reportDate.lte = new Date(filters.endDate);
    }

    const [reports, total] = await Promise.all([
      prisma.progressReport.findMany({
        where,
        skip,
        take: limit,
        orderBy: { reportDate: 'desc' },
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
          Session: {
            select: {
              id: true,
              scheduledDate: true,
              TherapyType: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.progressReport.count({ where }),
    ]);

    return {
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get progress report by ID
   */
  async getProgressReportById(tenantId: string, reportId: string) {
    const report = await prisma.progressReport.findFirst({
      where: {
        id: reportId,
        tenantId,
      },
      include: {
        Patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true,
            guardianName: true,
          },
        },
        User: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        Session: {
          select: {
            id: true,
            scheduledDate: true,
            startTime: true,
            endTime: true,
            TherapyType: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!report) {
      throw new Error('Progress report not found');
    }

    return report;
  }

  /**
   * Create progress report
   */
  async createProgressReport(
    tenantId: string,
    therapistId: string,
    input: CreateProgressReportInput
  ) {
    // Verify patient exists
    const patient = await prisma.patient.findFirst({
      where: {
        id: input.patientId,
        tenantId,
        active: true,
      },
    });

    if (!patient) {
      throw new Error('Patient not found');
    }

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

    // If sessionId provided, verify session exists and belongs to this patient/therapist
    if (input.sessionId) {
      const session = await prisma.session.findFirst({
        where: {
          id: input.sessionId,
          tenantId,
          patientId: input.patientId,
          therapistId,
        },
      });

      if (!session) {
        throw new Error('Session not found or does not match patient/therapist');
      }
    }

    // Create progress report
    const report = await prisma.progressReport.create({
      data: {
        id: crypto.randomUUID(),
        tenantId,
        patientId: input.patientId,
        therapistId,
        sessionId: input.sessionId || null,
        reportDate: input.reportDate ? new Date(input.reportDate) : new Date(),
        notes: input.notes,
        updatedAt: new Date(),
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
        Session: {
          select: {
            id: true,
            scheduledDate: true,
            TherapyType: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return report;
  }

  /**
   * Update progress report
   */
  async updateProgressReport(
    tenantId: string,
    therapistId: string,
    reportId: string,
    input: UpdateProgressReportInput
  ) {
    // Get existing report
    const existing = await prisma.progressReport.findFirst({
      where: {
        id: reportId,
        tenantId,
      },
    });

    if (!existing) {
      throw new Error('Progress report not found');
    }

    // Verify therapist owns this report
    if (existing.therapistId !== therapistId) {
      throw new Error('You can only update your own progress reports');
    }

    // Update report
    const report = await prisma.progressReport.update({
      where: { id: reportId },
      data: {
        ...(input.reportDate && { reportDate: new Date(input.reportDate) }),
        ...(input.notes && { notes: input.notes }),
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
        Session: {
          select: {
            id: true,
            scheduledDate: true,
            TherapyType: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return report;
  }

  /**
   * Get patient progress reports
   */
  async getPatientProgressReports(tenantId: string, patientId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    // Verify patient exists
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, tenantId },
    });

    if (!patient) {
      throw new Error('Patient not found');
    }

    const [reports, total] = await Promise.all([
      prisma.progressReport.findMany({
        where: {
          patientId,
          tenantId,
        },
        skip,
        take: limit,
        orderBy: { reportDate: 'desc' },
        include: {
          User: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          Session: {
            select: {
              id: true,
              scheduledDate: true,
              TherapyType: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.progressReport.count({ where: { patientId, tenantId } }),
    ]);

    return {
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get therapist progress reports
   */
  async getTherapistProgressReports(tenantId: string, therapistId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

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

    const [reports, total] = await Promise.all([
      prisma.progressReport.findMany({
        where: {
          therapistId,
          tenantId,
        },
        skip,
        take: limit,
        orderBy: { reportDate: 'desc' },
        include: {
          Patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          Session: {
            select: {
              id: true,
              scheduledDate: true,
              TherapyType: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.progressReport.count({ where: { therapistId, tenantId } }),
    ]);

    return {
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const progressReportsService = new ProgressReportsService();
