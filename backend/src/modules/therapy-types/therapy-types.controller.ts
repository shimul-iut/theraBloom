import { Request, Response } from 'express';
import { therapyTypesService } from './therapy-types.service';
import { createTherapyTypeSchema, updateTherapyTypeSchema } from './therapy-types.schema';
import { getTenantId } from '../../middleware/tenant';
import { logger } from '../../utils/logger';

export class TherapyTypesController {
  /**
   * GET /api/v1/therapy-types
   */
  async getTherapyTypes(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const activeOnly = req.query.active === 'true';

      const therapyTypes = await therapyTypesService.getTherapyTypes(tenantId, activeOnly);

      return res.json({
        success: true,
        data: therapyTypes,
      });
    } catch (error) {
      logger.error('Get therapy types error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_THERAPY_TYPES_FAILED',
          message: 'Failed to fetch therapy types',
        },
      });
    }
  }

  /**
   * GET /api/v1/therapy-types/:id
   */
  async getTherapyTypeById(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const therapyTypeId = req.params.id;

      const therapyType = await therapyTypesService.getTherapyTypeById(tenantId, therapyTypeId);

      return res.json({
        success: true,
        data: therapyType,
      });
    } catch (error) {
      logger.error('Get therapy type error:', error);

      if (error instanceof Error && error.message === 'Therapy type not found') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'THERAPY_TYPE_NOT_FOUND',
            message: 'Therapy type not found',
          },
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_THERAPY_TYPE_FAILED',
          message: 'Failed to fetch therapy type',
        },
      });
    }
  }

  /**
   * POST /api/v1/therapy-types
   */
  async createTherapyType(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const input = createTherapyTypeSchema.parse(req.body);

      const therapyType = await therapyTypesService.createTherapyType(tenantId, input);

      logger.info(`Therapy type created: ${therapyType.name} by ${req.user?.phoneNumber}`);

      return res.status(201).json({
        success: true,
        data: therapyType,
      });
    } catch (error) {
      logger.error('Create therapy type error:', error);

      if (error instanceof Error && error.message.includes('already exists')) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'THERAPY_TYPE_EXISTS',
            message: error.message,
          },
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'CREATE_THERAPY_TYPE_FAILED',
          message: 'Failed to create therapy type',
        },
      });
    }
  }

  /**
   * PUT /api/v1/therapy-types/:id
   */
  async updateTherapyType(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const therapyTypeId = req.params.id;
      const input = updateTherapyTypeSchema.parse(req.body);

      const therapyType = await therapyTypesService.updateTherapyType(
        tenantId,
        therapyTypeId,
        input
      );

      logger.info(`Therapy type updated: ${therapyTypeId} by ${req.user?.phoneNumber}`);

      return res.json({
        success: true,
        data: therapyType,
      });
    } catch (error) {
      logger.error('Update therapy type error:', error);

      if (error instanceof Error) {
        if (error.message === 'Therapy type not found') {
          return res.status(404).json({
            success: false,
            error: {
              code: 'THERAPY_TYPE_NOT_FOUND',
              message: 'Therapy type not found',
            },
          });
        }

        if (error.message.includes('already exists')) {
          return res.status(409).json({
            success: false,
            error: {
              code: 'THERAPY_TYPE_EXISTS',
              message: error.message,
            },
          });
        }
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'UPDATE_THERAPY_TYPE_FAILED',
          message: 'Failed to update therapy type',
        },
      });
    }
  }

  /**
   * DELETE /api/v1/therapy-types/:id
   */
  async deleteTherapyType(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const therapyTypeId = req.params.id;

      const result = await therapyTypesService.deleteTherapyType(tenantId, therapyTypeId);

      logger.info(`Therapy type deleted: ${therapyTypeId} by ${req.user?.phoneNumber}`);

      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Delete therapy type error:', error);

      if (error instanceof Error) {
        if (error.message === 'Therapy type not found') {
          return res.status(404).json({
            success: false,
            error: {
              code: 'THERAPY_TYPE_NOT_FOUND',
              message: 'Therapy type not found',
            },
          });
        }

        if (error.message.includes('Cannot delete')) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'THERAPY_TYPE_IN_USE',
              message: error.message,
            },
          });
        }
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'DELETE_THERAPY_TYPE_FAILED',
          message: 'Failed to delete therapy type',
        },
      });
    }
  }
}

export const therapyTypesController = new TherapyTypesController();
