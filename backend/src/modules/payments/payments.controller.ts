import { Request, Response } from 'express';
import { paymentsService } from './payments.service';
import { recordPaymentSchema } from './payments.schema';
import { getTenantId, getUserId } from '../../middleware/tenant';
import { logger } from '../../utils/logger';
import { PaymentMethod } from '@prisma/client';

export class PaymentsController {
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
   * GET /api/v1/patients/:patientId/payment-history
   */
  async getPatientPaymentHistory(req: Request, res: Response) {
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
      logger.error('Get patient payment history error:', error);

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
}

export const paymentsController = new PaymentsController();
