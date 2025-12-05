import prisma from '../../config/database';
import { RecordSessionPaymentInput } from './session-payments.schema';

export class SessionPaymentsService {
  /**
   * Get session payments
   */
  async getSessionPayments(tenantId: string, sessionId: string) {
    // Verify session exists
    const session = await prisma.session.findFirst({
      where: { id: sessionId, tenantId },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    const payments = await prisma.sessionPayment.findMany({
      where: {
        sessionId,
        tenantId,
      },
      orderBy: { paidAt: 'desc' },
    });

    // Calculate totals
    const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.amountPaid), 0);
    const totalDue = payments.reduce((sum, payment) => sum + Number(payment.amountDue), 0);
    const isPaidInFull = totalDue === 0;

    return {
      payments,
      summary: {
        sessionCost: Number(session.cost),
        totalPaid,
        totalDue,
        isPaidInFull,
      },
    };
  }

  /**
   * Record session payment (partial or full)
   */
  async recordSessionPayment(
    tenantId: string,
    sessionId: string,
    input: RecordSessionPaymentInput
  ) {
    // Get session with patient info
    const session = await prisma.session.findFirst({
      where: { id: sessionId, tenantId },
      include: {
        Patient: true,
        SessionPayment: true,
      },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    // Calculate current payment status
    const totalPaid = session.SessionPayment.reduce(
      (sum, payment) => sum + Number(payment.amountPaid),
      0
    );
    const sessionCost = Number(session.cost);
    const remainingAmount = sessionCost - totalPaid;

    // Validate payment amount
    if (input.amountPaid > remainingAmount) {
      throw new Error(
        `Payment amount (${input.amountPaid}) exceeds remaining balance (${remainingAmount})`
      );
    }

    const amountDue = remainingAmount - input.amountPaid;
    const isPaidInFull = amountDue === 0;

    // Create payment record
    const payment = await prisma.sessionPayment.create({
      data: {
        id: crypto.randomUUID(),
        tenantId,
        sessionId,
        amountPaid: input.amountPaid,
        amountDue,
        paymentMethod: input.paymentMethod,
        paidAt: input.paidAt ? new Date(input.paidAt) : new Date(),
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        isPaidInFull,
        updatedAt: new Date(),
      },
    });

    // Update patient's outstanding dues
    if (isPaidInFull) {
      // If fully paid, reduce outstanding dues by the amount that was due
      const previousDue = sessionCost - totalPaid;
      await prisma.patient.update({
        where: { id: session.patientId },
        data: {
          totalOutstandingDues: {
            decrement: previousDue,
          },
        },
      });
    } else {
      // If partial payment, update outstanding dues
      // First payment: add the due amount to outstanding
      // Subsequent payments: reduce outstanding by amount paid
      if (session.SessionPayment.length === 0) {
        // First payment - add the remaining due to outstanding
        await prisma.patient.update({
          where: { id: session.patientId },
          data: {
            totalOutstandingDues: {
              increment: amountDue,
            },
          },
        });
      } else {
        // Subsequent payment - reduce outstanding by amount paid
        await prisma.patient.update({
          where: { id: session.patientId },
          data: {
            totalOutstandingDues: {
              decrement: input.amountPaid,
            },
          },
        });
      }
    }

    return payment;
  }

  /**
   * Get payment summary for a session
   */
  async getPaymentSummary(tenantId: string, sessionId: string) {
    const session = await prisma.session.findFirst({
      where: { id: sessionId, tenantId },
      include: {
        SessionPayment: true,
      },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    const sessionCost = Number(session.cost);
    const totalPaid = session.SessionPayment.reduce(
      (sum, payment) => sum + Number(payment.amountPaid),
      0
    );
    const totalDue = sessionCost - totalPaid;
    const isPaidInFull = totalDue === 0;

    return {
      sessionId: session.id,
      sessionCost,
      totalPaid,
      totalDue,
      isPaidInFull,
      paymentCount: session.SessionPayment.length,
    };
  }
}

export const sessionPaymentsService = new SessionPaymentsService();
