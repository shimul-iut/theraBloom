import { Request, Response } from 'express';
import { progressReportsService } from './progress-reports.service';
import { createProgressReportSchema, updateProgressReportSchema } from './progress-reports.schema';
import { getTenantId, getUserId } from '../../middleware/tenant';
import { logger } from '../../utils/logger';

export class ProgressReportsController {
  /**
   * GET /api/v1/progress-reports
   */
  async getProgressReports(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const filters = {
        patientId: req.query.patientId as string | undefined,
        therapistId: req.query.therapistId as string | undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      };

      const result = await progressReportsService.getProgressReports(tenantId, filters);

      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Get progress reports error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_REPORTS_FAILED',
          message: 'Failed to fetch progress reports',
        },
      });
    }
  }

  /**
   * GET /api/v1/progress-reports/:id
   */
  async getProgressReportById(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const reportId = req.params.id;

      const report = await progressReportsService.getProgressReportById(tenantId, reportId);

      return res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      logger.error('Get progress report error:', error);

      if (error instanceof Error && error.message === 'Progress report not found') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'REPORT_NOT_FOUND',
            message: 'Progress report not found',
          },
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_REPORT_FAILED',
          message: 'Failed to fetch progress report',
        },
      });
    }
  }

  /**
   * POST /api/v1/progress-reports
   */
  async createProgressReport(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const therapistId = getUserId(req);
      const input = createProgressReportSchema.parse(req.body);

      const report = await progressReportsService.createProgressReport(
        tenantId,
        therapistId,
        input
      );

      logger.info(`Progress report created: ${report.id} by ${req.user?.phoneNumber}`);

      return res.status(201).json({
        success: true,
        data: report,
      });
    } catch (error) {
      logger.error('Create progress report error:', error);

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

        if (error.message.includes('Session not found')) {
          return res.status(404).json({
            success: false,
            error: {
              code: 'SESSION_NOT_FOUND',
              message: error.message,
            },
          });
        }
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'CREATE_REPORT_FAILED',
          message: 'Failed to create progress report',
        },
      });
    }
  }

  /**
   * PUT /api/v1/progress-reports/:id
   */
  async updateProgressReport(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const therapistId = getUserId(req);
      const reportId = req.params.id;
      const input = updateProgressReportSchema.parse(req.body);

      const report = await progressReportsService.updateProgressReport(
        tenantId,
        therapistId,
        reportId,
        input
      );

      logger.info(`Progress report updated: ${reportId} by ${req.user?.phoneNumber}`);

      return res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      logger.error('Update progress report error:', error);

      if (error instanceof Error) {
        if (error.message === 'Progress report not found') {
          return res.status(404).json({
            success: false,
            error: {
              code: 'REPORT_NOT_FOUND',
              message: 'Progress report not found',
            },
          });
        }

        if (error.message.includes('only update your own')) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: error.message,
            },
          });
        }
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'UPDATE_REPORT_FAILED',
          message: 'Failed to update progress report',
        },
      });
    }
  }

  /**
   * GET /api/v1/patients/:patientId/progress-reports
   */
  async getPatientProgressReports(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const patientId = req.params.patientId;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

      const result = await progressReportsService.getPatientProgressReports(
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
      logger.error('Get patient progress reports error:', error);

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
          code: 'FETCH_REPORTS_FAILED',
          message: 'Failed to fetch patient progress reports',
        },
      });
    }
  }
}

export const progressReportsController = new ProgressReportsController();
