import prisma from '../../config/database';
import { RecordPaymentInput } from './payments.schema';
import { PaymentMethod } from '@prisma/client';

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
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          confirmedByUser: {
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
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            creditBalance: true,
          },
        },
        confirmedByUser: {
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
  async recordPayment(tenantId: string, confirmedBy: string, input: RecordPaymentInput) {
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
        tenantId,
        patientId: input.patientId,
        amount: input.amount,
        method: input.method,
        date: input.date ? new Date(input.date) : new Date(),
        description: input.description || null,
        confirmedBy,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        confirmedByUser: {
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

    // Get credit usage (sessions paid with credit)
    const creditUsage = await prisma.session.findMany({
      where: {
        patientId,
        tenantId,
        paidWithCredit: true,
        status: {
          not: 'CANCELLED', // Exclude cancelled sessions (credit was refunded)
        },
      },
      orderBy: { scheduledDate: 'desc' },
      select: {
        id: true,
        scheduledDate: true,
        cost: true,
        status: true,
        therapyType: {
          select: {
            name: true,
          },
        },
      },
    });

    const totalPurchased = creditPurchases.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalUsed = creditUsage.reduce((sum, s) => sum + Number(s.cost), 0);

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
        usage: creditUsage,
      },
    };
  }

  /**
   * Get payment transaction history for a patient
   */
  async getPatientPaymentHistory(tenantId: string, patientId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    // Verify patient exists
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
          confirmedByUser: {
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
}

export const paymentsService = new PaymentsService();
