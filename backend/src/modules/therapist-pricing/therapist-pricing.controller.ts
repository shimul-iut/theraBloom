import { Request, Response } from 'express';
import { therapistPricingService } from './therapist-pricing.service';
import { createPricingSchema, updatePricingSchema } from './therapist-pricing.schema';
import { getTenantId } from '../../middleware/tenant';
import { logger } from '../../utils/logger';

export class TherapistPricingController {
  /**
   * GET /api/v1/therapists/:therapistId/pricing
   */
  async getTherapistPricing(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const therapistId = req.params.therapistId;

      const pricing = await therapistPricingService.getTherapistPricing(tenantId, therapistId);

      return res.json({
        success: true,
        data: pricing,
      });
    } catch (error) {
      logger.error('Get therapist pricing error:', error);

      if (error instanceof Error && error.message === 'Therapist not found') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'THERAPIST_NOT_FOUND',
            message: 'Therapist not found',
          },
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_PRICING_FAILED',
          message: 'Failed to fetch therapist pricing',
        },
      });
    }
  }

  /**
   * GET /api/v1/therapists/:therapistId/pricing/:therapyTypeId
   */
  async getPricingForTherapyType(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const therapistId = req.params.therapistId;
      const therapyTypeId = req.params.therapyTypeId;

      const result = await therapistPricingService.getPricingForTherapyType(
        tenantId,
        therapistId,
        therapyTypeId
      );

      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Get pricing for therapy type error:', error);

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
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_PRICING_FAILED',
          message: 'Failed to fetch pricing',
        },
      });
    }
  }

  /**
   * POST /api/v1/therapists/:therapistId/pricing
   */
  async createPricing(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const therapistId = req.params.therapistId;
      const input = createPricingSchema.parse(req.body);

      const pricing = await therapistPricingService.createPricing(tenantId, therapistId, input);

      logger.info(`Pricing created for therapist ${therapistId} by ${req.user?.phoneNumber}`);

      return res.status(201).json({
        success: true,
        data: pricing,
      });
    } catch (error) {
      logger.error('Create pricing error:', error);

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

        if (error.message.includes('already exists')) {
          return res.status(409).json({
            success: false,
            error: {
              code: 'PRICING_EXISTS',
              message: error.message,
            },
          });
        }
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'CREATE_PRICING_FAILED',
          message: 'Failed to create pricing',
        },
      });
    }
  }

  /**
   * PUT /api/v1/therapists/:therapistId/pricing/:pricingId
   */
  async updatePricing(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const therapistId = req.params.therapistId;
      const pricingId = req.params.pricingId;
      const input = updatePricingSchema.parse(req.body);

      const pricing = await therapistPricingService.updatePricing(
        tenantId,
        therapistId,
        pricingId,
        input
      );

      logger.info(`Pricing ${pricingId} updated by ${req.user?.phoneNumber}`);

      return res.json({
        success: true,
        data: pricing,
      });
    } catch (error) {
      logger.error('Update pricing error:', error);

      if (error instanceof Error && error.message === 'Pricing not found') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'PRICING_NOT_FOUND',
            message: 'Pricing not found',
          },
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'UPDATE_PRICING_FAILED',
          message: 'Failed to update pricing',
        },
      });
    }
  }

  /**
   * DELETE /api/v1/therapists/:therapistId/pricing/:pricingId
   */
  async deletePricing(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const therapistId = req.params.therapistId;
      const pricingId = req.params.pricingId;

      const result = await therapistPricingService.deletePricing(tenantId, therapistId, pricingId);

      logger.info(`Pricing ${pricingId} deleted by ${req.user?.phoneNumber}`);

      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Delete pricing error:', error);

      if (error instanceof Error && error.message === 'Pricing not found') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'PRICING_NOT_FOUND',
            message: 'Pricing not found',
          },
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'DELETE_PRICING_FAILED',
          message: 'Failed to delete pricing',
        },
      });
    }
  }
}

export const therapistPricingController = new TherapistPricingController();
