import { Request, Response } from 'express';
import { therapistUnavailabilityService } from './therapist-unavailability.service';
import {
  createUnavailabilitySchema,
  updateUnavailabilitySchema,
} from './therapist-unavailability.schema';
import { getTenantId } from '../../middleware/tenant';
import { logger } from '../../utils/logger';

export class TherapistUnavailabilityController {
  /**
   * GET /api/v1/therapists/:therapistId/unavailability
   */
  async getTherapistUnavailability(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const therapistId = req.params.therapistId;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      const unavailability = await therapistUnavailabilityService.getTherapistUnavailability(
        tenantId,
        therapistId,
        startDate,
        endDate
      );

      return res.json({
        success: true,
        data: unavailability,
      });
    } catch (error) {
      logger.error('Get therapist unavailability error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_UNAVAILABILITY_FAILED',
          message: 'Failed to fetch therapist unavailability',
        },
      });
    }
  }

  /**
   * GET /api/v1/therapists/:therapistId/unavailability/:id
   */
  async getUnavailabilityById(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const therapistId = req.params.therapistId;
      const id = req.params.id;

      const unavailability = await therapistUnavailabilityService.getUnavailabilityById(
        tenantId,
        therapistId,
        id
      );

      return res.json({
        success: true,
        data: unavailability,
      });
    } catch (error) {
      logger.error('Get unavailability error:', error);

      if (error instanceof Error && error.message === 'Unavailability period not found') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'UNAVAILABILITY_NOT_FOUND',
            message: 'Unavailability period not found',
          },
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_UNAVAILABILITY_FAILED',
          message: 'Failed to fetch unavailability period',
        },
      });
    }
  }

  /**
   * GET /api/v1/therapists/:therapistId/unavailability/affected-sessions
   */
  async getAffectedSessions(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const therapistId = req.params.therapistId;
      const { startDate, endDate, startTime, endTime } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_PARAMETERS',
            message: 'startDate and endDate are required',
          },
        });
      }

      const affectedSessions = await therapistUnavailabilityService.getAffectedSessions(
        tenantId,
        therapistId,
        new Date(startDate as string),
        new Date(endDate as string),
        startTime as string | undefined,
        endTime as string | undefined
      );

      return res.json({
        success: true,
        data: affectedSessions,
      });
    } catch (error) {
      logger.error('Get affected sessions error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_AFFECTED_SESSIONS_FAILED',
          message: 'Failed to fetch affected sessions',
        },
      });
    }
  }

  /**
   * GET /api/v1/therapists/:therapistId/unavailability/reschedule-slots
   */
  async getAvailableRescheduleSlots(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const therapistId = req.params.therapistId;
      const { startDate, sessionDuration, daysAhead } = req.query;

      if (!startDate || !sessionDuration) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_PARAMETERS',
            message: 'startDate and sessionDuration are required',
          },
        });
      }

      const availableSlots = await therapistUnavailabilityService.getAvailableRescheduleSlots(
        tenantId,
        therapistId,
        parseInt(sessionDuration as string),
        new Date(startDate as string),
        daysAhead ? parseInt(daysAhead as string) : 30
      );

      return res.json({
        success: true,
        data: availableSlots,
      });
    } catch (error) {
      logger.error('Get available reschedule slots error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_RESCHEDULE_SLOTS_FAILED',
          message: 'Failed to fetch available reschedule slots',
        },
      });
    }
  }

  /**
   * POST /api/v1/therapists/:therapistId/unavailability
   */
  async createUnavailability(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const therapistId = req.params.therapistId;
      const input = createUnavailabilitySchema.parse(req.body);

      const result = await therapistUnavailabilityService.createUnavailability(
        tenantId,
        therapistId,
        input
      );

      logger.info(
        `Unavailability created for therapist ${therapistId} by ${req.user?.phoneNumber}`
      );

      return res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Create unavailability error:', error);

      if (error instanceof Error) {
        if (error.message === 'Therapist not found') {
          return res.status(404).json({
            success: false,
            error: {
              code: 'THERAPIST_NOT_FOUND',
              message: 'Therapist not found',
            },
          });
        }

        if (error.message.includes('scheduled sessions')) {
          return res.status(409).json({
            success: false,
            error: {
              code: 'SESSIONS_CONFLICT',
              message: error.message,
            },
          });
        }
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'CREATE_UNAVAILABILITY_FAILED',
          message: 'Failed to create unavailability period',
        },
      });
    }
  }

  /**
   * PUT /api/v1/therapists/:therapistId/unavailability/:id
   */
  async updateUnavailability(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const therapistId = req.params.therapistId;
      const id = req.params.id;
      const input = updateUnavailabilitySchema.parse(req.body);

      const unavailability = await therapistUnavailabilityService.updateUnavailability(
        tenantId,
        therapistId,
        id,
        input
      );

      logger.info(`Unavailability ${id} updated by ${req.user?.phoneNumber}`);

      return res.json({
        success: true,
        data: unavailability,
      });
    } catch (error) {
      logger.error('Update unavailability error:', error);

      if (error instanceof Error && error.message === 'Unavailability period not found') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'UNAVAILABILITY_NOT_FOUND',
            message: 'Unavailability period not found',
          },
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'UPDATE_UNAVAILABILITY_FAILED',
          message: 'Failed to update unavailability period',
        },
      });
    }
  }

  /**
   * DELETE /api/v1/therapists/:therapistId/unavailability/:id
   */
  async deleteUnavailability(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const therapistId = req.params.therapistId;
      const id = req.params.id;

      const result = await therapistUnavailabilityService.deleteUnavailability(
        tenantId,
        therapistId,
        id
      );

      logger.info(`Unavailability ${id} deleted by ${req.user?.phoneNumber}`);

      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Delete unavailability error:', error);

      if (error instanceof Error && error.message === 'Unavailability period not found') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'UNAVAILABILITY_NOT_FOUND',
            message: 'Unavailability period not found',
          },
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'DELETE_UNAVAILABILITY_FAILED',
          message: 'Failed to delete unavailability period',
        },
      });
    }
  }
}

export const therapistUnavailabilityController = new TherapistUnavailabilityController();
