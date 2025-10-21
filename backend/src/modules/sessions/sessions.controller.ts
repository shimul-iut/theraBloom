import { Request, Response } from 'express';
import { sessionsService } from './sessions.service';
import {
  createSessionSchema,
  updateSessionSchema,
  cancelSessionSchema,
} from './sessions.schema';
import { getTenantId } from '../../middleware/tenant';
import { logger } from '../../utils/logger';
import { SessionStatus } from '@prisma/client';

export class SessionsController {
  /**
   * GET /api/v1/sessions
   */
  async getSessions(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const filters = {
        patientId: req.query.patientId as string | undefined,
        therapistId: req.query.therapistId as string | undefined,
        therapyTypeId: req.query.therapyTypeId as string | undefined,
        status: req.query.status as SessionStatus | undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      };

      const result = await sessionsService.getSessions(tenantId, filters);

      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Get sessions error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_SESSIONS_FAILED',
          message: 'Failed to fetch sessions',
        },
      });
    }
  }

  /**
   * GET /api/v1/sessions/:id
   */
  async getSessionById(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const sessionId = req.params.id;

      const session = await sessionsService.getSessionById(tenantId, sessionId);

      return res.json({
        success: true,
        data: session,
      });
    } catch (error) {
      logger.error('Get session error:', error);

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
          code: 'FETCH_SESSION_FAILED',
          message: 'Failed to fetch session',
        },
      });
    }
  }

  /**
   * POST /api/v1/sessions
   */
  async createSession(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const input = createSessionSchema.parse(req.body);

      const session = await sessionsService.createSession(tenantId, input);

      logger.info(`Session created: ${session.id} by ${req.user?.phoneNumber}`);

      return res.status(201).json({
        success: true,
        data: session,
      });
    } catch (error) {
      logger.error('Create session error:', error);

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

        if (error.message === 'Therapist not found') {
          return res.status(404).json({
            success: false,
            error: {
              code: 'THERAPIST_NOT_FOUND',
              message: 'Therapist not found',
            },
          });
        }

        if (error.message === 'Therapy type not found') {
          return res.status(404).json({
            success: false,
            error: {
              code: 'THERAPY_TYPE_NOT_FOUND',
              message: 'Therapy type not found',
            },
          });
        }

        if (error.message.includes('not available')) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'THERAPIST_NOT_AVAILABLE',
              message: error.message,
            },
          });
        }

        if (error.message.includes('Therapist already has a session')) {
          return res.status(409).json({
            success: false,
            error: {
              code: 'THERAPIST_SCHEDULING_CONFLICT',
              message: error.message,
            },
          });
        }

        if (error.message.includes('Patient already has a session')) {
          return res.status(409).json({
            success: false,
            error: {
              code: 'PATIENT_SCHEDULING_CONFLICT',
              message: error.message,
            },
          });
        }

        if (error.message.includes('Insufficient credit')) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'INSUFFICIENT_CREDIT',
              message: error.message,
            },
          });
        }
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'CREATE_SESSION_FAILED',
          message: 'Failed to create session',
        },
      });
    }
  }

  /**
   * PUT /api/v1/sessions/:id
   */
  async updateSession(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const sessionId = req.params.id;
      const input = updateSessionSchema.parse(req.body);

      const session = await sessionsService.updateSession(tenantId, sessionId, input);

      logger.info(`Session updated: ${sessionId} by ${req.user?.phoneNumber}`);

      return res.json({
        success: true,
        data: session,
      });
    } catch (error) {
      logger.error('Update session error:', error);

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

        if (error.message.includes('Cannot update')) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_SESSION_STATUS',
              message: error.message,
            },
          });
        }

        if (error.message.includes('not available')) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'THERAPIST_NOT_AVAILABLE',
              message: error.message,
            },
          });
        }

        if (error.message.includes('Therapist already has a session')) {
          return res.status(409).json({
            success: false,
            error: {
              code: 'THERAPIST_SCHEDULING_CONFLICT',
              message: error.message,
            },
          });
        }

        if (error.message.includes('Patient already has a session')) {
          return res.status(409).json({
            success: false,
            error: {
              code: 'PATIENT_SCHEDULING_CONFLICT',
              message: error.message,
            },
          });
        }
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'UPDATE_SESSION_FAILED',
          message: 'Failed to update session',
        },
      });
    }
  }

  /**
   * POST /api/v1/sessions/:id/cancel
   */
  async cancelSession(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const sessionId = req.params.id;
      const input = cancelSessionSchema.parse(req.body);

      const session = await sessionsService.cancelSession(tenantId, sessionId, input);

      logger.info(`Session cancelled: ${sessionId} by ${req.user?.phoneNumber}`);

      return res.json({
        success: true,
        data: session,
      });
    } catch (error) {
      logger.error('Cancel session error:', error);

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

        if (error.message.includes('already cancelled') || error.message.includes('Cannot cancel')) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_SESSION_STATUS',
              message: error.message,
            },
          });
        }
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'CANCEL_SESSION_FAILED',
          message: 'Failed to cancel session',
        },
      });
    }
  }

  /**
   * GET /api/v1/sessions/calendar
   */
  async getCalendarSessions(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const therapistId = req.query.therapistId as string | undefined;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_PARAMETERS',
            message: 'startDate and endDate are required',
          },
        });
      }

      const sessions = await sessionsService.getCalendarSessions(
        tenantId,
        startDate,
        endDate,
        therapistId
      );

      return res.json({
        success: true,
        data: sessions,
      });
    } catch (error) {
      logger.error('Get calendar sessions error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_CALENDAR_FAILED',
          message: 'Failed to fetch calendar sessions',
        },
      });
    }
  }
}

export const sessionsController = new SessionsController();
