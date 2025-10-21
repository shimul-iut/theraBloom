import { Request, Response } from 'express';
import { rescheduleRequestsService } from './reschedule-requests.service';
import {
  createRescheduleRequestSchema,
  reviewRescheduleRequestSchema,
} from './reschedule-requests.schema';
import { getTenantId, getUserId } from '../../middleware/tenant';
import { logger } from '../../utils/logger';
import { RescheduleStatus } from '@prisma/client';

export class RescheduleRequestsController {
  /**
   * GET /api/v1/reschedule-requests
   */
  async getRescheduleRequests(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const filters = {
        therapistId: req.query.therapistId as string | undefined,
        status: req.query.status as RescheduleStatus | undefined,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      };

      const result = await rescheduleRequestsService.getRescheduleRequests(tenantId, filters);

      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Get reschedule requests error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_REQUESTS_FAILED',
          message: 'Failed to fetch reschedule requests',
        },
      });
    }
  }

  /**
   * GET /api/v1/reschedule-requests/:id
   */
  async getRescheduleRequestById(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const requestId = req.params.id;

      const request = await rescheduleRequestsService.getRescheduleRequestById(
        tenantId,
        requestId
      );

      return res.json({
        success: true,
        data: request,
      });
    } catch (error) {
      logger.error('Get reschedule request error:', error);

      if (error instanceof Error && error.message === 'Reschedule request not found') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'REQUEST_NOT_FOUND',
            message: 'Reschedule request not found',
          },
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_REQUEST_FAILED',
          message: 'Failed to fetch reschedule request',
        },
      });
    }
  }

  /**
   * POST /api/v1/reschedule-requests
   */
  async createRescheduleRequest(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const therapistId = getUserId(req);
      const input = createRescheduleRequestSchema.parse(req.body);

      const request = await rescheduleRequestsService.createRescheduleRequest(
        tenantId,
        therapistId,
        input
      );

      logger.info(`Reschedule request created: ${request.id} by ${req.user?.phoneNumber}`);

      return res.status(201).json({
        success: true,
        data: request,
      });
    } catch (error) {
      logger.error('Create reschedule request error:', error);

      if (error instanceof Error) {
        if (error.message.includes('not found') || error.message.includes('does not belong')) {
          return res.status(404).json({
            success: false,
            error: {
              code: 'SESSION_NOT_FOUND',
              message: error.message,
            },
          });
        }

        if (error.message.includes('Cannot reschedule')) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_SESSION_STATUS',
              message: error.message,
            },
          });
        }

        if (error.message.includes('48 hours')) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'TOO_LATE_TO_RESCHEDULE',
              message: error.message,
            },
          });
        }

        if (error.message.includes('already a pending')) {
          return res.status(409).json({
            success: false,
            error: {
              code: 'PENDING_REQUEST_EXISTS',
              message: error.message,
            },
          });
        }
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'CREATE_REQUEST_FAILED',
          message: 'Failed to create reschedule request',
        },
      });
    }
  }

  /**
   * PUT /api/v1/reschedule-requests/:id/approve
   */
  async approveRescheduleRequest(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const reviewerId = getUserId(req);
      const requestId = req.params.id;
      const input = reviewRescheduleRequestSchema.parse(req.body);

      const request = await rescheduleRequestsService.approveRescheduleRequest(
        tenantId,
        reviewerId,
        requestId,
        input
      );

      logger.info(`Reschedule request approved: ${requestId} by ${req.user?.phoneNumber}`);

      return res.json({
        success: true,
        data: request,
      });
    } catch (error) {
      logger.error('Approve reschedule request error:', error);

      if (error instanceof Error) {
        if (error.message === 'Reschedule request not found') {
          return res.status(404).json({
            success: false,
            error: {
              code: 'REQUEST_NOT_FOUND',
              message: 'Reschedule request not found',
            },
          });
        }

        if (error.message.includes('Cannot approve')) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_REQUEST_STATUS',
              message: error.message,
            },
          });
        }
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'APPROVE_REQUEST_FAILED',
          message: 'Failed to approve reschedule request',
        },
      });
    }
  }

  /**
   * PUT /api/v1/reschedule-requests/:id/reject
   */
  async rejectRescheduleRequest(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const reviewerId = getUserId(req);
      const requestId = req.params.id;
      const input = reviewRescheduleRequestSchema.parse(req.body);

      const request = await rescheduleRequestsService.rejectRescheduleRequest(
        tenantId,
        reviewerId,
        requestId,
        input
      );

      logger.info(`Reschedule request rejected: ${requestId} by ${req.user?.phoneNumber}`);

      return res.json({
        success: true,
        data: request,
      });
    } catch (error) {
      logger.error('Reject reschedule request error:', error);

      if (error instanceof Error) {
        if (error.message === 'Reschedule request not found') {
          return res.status(404).json({
            success: false,
            error: {
              code: 'REQUEST_NOT_FOUND',
              message: 'Reschedule request not found',
            },
          });
        }

        if (error.message.includes('Cannot reject')) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_REQUEST_STATUS',
              message: error.message,
            },
          });
        }
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'REJECT_REQUEST_FAILED',
          message: 'Failed to reject reschedule request',
        },
      });
    }
  }

  /**
   * DELETE /api/v1/reschedule-requests/:id
   */
  async cancelRescheduleRequest(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const therapistId = getUserId(req);
      const requestId = req.params.id;

      const request = await rescheduleRequestsService.cancelRescheduleRequest(
        tenantId,
        therapistId,
        requestId
      );

      logger.info(`Reschedule request cancelled: ${requestId} by ${req.user?.phoneNumber}`);

      return res.json({
        success: true,
        data: request,
      });
    } catch (error) {
      logger.error('Cancel reschedule request error:', error);

      if (error instanceof Error) {
        if (error.message === 'Reschedule request not found') {
          return res.status(404).json({
            success: false,
            error: {
              code: 'REQUEST_NOT_FOUND',
              message: 'Reschedule request not found',
            },
          });
        }

        if (error.message.includes('only cancel your own')) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: error.message,
            },
          });
        }

        if (error.message.includes('Cannot cancel')) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_REQUEST_STATUS',
              message: error.message,
            },
          });
        }
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'CANCEL_REQUEST_FAILED',
          message: 'Failed to cancel reschedule request',
        },
      });
    }
  }
}

export const rescheduleRequestsController = new RescheduleRequestsController();
