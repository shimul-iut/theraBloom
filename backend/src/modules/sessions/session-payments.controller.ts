import { Request, Response } from 'express';
import { sessionPaymentsService } from './session-payments.service';
import { recordSessionPaymentSchema } from './session-payments.schema';
import { getTenantId } from '../../middleware/tenant';
import { logger } from '../../utils/logger';

export class SessionPaymentsController {
  /**
   * GET /api/v1/sessions/:sessionId/payments
   */
  async getSessionPayments(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const sessionId = req.params.sessionId;

      const result = await sessionPaymentsService.getSessionPayments(tenantId, sessionId);

      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Get session payments error:', error);

      if (error instanceof Error && error.message === 'Session not found') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'SESSION_NOT_FOUND',
            message: 'Session not found',
          },
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_PAYMENTS_FAILED',
          message: 'Failed to fetch session payments',
        },
      });
    }
  }

  /**
   * POST /api/v1/sessions/:sessionId/payments
   */
  async recordSessionPayment(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const sessionId = req.params.sessionId;
      const input = recordSessionPaymentSchema.parse(req.body);

      const payment = await sessionPaymentsService.recordSessionPayment(
        tenantId,
        sessionId,
        input
      );

      logger.info(`Session payment recorded: ${payment.id} by ${req.user?.phoneNumber}`);

      return res.status(201).json({
        success: true,
        data: payment,
      });
    } catch (error) {
      logger.error('Record session payment error:', error);

      if (error instanceof Error) {
        if (error.message === 'Session not found') {
          return res.status(404).json({
            success: false,
            error: {
              code: 'SESSION_NOT_FOUND',
              message: 'Session not found',
            },
          });
        }

        if (error.message.includes('exceeds remaining balance')) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_PAYMENT_AMOUNT',
              message: error.message,
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
   * GET /api/v1/sessions/:sessionId/payment-summary
   */
  async getPaymentSummary(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const sessionId = req.params.sessionId;

      const summary = await sessionPaymentsService.getPaymentSummary(tenantId, sessionId);

      return res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      logger.error('Get payment summary error:', error);

      if (error instanceof Error && error.message === 'Session not found') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'SESSION_NOT_FOUND',
            message: 'Session not found',
          },
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_SUMMARY_FAILED',
          message: 'Failed to fetch payment summary',
        },
      });
    }
  }
}

export const sessionPaymentsController = new SessionPaymentsController();
