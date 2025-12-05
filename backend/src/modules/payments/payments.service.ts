import prisma from '../../config/database';
import { RecordPaymentInput } from './payments.schema';
import { PaymentMethod } from '@prisma/client';
import { randomUUID } from 'crypto';
import { invoicesService } from '../invoices/invoices.service';
import { auditLogsService } from '../audit-logs/audit-logs.service';
import { AuditContext } from '../../middleware/audit.middleware';

export class PaymentsService {
  /**
   * Get payments with filters and pagination
   */
  async getPayments(
    tenantId: string,
    filters: {
      patientId?: string;
      method?: PaymentMethod;
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
    if (filters.method) where.method = filters.method;

    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = new Date(filters.startDate);
      if (filters.endDate) where.date.lte = new Date(filters.endDate);
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
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
        },
      }),
      prisma.payment.count({ where }),
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
   * Get payment by ID
   */
  async getPaymentById(tenantId: string, paymentId: string) {
    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        tenantId,
      },
      include: {
        Patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            creditBalance: true,
          },
        },
        User: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    return payment;
  }

  /**
   * Record payment (credit purchase or general payment)
   */
  async recordPayment(tenantId: string, confirmedBy: string, input: RecordPaymentInput, auditContext?: AuditContext) {
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

    // Verify confirming user exists
    const user = await prisma.user.findFirst({
      where: {
        id: confirmedBy,
        tenantId,
        active: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        id: randomUUID(),
        tenantId,
        patientId: input.patientId,
        amount: input.amount,
        method: input.method,
        date: input.date ? new Date(input.date) : new Date(),
        description: input.description || null,
        confirmedBy,
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
      },
    });

    // If payment method is PREPAID_CREDIT, add to patient's credit balance
    if (input.method === 'PREPAID_CREDIT') {
      await prisma.patient.update({
        where: { id: input.patientId },
        data: {
          creditBalance: {
            increment: input.amount,
          },
        },
      });
    }



    if (auditContext) {
      await auditLogsService.logAction(
        tenantId,
        auditContext.userId,
        'CREATE',
        'Payment',
        payment.id,
        undefined,
        {
          ip: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
        }
      );
    }

    return payment;
  }

  /**
   * Get patient credit balance
   */
  async getPatientCreditBalance(tenantId: string, patientId: string) {
    const patient = await prisma.patient.findFirst({
      where: {
        id: patientId,
        tenantId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        creditBalance: true,
        totalOutstandingDues: true,
      },
    });

    if (!patient) {
      throw new Error('Patient not found');
    }

    // Get credit purchase history
    const creditPurchases = await prisma.payment.findMany({
      where: {
        patientId,
        tenantId,
        method: 'PREPAID_CREDIT',
      },
      orderBy: { date: 'desc' },
      select: {
        id: true,
        amount: true,
        date: true,
        description: true,
      },
    });

    // Get credit usage from invoices
    const invoicesWithCredit = await prisma.invoice.findMany({
      where: {
        patientId,
        tenantId,
        creditUsed: {
          gt: 0,
        },
        status: 'ACTIVE', // Exclude voided invoices
      },
      orderBy: { invoiceDate: 'desc' },
      select: {
        id: true,
        invoiceNumber: true,
        invoiceDate: true,
        creditUsed: true,
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
    });

    const totalPurchased = creditPurchases.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalUsed = invoicesWithCredit.reduce((sum, inv) => sum + Number(inv.creditUsed), 0);

    return {
      patient: {
        id: patient.id,
        name: `${patient.firstName} ${patient.lastName}`,
        creditBalance: Number(patient.creditBalance),
        totalOutstandingDues: Number(patient.totalOutstandingDues),
      },
      creditHistory: {
        totalPurchased,
        totalUsed,
        currentBalance: Number(patient.creditBalance),
        purchases: creditPurchases,
        usage: invoicesWithCredit.map((inv) => ({
          invoiceId: inv.id,
          invoiceNumber: inv.invoiceNumber,
          invoiceDate: inv.invoiceDate,
          creditUsed: Number(inv.creditUsed),
          sessions: inv.InvoiceLineItem.map((item) => ({
            id: item.Session.id,
            scheduledDate: item.Session.scheduledDate,
            therapyType: item.Session.TherapyType.name,
          })),
        })),
      },
    };
  }

  /**
   * Get all uninvoiced sessions grouped by patient
   * DEPRECATED: Use invoicesService.getUninvoicedSessions instead
   * This method is kept for backward compatibility
   */
  async getUnpaidSessions(tenantId: string): Promise<{
    patients: Array<{
      patient: {
        id: string;
        firstName: string;
        lastName: string;
        creditBalance: number;
        totalOutstandingDues: number;
      };
      sessions: Array<{
        id: string;
        scheduledDate: Date;
        startTime: string;
        endTime: string;
        cost: number;
        status: string;
        therapyType: {
          id: string;
          name: string;
        };
        therapist: {
          id: string;
          name: string;
        };
      }>;
      totalCost: number;
      netPayable: number;
    }>;
    summary: {
      totalPatients: number;
      totalSessions: number;
      totalCost: number;
    };
  }> {
    // Delegate to invoices service
    return invoicesService.getUninvoicedSessions(tenantId);
  }

  /**
   * Get payment transaction history for a patient
   * Returns invoices and general payments (credit purchases)
   */
  async getPatientPaymentHistory(tenantId: string, patientId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    // Verify patient exists and get current balances
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, tenantId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        creditBalance: true,
        totalOutstandingDues: true,
      },
    });

    if (!patient) {
      throw new Error('Patient not found');
    }

    // Get invoices (replaces session payments)
    const [invoices, invoicesTotal] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          patientId,
          tenantId,
          status: 'ACTIVE',
        },
        skip,
        take: limit,
        orderBy: { invoiceDate: 'desc' },
        include: {
          InvoiceLineItem: {
            select: {
              id: true,
              description: true,
              amount: true,
            },
          },
        },
      }),
      prisma.invoice.count({
        where: {
          patientId,
          tenantId,
          status: 'ACTIVE',
        },
      }),
    ]);

    // Get general payments (credit purchases, etc.)
    const [generalPayments, generalPaymentsTotal] = await Promise.all([
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

    // Calculate summary totals
    const allInvoices = await prisma.invoice.findMany({
      where: {
        patientId,
        tenantId,
        status: 'ACTIVE',
      },
      select: {
        paidAmount: true,
        creditUsed: true,
      },
    });

    const allGeneralPayments = await prisma.payment.findMany({
      where: {
        patientId,
        tenantId,
      },
      select: {
        amount: true,
        method: true,
      },
    });

    const totalPaidForSessions = allInvoices.reduce(
      (sum, inv) => sum + Number(inv.paidAmount),
      0
    );

    const totalCreditUsed = allInvoices.reduce(
      (sum, inv) => sum + Number(inv.creditUsed),
      0
    );

    const totalCreditPurchases = allGeneralPayments
      .filter((p) => p.method === 'PREPAID_CREDIT')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const totalGeneralPayments = allGeneralPayments
      .filter((p) => p.method !== 'PREPAID_CREDIT')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    // Format invoices for response
    const formattedInvoices = invoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      invoiceDate: inv.invoiceDate,
      totalAmount: Number(inv.totalAmount),
      paidAmount: Number(inv.paidAmount),
      creditUsed: Number(inv.creditUsed),
      outstandingAmount: Number(inv.outstandingAmount),
      paymentMethod: inv.paymentMethod,
      lineItemCount: inv.InvoiceLineItem.length,
    }));

    // Format general payments for response
    const formattedGeneralPayments = generalPayments.map((p) => ({
      id: p.id,
      amount: Number(p.amount),
      method: p.method,
      date: p.date,
      description: p.description,
      confirmedBy: {
        id: p.User.id,
        name: `${p.User.firstName} ${p.User.lastName}`,
      },
    }));

    return {
      patient: {
        id: patient.id,
        name: `${patient.firstName} ${patient.lastName}`,
        creditBalance: Number(patient.creditBalance),
        totalOutstandingDues: Number(patient.totalOutstandingDues),
      },
      invoices: formattedInvoices,
      generalPayments: formattedGeneralPayments,
      summary: {
        totalPaidForSessions,
        totalCreditUsed,
        totalCreditPurchases,
        totalGeneralPayments,
        currentCreditBalance: Number(patient.creditBalance),
        currentOutstandingDues: Number(patient.totalOutstandingDues),
      },
      pagination: {
        invoices: {
          page,
          limit,
          total: invoicesTotal,
          totalPages: Math.ceil(invoicesTotal / limit),
        },
        generalPayments: {
          page,
          limit,
          total: generalPaymentsTotal,
          totalPages: Math.ceil(generalPaymentsTotal / limit),
        },
      },
    };
  }


}

export const paymentsService = new PaymentsService();
