import prisma from '../../config/database';
import { Prisma, PaymentMethod } from '@prisma/client';

interface CreateInvoiceInput {
  tenantId: string;
  patientId: string;
  sessionIds: string[];
  paidAmount: number;
  paymentMethod: PaymentMethod;
  creditUsed: number;
  notes?: string;
  confirmedBy: string;
}

interface CreateInvoiceResult {
  invoice: {
    id: string;
    invoiceNumber: string;
    invoiceDate: Date;
    totalAmount: number;
    paidAmount: number;
    creditUsed: number;
    outstandingAmount: number;
    paymentMethod: string;
    lineItems: Array<{
      sessionId: string;
      description: string;
      amount: number;
    }>;
  };
  patient: {
    id: string;
    name: string;
    creditBalance: number;
    totalOutstandingDues: number;
  };
}

interface UninvoicedSession {
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
}

interface UninvoicedPatient {
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    creditBalance: number;
    totalOutstandingDues: number;
  };
  sessions: UninvoicedSession[];
  totalCost: number;
  netPayable: number;
}

interface UninvoicedSessionsResult {
  patients: UninvoicedPatient[];
  summary: {
    totalPatients: number;
    totalSessions: number;
    totalCost: number;
  };
}

export class InvoicesService {
  /**
   * Generate unique invoice number in format INV-YYYY-NNN
   * Example: INV-2024-001, INV-2024-002, etc.
   */
  async generateInvoiceNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;

    // Get the latest invoice number for this year and tenant (excluding VOID invoices)
    const latestInvoice = await prisma.invoice.findFirst({
      where: {
        tenantId,
        invoiceNumber: {
          startsWith: prefix,
        },
        status: 'ACTIVE', // Only count active invoices for numbering
      },
      orderBy: {
        invoiceNumber: 'desc',
      },
      select: {
        invoiceNumber: true,
      },
    });

    let nextNumber = 1;
    if (latestInvoice) {
      // Extract the number part (e.g., "001" from "INV-2024-001")
      const numberPart = latestInvoice.invoiceNumber.split('-')[2];
      nextNumber = parseInt(numberPart, 10) + 1;
    }

    // Pad with zeros to 3 digits
    const paddedNumber = nextNumber.toString().padStart(3, '0');
    return `${prefix}${paddedNumber}`;
  }

  /**
   * Generate invoice number with retry logic for concurrent requests
   * Ensures uniqueness even under high concurrency
   */
  async generateUniqueInvoiceNumber(
    tenantId: string,
    maxRetries = 5
  ): Promise<string> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const invoiceNumber = await this.generateInvoiceNumber(tenantId);

      // Check if this number already exists
      const existing = await prisma.invoice.findUnique({
        where: { invoiceNumber },
        select: { id: true },
      });

      if (!existing) {
        return invoiceNumber;
      }

      // If exists, wait a bit and retry
      await new Promise((resolve) => setTimeout(resolve, 50 * (attempt + 1)));
    }

    throw new Error('Failed to generate unique invoice number after multiple attempts');
  }

  /**
   * Create invoice for selected sessions
   * Handles payment, credit application, and balance updates
   */
  async createInvoice(input: CreateInvoiceInput): Promise<CreateInvoiceResult> {
    const {
      tenantId,
      patientId,
      sessionIds,
      paidAmount,
      paymentMethod,
      creditUsed,
      notes,
      confirmedBy,
    } = input;

    // Validate inputs
    if (paidAmount < 0) {
      throw new Error('Paid amount cannot be negative');
    }
    if (creditUsed < 0) {
      throw new Error('Credit used cannot be negative');
    }
    if (sessionIds.length === 0) {
      throw new Error('At least one session must be selected');
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Fetch and validate sessions
      const sessions = await tx.session.findMany({
        where: {
          id: { in: sessionIds },
          tenantId,
          patientId,
          status: { not: 'CANCELLED' },
        },
        include: {
          TherapyType: {
            select: {
              name: true,
            },
          },
          User: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          InvoiceLineItem: {
            select: {
              id: true,
            },
          },
        },
      });

      // Validate all sessions found
      if (sessions.length !== sessionIds.length) {
        throw new Error('One or more sessions not found or invalid');
      }

      // Check if any session is already invoiced
      const alreadyInvoiced = sessions.filter((s) => s.InvoiceLineItem);
      if (alreadyInvoiced.length > 0) {
        throw new Error(
          `Session(s) already invoiced: ${alreadyInvoiced.map((s) => s.id).join(', ')}`
        );
      }

      // 2. Get patient and validate credit
      const patient = await tx.patient.findUnique({
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

      const patientCreditBalance = Number(patient.creditBalance);
      if (creditUsed > patientCreditBalance) {
        throw new Error(
          `Credit used (${creditUsed}) exceeds available credit (${patientCreditBalance})`
        );
      }

      // 3. Calculate totals
      const totalAmount = sessions.reduce((sum, session) => sum + Number(session.cost), 0);

      if (creditUsed > totalAmount) {
        throw new Error(
          `Credit used (${creditUsed}) cannot exceed invoice total (${totalAmount})`
        );
      }

      const outstandingAmount = totalAmount - paidAmount - creditUsed;

      // 4. Generate invoice number
      const invoiceNumber = await this.generateUniqueInvoiceNumber(tenantId);

      // 5. Create invoice
      const invoice = await tx.invoice.create({
        data: {
          tenantId,
          patientId,
          invoiceNumber,
          totalAmount,
          paidAmount,
          creditUsed,
          outstandingAmount,
          paymentMethod,
          notes,
          confirmedBy,
        },
      });

      // 6. Create invoice line items
      const lineItemsData = sessions.map((session) => ({
        invoiceId: invoice.id,
        sessionId: session.id,
        description: `${session.TherapyType.name} - ${new Date(session.scheduledDate).toLocaleDateString()} ${session.startTime}`,
        amount: Number(session.cost),
      }));

      await tx.invoiceLineItem.createMany({
        data: lineItemsData,
      });

      // 7. Update patient balances
      const newCreditBalance = patientCreditBalance - creditUsed;
      const currentOutstandingDues = Number(patient.totalOutstandingDues);
      const newOutstandingDues = currentOutstandingDues + outstandingAmount;

      await tx.patient.update({
        where: { id: patientId },
        data: {
          creditBalance: newCreditBalance,
          totalOutstandingDues: newOutstandingDues,
        },
      });

      // 8. Return result
      return {
        invoice: {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          invoiceDate: invoice.invoiceDate,
          totalAmount: Number(invoice.totalAmount),
          paidAmount: Number(invoice.paidAmount),
          creditUsed: Number(invoice.creditUsed),
          outstandingAmount: Number(invoice.outstandingAmount),
          paymentMethod: invoice.paymentMethod,
          lineItems: lineItemsData.map((item) => ({
            sessionId: item.sessionId,
            description: item.description,
            amount: Number(item.amount),
          })),
        },
        patient: {
          id: patient.id,
          name: `${patient.firstName} ${patient.lastName}`,
          creditBalance: newCreditBalance,
          totalOutstandingDues: newOutstandingDues,
        },
      };
    });
  }

  /**
   * Get all uninvoiced sessions grouped by patient
   * Returns patients with their uninvoiced sessions and financial summary
   */
  async getUninvoicedSessions(tenantId: string): Promise<UninvoicedSessionsResult> {
    // Get all sessions without invoice line items (uninvoiced)
    const uninvoicedSessions = await prisma.session.findMany({
      where: {
        tenantId,
        status: { not: 'CANCELLED' },
        InvoiceLineItem: null, // Sessions without invoice
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
        TherapyType: {
          select: {
            id: true,
            name: true,
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
      orderBy: {
        scheduledDate: 'asc',
      },
    });

    // Group sessions by patient
    const patientMap = new Map<string, UninvoicedPatient>();

    uninvoicedSessions.forEach((session) => {
      const patientId = session.Patient.id;

      if (!patientMap.has(patientId)) {
        const creditBalance = Number(session.Patient.creditBalance);
        const outstandingDues = Number(session.Patient.totalOutstandingDues);

        patientMap.set(patientId, {
          patient: {
            id: session.Patient.id,
            firstName: session.Patient.firstName,
            lastName: session.Patient.lastName,
            creditBalance,
            totalOutstandingDues: outstandingDues,
          },
          sessions: [],
          totalCost: 0,
          netPayable: 0,
        });
      }

      const patientData = patientMap.get(patientId)!;
      const sessionCost = Number(session.cost);

      patientData.sessions.push({
        id: session.id,
        scheduledDate: session.scheduledDate,
        startTime: session.startTime,
        endTime: session.endTime,
        cost: sessionCost,
        status: session.status,
        therapyType: {
          id: session.TherapyType.id,
          name: session.TherapyType.name,
        },
        therapist: {
          id: session.User.id,
          name: `${session.User.firstName} ${session.User.lastName}`,
        },
      });

      patientData.totalCost += sessionCost;
    });

    // Calculate net payable for each patient
    const patients = Array.from(patientMap.values()).map((patientData) => {
      // netPayable = totalCost - creditBalance + outstandingDues
      const netPayable =
        patientData.totalCost -
        patientData.patient.creditBalance +
        patientData.patient.totalOutstandingDues;

      return {
        ...patientData,
        netPayable,
      };
    });

    // Calculate summary
    const summary = {
      totalPatients: patients.length,
      totalSessions: uninvoicedSessions.length,
      totalCost: patients.reduce((sum, p) => sum + p.totalCost, 0),
    };

    return {
      patients,
      summary,
    };
  }

  /**
   * Get invoice details by ID
   * Includes line items, patient info, and confirmedBy user
   */
  async getInvoiceDetails(invoiceId: string, tenantId: string) {
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        tenantId,
      },
      include: {
        InvoiceLineItem: {
          include: {
            Session: {
              include: {
                TherapyType: {
                  select: {
                    name: true,
                  },
                },
                User: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
        Patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            guardianName: true,
            guardianPhone: true,
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
      },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    return {
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate,
        totalAmount: Number(invoice.totalAmount),
        paidAmount: Number(invoice.paidAmount),
        creditUsed: Number(invoice.creditUsed),
        outstandingAmount: Number(invoice.outstandingAmount),
        paymentMethod: invoice.paymentMethod,
        notes: invoice.notes,
      },
      lineItems: invoice.InvoiceLineItem.map((item) => ({
        id: item.id,
        sessionId: item.sessionId,
        description: item.description,
        amount: Number(item.amount),
        session: {
          scheduledDate: item.Session.scheduledDate,
          startTime: item.Session.startTime,
          endTime: item.Session.endTime,
          therapyType: item.Session.TherapyType.name,
          therapist: `${item.Session.User.firstName} ${item.Session.User.lastName}`,
        },
      })),
      patient: {
        id: invoice.Patient.id,
        name: `${invoice.Patient.firstName} ${invoice.Patient.lastName}`,
        guardianName: invoice.Patient.guardianName,
        guardianPhone: invoice.Patient.guardianPhone,
        creditBalance: Number(invoice.Patient.creditBalance),
        totalOutstandingDues: Number(invoice.Patient.totalOutstandingDues),
      },
      confirmedBy: {
        id: invoice.User.id,
        name: `${invoice.User.firstName} ${invoice.User.lastName}`,
      },
    };
  }

  /**
   * Get all invoices for a patient with pagination
   * Supports date range filtering
   */
  async getPatientInvoices(
    patientId: string,
    tenantId: string,
    options: {
      page?: number;
      limit?: number;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ) {
    const { page = 1, limit = 20, startDate, endDate } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.InvoiceWhereInput = {
      patientId,
      tenantId,
      status: 'ACTIVE', // Exclude VOID invoices from patient invoice history
      ...(startDate || endDate
        ? {
            invoiceDate: {
              ...(startDate ? { gte: startDate } : {}),
              ...(endDate ? { lte: endDate } : {}),
            },
          }
        : {}),
    };

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          InvoiceLineItem: {
            select: {
              id: true,
              description: true,
              amount: true,
            },
          },
        },
        orderBy: {
          invoiceDate: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ]);

    // Calculate summary (exclude VOID invoices)
    const allInvoices = await prisma.invoice.findMany({
      where: { 
        patientId, 
        tenantId,
        status: 'ACTIVE', // Only include active invoices in summary
      },
      select: {
        totalAmount: true,
        paidAmount: true,
        creditUsed: true,
        outstandingAmount: true,
      },
    });

    const summary = {
      totalInvoiced: allInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0),
      totalPaid: allInvoices.reduce((sum, inv) => sum + Number(inv.paidAmount), 0),
      totalCreditUsed: allInvoices.reduce((sum, inv) => sum + Number(inv.creditUsed), 0),
      totalOutstanding: allInvoices.reduce(
        (sum, inv) => sum + Number(inv.outstandingAmount),
        0
      ),
    };

    return {
      invoices: invoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: inv.invoiceDate,
        totalAmount: Number(inv.totalAmount),
        paidAmount: Number(inv.paidAmount),
        creditUsed: Number(inv.creditUsed),
        outstandingAmount: Number(inv.outstandingAmount),
        paymentMethod: inv.paymentMethod,
        lineItemCount: inv.InvoiceLineItem.length,
      })),
      summary,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get patient balance with uninvoiced sessions summary
   */
  async getPatientBalance(tenantId: string, patientId: string) {
    // Get patient info
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

    // Get uninvoiced sessions for this patient
    const uninvoicedSessions = await prisma.session.findMany({
      where: {
        tenantId,
        patientId,
        status: { not: 'CANCELLED' },
        InvoiceLineItem: null,
      },
      select: {
        id: true,
        cost: true,
      },
    });

    const uninvoicedCount = uninvoicedSessions.length;
    const uninvoicedTotal = uninvoicedSessions.reduce(
      (sum, session) => sum + Number(session.cost),
      0
    );

    // Calculate net payable for uninvoiced sessions
    const netPayable =
      uninvoicedTotal -
      Number(patient.creditBalance) +
      Number(patient.totalOutstandingDues);

    return {
      patient: {
        id: patient.id,
        name: `${patient.firstName} ${patient.lastName}`,
        creditBalance: Number(patient.creditBalance),
        totalOutstandingDues: Number(patient.totalOutstandingDues),
      },
      uninvoiced: {
        count: uninvoicedCount,
        total: uninvoicedTotal,
        netPayable: Math.max(0, netPayable),
      },
    };
  }
}

export const invoicesService = new InvoicesService();
