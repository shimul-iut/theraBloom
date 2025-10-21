import { Request, Response } from 'express';
import { patientsService } from './patients.service';
import { createPatientSchema, updatePatientSchema } from './patients.schema';
import { getTenantId } from '../../middleware/tenant';
import { logger } from '../../utils/logger';

export class PatientsController {
  /**
   * GET /api/v1/patients
   */
  async getPatients(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const query = req.query.query as string | undefined;
      const active = req.query.active === 'true' ? true : req.query.active === 'false' ? false : undefined;

      const result = await patientsService.getPatients(tenantId, page, limit, query, active);

      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Get patients error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_PATIENTS_FAILED',
          message: 'Failed to fetch patients',
        },
      });
    }
  }

  /**
   * GET /api/v1/patients/:id
   */
  async getPatientById(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const patientId = req.params.id;

      const patient = await patientsService.getPatientById(tenantId, patientId);

      return res.json({
        success: true,
        data: patient,
      });
    } catch (error) {
      logger.error('Get patient error:', error);

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
          code: 'FETCH_PATIENT_FAILED',
          message: 'Failed to fetch patient',
        },
      });
    }
  }

  /**
   * POST /api/v1/patients
   */
  async createPatient(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const input = createPatientSchema.parse(req.body);

      const patient = await patientsService.createPatient(tenantId, input);

      logger.info(`Patient created: ${patient.firstName} ${patient.lastName} by ${req.user?.phoneNumber}`);

      return res.status(201).json({
        success: true,
        data: patient,
      });
    } catch (error) {
      logger.error('Create patient error:', error);

      // Handle Zod validation errors
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message,
          },
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'CREATE_PATIENT_FAILED',
          message: 'Failed to create patient',
        },
      });
    }
  }

  /**
   * PUT /api/v1/patients/:id
   */
  async updatePatient(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const patientId = req.params.id;
      const input = updatePatientSchema.parse(req.body);

      const patient = await patientsService.updatePatient(tenantId, patientId, input);

      logger.info(`Patient updated: ${patientId} by ${req.user?.phoneNumber}`);

      return res.json({
        success: true,
        data: patient,
      });
    } catch (error) {
      logger.error('Update patient error:', error);

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
          code: 'UPDATE_PATIENT_FAILED',
          message: 'Failed to update patient',
        },
      });
    }
  }

  /**
   * GET /api/v1/patients/:id/sessions
   */
  async getPatientSessions(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const patientId = req.params.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await patientsService.getPatientSessions(tenantId, patientId, page, limit);

      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Get patient sessions error:', error);

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
          code: 'FETCH_SESSIONS_FAILED',
          message: 'Failed to fetch patient sessions',
        },
      });
    }
  }

  /**
   * GET /api/v1/patients/:id/payments
   */
  async getPatientPayments(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const patientId = req.params.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await patientsService.getPatientPayments(tenantId, patientId, page, limit);

      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Get patient payments error:', error);

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
          code: 'FETCH_PAYMENTS_FAILED',
          message: 'Failed to fetch patient payments',
        },
      });
    }
  }

  /**
   * GET /api/v1/patients/:id/outstanding-dues
   */
  async getPatientOutstandingDues(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const patientId = req.params.id;

      const result = await patientsService.getPatientOutstandingDues(tenantId, patientId);

      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Get patient outstanding dues error:', error);

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
          code: 'FETCH_DUES_FAILED',
          message: 'Failed to fetch outstanding dues',
        },
      });
    }
  }
}

export const patientsController = new PatientsController();
