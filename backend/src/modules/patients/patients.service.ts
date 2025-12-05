import prisma from '../../config/database';
import { CreatePatientInput, UpdatePatientInput } from './patients.schema';
import { randomUUID } from 'crypto';
import { auditLogsService } from '../audit-logs/audit-logs.service';
import { AuditContext } from '../../middleware/audit.middleware';

export class PatientsService {
  /**
   * Get all patients with pagination and search
   */
  async getPatients(
    tenantId: string,
    page = 1,
    limit = 20,
    query?: string,
    active?: boolean
  ) {
    const skip = (page - 1) * limit;

    const where: any = { tenantId };

    if (active !== undefined) {
      where.active = active;
    }

    if (query) {
      where.OR = [
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { guardianName: { contains: query, mode: 'insensitive' } },
        { guardianPhone: { contains: query } },
      ];
    }

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
          active: true,
          createdAt: true,
        },
      }),
      prisma.patient.count({ where }),
    ]);

    return {
      patients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get patient by ID with full details
   */
  async getPatientById(tenantId: string, patientId: string) {
    const patient = await prisma.patient.findFirst({
      where: {
        id: patientId,
        tenantId,
      },
      include: {
        _count: {
          select: {
            Session: true,
            Payment: true,
            ProgressReport: true,
          },
        },
      },
    });

    if (!patient) {
      throw new Error('Patient not found');
    }

    return patient;
  }

  /**
   * Create new patient
   */
  async createPatient(
    tenantId: string,
    input: CreatePatientInput,
    auditContext?: AuditContext
  ) {
    const patient = await prisma.patient.create({
      data: {
        id: randomUUID(),
        tenantId,
        firstName: input.firstName,
        lastName: input.lastName,
        dateOfBirth: new Date(input.dateOfBirth),
        guardianName: input.guardianName,
        guardianPhone: input.guardianPhone,
        guardianEmail: input.guardianEmail || null,
        address: input.address || null,
        medicalNotes: input.medicalNotes || null,
        creditBalance: input.creditBalance || 0,
        active: true,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        guardianName: true,
        guardianPhone: true,
        guardianEmail: true,
        address: true,
        medicalNotes: true,
        creditBalance: true,
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
        'Patient',
        patient.id,
        undefined,
        {
          ip: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
        }
      );
    }

    return patient;
  }

  /**
   * Update patient
   */
  async updatePatient(
    tenantId: string,
    patientId: string,
    input: UpdatePatientInput,
    auditContext?: AuditContext
  ) {
    // Check if patient exists
    const existingPatient = await prisma.patient.findFirst({
      where: {
        id: patientId,
        tenantId,
      },
    });

    if (!existingPatient) {
      throw new Error('Patient not found');
    }

    // Update patient
    const patient = await prisma.patient.update({
      where: { id: patientId },
      data: {
        ...(input.firstName && { firstName: input.firstName }),
        ...(input.lastName && { lastName: input.lastName }),
        ...(input.dateOfBirth && { dateOfBirth: new Date(input.dateOfBirth) }),
        ...(input.guardianName && { guardianName: input.guardianName }),
        ...(input.guardianPhone && { guardianPhone: input.guardianPhone }),
        ...(input.guardianEmail !== undefined && { guardianEmail: input.guardianEmail || null }),
        ...(input.address !== undefined && { address: input.address || null }),
        ...(input.medicalNotes !== undefined && { medicalNotes: input.medicalNotes || null }),
        ...(input.creditBalance !== undefined && { creditBalance: input.creditBalance }),
        ...(input.active !== undefined && { active: input.active }),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        guardianName: true,
        guardianPhone: true,
        guardianEmail: true,
        address: true,
        medicalNotes: true,
        creditBalance: true,
        totalOutstandingDues: true,
        active: true,
        updatedAt: true,
      },
    });

    // Calculate changes for audit log
    if (auditContext) {
      const changes: Record<string, { old: any; new: any }> = {};
      
      if (input.firstName && input.firstName !== existingPatient.firstName) {
        changes.firstName = { old: existingPatient.firstName, new: input.firstName };
      }
      if (input.lastName && input.lastName !== existingPatient.lastName) {
        changes.lastName = { old: existingPatient.lastName, new: input.lastName };
      }
      if (input.guardianName && input.guardianName !== existingPatient.guardianName) {
        changes.guardianName = { old: existingPatient.guardianName, new: input.guardianName };
      }
      if (input.guardianPhone && input.guardianPhone !== existingPatient.guardianPhone) {
        changes.guardianPhone = { old: existingPatient.guardianPhone, new: input.guardianPhone };
      }
      if (input.active !== undefined && input.active !== existingPatient.active) {
        changes.active = { old: existingPatient.active, new: input.active };
      }

      // Log audit trail if there are changes
      if (Object.keys(changes).length > 0) {
        await auditLogsService.logAction(
          tenantId,
          auditContext.userId,
          'UPDATE',
          'Patient',
          patient.id,
          changes,
          {
            ip: auditContext.ipAddress,
            userAgent: auditContext.userAgent,
          }
        );
      }
    }

    return patient;
  }

  /**
   * Get patient session history
   */
  async getPatientSessions(tenantId: string, patientId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    // Verify patient exists and belongs to tenant
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, tenantId },
    });

    if (!patient) {
      throw new Error('Patient not found');
    }

    const [sessions, total] = await Promise.all([
      prisma.session.findMany({
        where: {
          patientId,
          tenantId,
        },
        skip,
        take: limit,
        orderBy: { scheduledDate: 'desc' },
        include: {
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
      prisma.session.count({ where: { patientId, tenantId } }),
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
   * Get patient payment history
   */
  async getPatientPayments(tenantId: string, patientId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    // Verify patient exists and belongs to tenant
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, tenantId },
    });

    if (!patient) {
      throw new Error('Patient not found');
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: {
          patientId,
          tenantId,
        },
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          User: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      prisma.payment.count({ where: { patientId, tenantId } }),
    ]);

    return {
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get patient outstanding dues (invoice-based system)
   */
  async getPatientOutstandingDues(tenantId: string, patientId: string) {
    // Verify patient exists and belongs to tenant
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, tenantId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        totalOutstandingDues: true,
        creditBalance: true,
      },
    });

    if (!patient) {
      throw new Error('Patient not found');
    }

    // Get invoices with outstanding amounts
    const invoicesWithDues = await prisma.invoice.findMany({
      where: {
        patientId,
        tenantId,
        outstandingAmount: {
          gt: 0,
        },
        status: {
          not: 'VOID',
        },
      },
      include: {
        InvoiceLineItem: {
          include: {
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
        },
      },
      orderBy: { invoiceDate: 'desc' },
    });

    return {
      patient: {
        id: patient.id,
        name: `${patient.firstName} ${patient.lastName}`,
        totalOutstandingDues: patient.totalOutstandingDues,
        creditBalance: patient.creditBalance,
      },
      invoicesWithDues: invoicesWithDues.map((invoice) => ({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate,
        totalAmount: invoice.totalAmount,
        outstandingAmount: invoice.outstandingAmount,
        sessions: invoice.InvoiceLineItem.map((item) => ({
          sessionId: item.Session.id,
          scheduledDate: item.Session.scheduledDate,
          therapyType: item.Session.TherapyType.name,
          cost: item.amount,
        })),
      })),
    };
  }
}

export const patientsService = new PatientsService();
