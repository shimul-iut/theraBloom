import { Request, Response } from 'express';
import { paymentsService } from './payments.service';
import { recordPaymentSchema, confirmPaymentSchema } from './payments.schema';
import { getTenantId, getUserId } from '../../middleware/tenant';
import { logger } from '../../utils/logger';
import { PaymentMethod } from '@prisma/client';

export class PaymentsController {
  /**
   * GET /api/v1/payments/unpaid
   * Get all unpaid sessions grouped by patient
   */
  async getUnpaidSessions(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);

      const result = await paymentsService.getUnpaidSessions(tenantId);

      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Get unpaid sessions error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_UNPAID_SESSIONS_FAILED',
          message: 'Failed to fetch unpaid sessions',
        },
      });
    }
  }

  /**
   * GET /api/v1/payments
   */
  async getPayments(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const filters = {
        patientId: req.query.patientId as string | undefined,
        method: req.query.method as PaymentMethod | undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      };

      const result = await paymentsService.getPayments(tenantId, filters);

      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Get payments error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_PAYMENTS_FAILED',
          message: 'Failed to fetch payments',
        },
      });
    }
  }

  /**
   * GET /api/v1/payments/:id
   */
  async getPaymentById(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const paymentId = req.params.id;

      const payment = await paymentsService.getPaymentById(tenantId, paymentId);

      return res.json({
        success: true,
        data: payment,
      });
    } catch (error) {
      logger.error('Get payment error:', error);

      if (error instanceof Error && error.message === 'Payment not found') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'PAYMENT_NOT_FOUND',
            message: 'Payment not found',
          },
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_PAYMENT_FAILED',
          message: 'Failed to fetch payment',
        },
      });
    }
  }

  /**
   * POST /api/v1/payments/confirm
   * DEPRECATED: Use POST /api/v1/invoices instead
   * This endpoint is kept for backward compatibility and delegates to invoice creation
   */
  async confirmPayment(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const confirmedBy = getUserId(req);
      const input = confirmPaymentSchema.parse(req.body);

      // Delegate to invoices service
      const { invoicesService } = await import('../invoices/invoices.service');
      
      // Calculate credit to use (same logic as old confirmPayment)
      const creditToUse = input.useCreditAmount !== undefined 
        ? input.useCreditAmount 
        : 0; // Default to 0 if not specified

      const result = await invoicesService.createInvoice({
        tenantId,
        patientId: input.patientId,
        sessionIds: input.sessionIds,
        paidAmount: input.paidAmount,
        paymentMethod: input.paymentMethod,
        creditUsed: creditToUse,
        notes: input.notes,
        confirmedBy,
      });

      logger.info(
        `Payment confirmed via invoice: ${input.sessionIds.length} sessions for patient ${input.patientId} by ${req.user?.phoneNumber}`
      );

      // Return response in old format for backward compatibility
      return res.status(200).json({
        success: true,
        data: {
          success: true,
          payment: {
            totalDue: result.invoice.totalAmount,
            paidAmount: result.invoice.paidAmount,
            creditUsed: result.invoice.creditUsed,
            totalPayment: result.invoice.paidAmount + result.invoice.creditUsed,
            outstandingDues: result.invoice.outstandingAmount,
            paymentStatus: result.invoice.outstandingAmount === 0 ? 'PAID' : 'PARTIALLY_PAID',
          },
          invoice: result.invoice,
          patient: result.patient,
        },
      });
    } catch (error) {
      logger.error('Confirm payment error:', error);

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

        if (error.message.includes('not found or invalid')) {
          return res.status(404).json({
            success: false,
            error: {
              code: 'NO_UNPAID_SESSIONS',
              message: 'No unpaid sessions found',
            },
          });
        }

        if (error.message.includes('cannot be negative')) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_PAYMENT_AMOUNT',
              message: 'Paid amount must be greater than zero',
            },
          });
        }

        if (error.message.includes('exceeds available credit')) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'INSUFFICIENT_CREDIT',
              message: 'Insufficient credit balance',
            },
          });
        }
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'CONFIRM_PAYMENT_FAILED',
          message: 'Failed to confirm payment',
        },
      });
    }
  }

  /**
   * POST /api/v1/payments
   */
  async recordPayment(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const confirmedBy = getUserId(req);
      const input = recordPaymentSchema.parse(req.body);

      const payment = await paymentsService.recordPayment(tenantId, confirmedBy, input);

      logger.info(
        `Payment recorded: ${payment.id} (${input.method}) by ${req.user?.phoneNumber}`
      );

      return res.status(201).json({
        success: true,
        data: payment,
      });
    } catch (error) {
      logger.error('Record payment error:', error);

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

        if (error.message === 'User not found') {
          return res.status(404).json({
            success: false,
            error: {
              code: 'USER_NOT_FOUND',
              message: 'User not found',
            },
          });
        }
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'RECORD_PAYMENT_FAILED',
          message: 'Failed to record payment',
        },
      });
    }
  }

  /**
   * GET /api/v1/patients/:patientId/credits
   */
  async getPatientCreditBalance(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const patientId = req.params.patientId;

      const result = await paymentsService.getPatientCreditBalance(tenantId, patientId);

      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Get patient credit balance error:', error);

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
          code: 'FETCH_CREDITS_FAILED',
          message: 'Failed to fetch credit balance',
        },
      });
    }
  }

  /**
   * GET /api/v1/payments/history/:patientId
   * Get payment history for a patient with related sessions and summary
   */
  async getPaymentHistory(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const patientId = req.params.patientId;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

      const result = await paymentsService.getPatientPaymentHistory(
        tenantId,
        patientId,
        page,
        limit
      );

      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Get payment history error:', error);

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
          code: 'FETCH_HISTORY_FAILED',
          message: 'Failed to fetch payment history',
        },
      });
    }
  }

  /**
   * GET /api/v1/patients/:patientId/payment-history
   * Legacy endpoint - redirects to new endpoint
   */
  async getPatientPaymentHistory(req: Request, res: Response) {
    return this.getPaymentHistory(req, res);
  }
}

export const paymentsController = new PaymentsController();
