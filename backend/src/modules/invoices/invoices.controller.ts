import { Request, Response } from 'express';
import { invoicesService } from './invoices.service';
import {
  createInvoiceSchema,
  uninvoicedSessionsFiltersSchema,
  invoiceFiltersSchema,
} from './invoices.schema';
import { getTenantId, getUserId } from '../../middleware/tenant';
import { logger } from '../../utils/logger';

export class InvoicesController {
  /**
   * GET /api/v1/invoices/unpaid-sessions
   * Get all uninvoiced sessions grouped by patient
   */
  async getUninvoicedSessions(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);

      // Parse and validate filters
      const filters = uninvoicedSessionsFiltersSchema.parse({
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        patientId: req.query.patientId,
        therapistId: req.query.therapistId,
      });

      const result = await invoicesService.getUninvoicedSessions(tenantId);

      // Apply filters if provided
      let filteredPatients = result.patients;

      if (filters.patientId) {
        filteredPatients = filteredPatients.filter(
          (p) => p.patient.id === filters.patientId
        );
      }

      if (filters.therapistId) {
        filteredPatients = filteredPatients
          .map((p) => ({
            ...p,
            sessions: p.sessions.filter((s) => s.therapist.id === filters.therapistId),
          }))
          .filter((p) => p.sessions.length > 0);
      }

      if (filters.startDate || filters.endDate) {
        const startDate = filters.startDate ? new Date(filters.startDate) : null;
        const endDate = filters.endDate ? new Date(filters.endDate) : null;

        filteredPatients = filteredPatients
          .map((p) => ({
            ...p,
            sessions: p.sessions.filter((s) => {
              const sessionDate = new Date(s.scheduledDate);
              if (startDate && sessionDate < startDate) return false;
              if (endDate && sessionDate > endDate) return false;
              return true;
            }),
          }))
          .filter((p) => p.sessions.length > 0);

        // Recalculate totals for filtered sessions
        filteredPatients = filteredPatients.map((p) => {
          const totalCost = p.sessions.reduce((sum, s) => sum + s.cost, 0);
          const netPayable =
            totalCost - p.patient.creditBalance + p.patient.totalOutstandingDues;
          return {
            ...p,
            totalCost,
            netPayable,
          };
        });
      }

      // Recalculate summary
      const summary = {
        totalPatients: filteredPatients.length,
        totalSessions: filteredPatients.reduce((sum, p) => sum + p.sessions.length, 0),
        totalCost: filteredPatients.reduce((sum, p) => sum + p.totalCost, 0),
      };

      return res.json({
        success: true,
        data: {
          patients: filteredPatients,
          summary,
        },
      });
    } catch (error) {
      logger.error('Get uninvoiced sessions error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_UNINVOICED_SESSIONS_FAILED',
          message: 'Failed to fetch uninvoiced sessions',
        },
      });
    }
  }

  /**
   * POST /api/v1/invoices/create
   * Create invoice for selected sessions
   */
  async createInvoice(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const confirmedBy = getUserId(req);
      const input = createInvoiceSchema.parse(req.body);

      const result = await invoicesService.createInvoice({
        tenantId,
        confirmedBy,
        ...input,
      });

      logger.info(
        `Invoice created: ${result.invoice.invoiceNumber} for patient ${input.patientId} by ${req.user?.phoneNumber}`
      );

      return res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Create invoice error:', error);

      if (error instanceof Error) {
        if (error.message === 'Patient not found') {
          return res.status(404).json({
            success: false,
            error: {
              code: 'PATIENT_NOT_FOUND',
              message: 'Patient not found',
            },
          });
        }

        if (error.message === 'One or more sessions not found or invalid') {
          return res.status(404).json({
            success: false,
            error: {
              code: 'SESSIONS_NOT_FOUND',
              message: 'One or more sessions not found or invalid',
            },
          });
        }

        if (error.message.includes('already invoiced')) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'SESSIONS_ALREADY_INVOICED',
              message: error.message,
            },
          });
        }

        if (error.message.includes('exceeds available credit')) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'INSUFFICIENT_CREDIT',
              message: error.message,
            },
          });
        }

        if (error.message.includes('cannot exceed invoice total')) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'CREDIT_EXCEEDS_TOTAL',
              message: error.message,
            },
          });
        }

        if (error.message === 'Paid amount cannot be negative') {
          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_PAID_AMOUNT',
              message: 'Paid amount cannot be negative',
            },
          });
        }

        if (error.message === 'Credit used cannot be negative') {
          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_CREDIT_AMOUNT',
              message: 'Credit used cannot be negative',
            },
          });
        }

        if (error.message === 'At least one session must be selected') {
          return res.status(400).json({
            success: false,
            error: {
              code: 'NO_SESSIONS_SELECTED',
              message: 'At least one session must be selected',
            },
          });
        }
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'CREATE_INVOICE_FAILED',
          message: 'Failed to create invoice',
        },
      });
    }
  }

  /**
   * GET /api/v1/invoices/:invoiceId
   * Get invoice details by ID
   */
  async getInvoiceById(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const invoiceId = req.params.invoiceId;

      const invoice = await invoicesService.getInvoiceDetails(invoiceId, tenantId);

      return res.json({
        success: true,
        data: invoice,
      });
    } catch (error) {
      logger.error('Get invoice error:', error);

      if (error instanceof Error && error.message === 'Invoice not found') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'INVOICE_NOT_FOUND',
            message: 'Invoice not found',
          },
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_INVOICE_FAILED',
          message: 'Failed to fetch invoice',
        },
      });
    }
  }

  /**
   * GET /api/v1/invoices/patient/:patientId
   * Get all invoices for a patient
   */
  async getPatientInvoices(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const patientId = req.params.patientId;

      const filters = invoiceFiltersSchema.parse({
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
      });

      const options = {
        page: filters.page,
        limit: filters.limit,
        ...(filters.startDate && { startDate: new Date(filters.startDate) }),
        ...(filters.endDate && { endDate: new Date(filters.endDate) }),
      };

      const result = await invoicesService.getPatientInvoices(
        patientId,
        tenantId,
        options
      );

      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Get patient invoices error:', error);

      if (error instanceof Error && error.message === 'Patient not found') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'PATIENT_NOT_FOUND',
            message: 'Patient not found',
          },
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_PATIENT_INVOICES_FAILED',
          message: 'Failed to fetch patient invoices',
        },
      });
    }
  }

  /**
   * GET /api/v1/invoices/patient/:patientId/balance
   * Get patient financial balance with uninvoiced sessions
   */
  async getPatientBalance(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const patientId = req.params.patientId;

      // Get patient info
      const patient = await invoicesService.getPatientBalance(tenantId, patientId);

      return res.json({
        success: true,
        data: patient,
      });
    } catch (error) {
      logger.error('Get patient balance error:', error);

      if (error instanceof Error && error.message === 'Patient not found') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'PATIENT_NOT_FOUND',
            message: 'Patient not found',
          },
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_PATIENT_BALANCE_FAILED',
          message: 'Failed to fetch patient balance',
        },
      });
    }
  }
}

export const invoicesController = new InvoicesController();
