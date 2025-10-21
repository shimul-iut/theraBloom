import { Request, Response } from 'express';
import { therapistAvailabilityService } from './therapist-availability.service';
import {
  createAvailabilitySchema,
  updateAvailabilitySchema,
} from './therapist-availability.schema';
import { getTenantId } from '../../middleware/tenant';
import { logger } from '../../utils/logger';
import { DayOfWeek } from '@prisma/client';

export class TherapistAvailabilityController {
  /**
   * GET /api/v1/therapists/:therapistId/availability
   */
  async getTherapistAvailability(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const therapistId = req.params.therapistId;
      const dayOfWeek = req.query.dayOfWeek as DayOfWeek | undefined;
      const therapyTypeId = req.query.therapyTypeId as string | undefined;

      const availability = await therapistAvailabilityService.getTherapistAvailability(
        tenantId,
        therapistId,
        dayOfWeek,
        therapyTypeId
      );

      return res.json({
        success: true,
        data: availability,
      });
    } catch (error) {
      logger.error('Get therapist availability error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_AVAILABILITY_FAILED',
          message: 'Failed to fetch therapist availability',
        },
      });
    }
  }

  /**
   * GET /api/v1/therapists/:therapistId/availability/:slotId
   */
  async getAvailabilityById(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const therapistId = req.params.therapistId;
      const slotId = req.params.slotId;

      const slot = await therapistAvailabilityService.getAvailabilityById(
        tenantId,
        therapistId,
        slotId
      );

      return res.json({
        success: true,
        data: slot,
      });
    } catch (error) {
      logger.error('Get availability slot error:', error);

      if (error instanceof Error && error.message === 'Availability slot not found') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'SLOT_NOT_FOUND',
            message: 'Availability slot not found',
          },
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_SLOT_FAILED',
          message: 'Failed to fetch availability slot',
        },
      });
    }
  }

  /**
   * POST /api/v1/therapists/:therapistId/availability
   */
  async createAvailability(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const therapistId = req.params.therapistId;
      const input = createAvailabilitySchema.parse(req.body);

      const availability = await therapistAvailabilityService.createAvailability(
        tenantId,
        therapistId,
        input
      );

      logger.info(
        `Availability created for therapist ${therapistId} by ${req.user?.phoneNumber}`
      );

      return res.status(201).json({
        success: true,
        data: availability,
      });
    } catch (error) {
      logger.error('Create availability error:', error);

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

        if (error.message === 'Therapy type not found') {
          return res.status(404).json({
            success: false,
            error: {
              code: 'THERAPY_TYPE_NOT_FOUND',
              message: 'Therapy type not found',
            },
          });
        }

        if (error.message.includes('overlaps')) {
          return res.status(409).json({
            success: false,
            error: {
              code: 'TIME_SLOT_OVERLAP',
              message: error.message,
            },
          });
        }
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'CREATE_AVAILABILITY_FAILED',
          message: 'Failed to create availability',
        },
      });
    }
  }

  /**
   * PUT /api/v1/therapists/:therapistId/availability/:slotId
   */
  async updateAvailability(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const therapistId = req.params.therapistId;
      const slotId = req.params.slotId;
      const input = updateAvailabilitySchema.parse(req.body);

      const availability = await therapistAvailabilityService.updateAvailability(
        tenantId,
        therapistId,
        slotId,
        input
      );

      logger.info(`Availability slot ${slotId} updated by ${req.user?.phoneNumber}`);

      return res.json({
        success: true,
        data: availability,
      });
    } catch (error) {
      logger.error('Update availability error:', error);

      if (error instanceof Error) {
        if (error.message === 'Availability slot not found') {
          return res.status(404).json({
            success: false,
            error: {
              code: 'SLOT_NOT_FOUND',
              message: 'Availability slot not found',
            },
          });
        }

        if (error.message.includes('overlaps')) {
          return res.status(409).json({
            success: false,
            error: {
              code: 'TIME_SLOT_OVERLAP',
              message: error.message,
            },
          });
        }
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'UPDATE_AVAILABILITY_FAILED',
          message: 'Failed to update availability',
        },
      });
    }
  }

  /**
   * DELETE /api/v1/therapists/:therapistId/availability/:slotId
   */
  async deleteAvailability(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const therapistId = req.params.therapistId;
      const slotId = req.params.slotId;

      const result = await therapistAvailabilityService.deleteAvailability(
        tenantId,
        therapistId,
        slotId
      );

      logger.info(`Availability slot ${slotId} deleted by ${req.user?.phoneNumber}`);

      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Delete availability error:', error);

      if (error instanceof Error && error.message === 'Availability slot not found') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'SLOT_NOT_FOUND',
            message: 'Availability slot not found',
          },
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'DELETE_AVAILABILITY_FAILED',
          message: 'Failed to delete availability',
        },
      });
    }
  }
}

export const therapistAvailabilityController = new TherapistAvailabilityController();
