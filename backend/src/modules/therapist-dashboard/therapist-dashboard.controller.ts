import { Request, Response } from 'express';
import { therapistDashboardService } from './therapist-dashboard.service';
import { getTenantId, getUserId } from '../../middleware/tenant';
import { logger } from '../../utils/logger';
import { completeSessionSchema } from './therapist-dashboard.schema';
import { SessionStatus } from '@prisma/client';

export class TherapistDashboardController {
  /**
   * GET /api/v1/therapist/dashboard
   */
  async getDashboard(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const therapistId = getUserId(req);

      const dashboard = await therapistDashboardService.getTherapistDashboard(
        tenantId,
        therapistId
      );

      return res.json({
        success: true,
        data: dashboard,
      });
    } catch (error) {
      logger.error('Get therapist dashboard error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_DASHBOARD_FAILED',
          message: 'Failed to fetch therapist dashboard',
        },
      });
    }
  }

  /**
   * GET /api/v1/therapist/schedule
   */
  async getSchedule(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const therapistId = getUserId(req);

      const filters = {
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        status: req.query.status as SessionStatus | undefined,
      };

      const schedule = await therapistDashboardService.getTherapistSchedule(
        tenantId,
        therapistId,
        filters
      );

      return res.json({
        success: true,
        data: schedule,
      });
    } catch (error) {
      logger.error('Get therapist schedule error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_SCHEDULE_FAILED',
          message: 'Failed to fetch therapist schedule',
        },
      });
    }
  }

  /**
   * GET /api/v1/therapist/patients
   */
  async getPatients(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const therapistId = getUserId(req);

      const patients = await therapistDashboardService.getTherapistPatients(
        tenantId,
        therapistId
      );

      return res.json({
        success: true,
        data: patients,
      });
    } catch (error) {
      logger.error('Get therapist patients error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_PATIENTS_FAILED',
          message: 'Failed to fetch therapist patients',
        },
      });
    }
  }

  /**
   * GET /api/v1/therapist/sessions/upcoming
   */
  async getUpcomingSessions(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const therapistId = getUserId(req);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const sessions = await therapistDashboardService.getUpcomingSessions(
        tenantId,
        therapistId,
        limit
      );

      return res.json({
        success: true,
        data: sessions,
      });
    } catch (error) {
      logger.error('Get upcoming sessions error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_SESSIONS_FAILED',
          message: 'Failed to fetch upcoming sessions',
        },
      });
    }
  }

  /**
   * GET /api/v1/therapist/sessions/today
   */
  async getTodaySessions(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const therapistId = getUserId(req);

      const sessions = await therapistDashboardService.getTodaySessions(
        tenantId,
        therapistId
      );

      return res.json({
        success: true,
        data: sessions,
      });
    } catch (error) {
      logger.error('Get today sessions error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_SESSIONS_FAILED',
          message: 'Failed to fetch today\'s sessions',
        },
      });
    }
  }

  /**
   * PUT /api/v1/therapist/sessions/:id/complete
   */
  async completeSession(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const therapistId = getUserId(req);
      const sessionId = req.params.id;

      const input = completeSessionSchema.parse(req.body);

      const session = await therapistDashboardService.completeSession(
        tenantId,
        therapistId,
        sessionId,
        input
      );

      logger.info(`Session completed: ${sessionId} by ${req.user?.phoneNumber}`);

      return res.json({
        success: true,
        data: session,
      });
    } catch (error) {
      logger.error('Complete session error:', error);
      
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
        
        if (error.message.includes('Cannot complete') || error.message.includes('already completed')) {
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
          code: 'COMPLETE_SESSION_FAILED',
          message: 'Failed to complete session',
        },
      });
    }
  }

  /**
   * GET /api/v1/therapist/weekly-overview
   */
  async getWeeklyOverview(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const therapistId = getUserId(req);
      
      const weekStart = req.query.weekStart 
        ? new Date(req.query.weekStart as string)
        : undefined;

      const overview = await therapistDashboardService.getWeeklyOverview(
        tenantId,
        therapistId,
        weekStart
      );

      return res.json({
        success: true,
        data: overview,
      });
    } catch (error) {
      logger.error('Get weekly overview error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_OVERVIEW_FAILED',
          message: 'Failed to fetch weekly overview',
        },
      });
    }
  }
}

export const therapistDashboardController = new TherapistDashboardController();
