import { Request, Response } from 'express';
import { reportsService } from './reports.service';
import { getTenantId } from '../../middleware/tenant';
import { logger } from '../../utils/logger';
import { SessionStatus } from '@prisma/client';

export class ReportsController {
  /**
   * GET /api/v1/reports/dashboard
   */
  async getDashboardKPIs(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      const kpis = await reportsService.getDashboardKPIs(tenantId, startDate, endDate);

      return res.json({
        success: true,
        data: kpis,
      });
    } catch (error) {
      logger.error('Get dashboard KPIs error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_DASHBOARD_FAILED',
          message: 'Failed to fetch dashboard KPIs',
        },
      });
    }
  }

  /**
   * GET /api/v1/reports/financial
   */
  async getFinancialSummary(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      const summary = await reportsService.getFinancialSummary(tenantId, startDate, endDate);

      return res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      logger.error('Get financial summary error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_FINANCIAL_FAILED',
          message: 'Failed to fetch financial summary',
        },
      });
    }
  }

  /**
   * GET /api/v1/reports/sessions
   */
  async getSessionReports(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const filters = {
        therapistId: req.query.therapistId as string | undefined,
        patientId: req.query.patientId as string | undefined,
        therapyTypeId: req.query.therapyTypeId as string | undefined,
        status: req.query.status as SessionStatus | undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
      };

      const report = await reportsService.getSessionReports(tenantId, filters);

      return res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      logger.error('Get session reports error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_SESSION_REPORTS_FAILED',
          message: 'Failed to fetch session reports',
        },
      });
    }
  }

  /**
   * GET /api/v1/reports/revenue-trend
   */
  async getRevenueTrend(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const groupBy = (req.query.groupBy as 'day' | 'week' | 'month') || 'day';

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_PARAMETERS',
            message: 'startDate and endDate are required',
          },
        });
      }

      const trend = await reportsService.getRevenueTrend(tenantId, startDate, endDate, groupBy);

      return res.json({
        success: true,
        data: trend,
      });
    } catch (error) {
      logger.error('Get revenue trend error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_REVENUE_TREND_FAILED',
          message: 'Failed to fetch revenue trend',
        },
      });
    }
  }

  /**
   * GET /api/v1/reports/export
   * Export reports as CSV
   */
  async exportReport(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const reportType = req.query.type as string;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      if (!reportType) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_PARAMETERS',
            message: 'Report type is required',
          },
        });
      }

      let csvData: string;
      let filename: string;

      switch (reportType) {
        case 'financial':
          const financial = await reportsService.getFinancialSummary(
            tenantId,
            startDate,
            endDate
          );
          csvData = this.generateFinancialCSV(financial);
          filename = `financial-report-${Date.now()}.csv`;
          break;

        case 'sessions':
          const sessions = await reportsService.getSessionReports(tenantId, {
            startDate,
            endDate,
          });
          csvData = this.generateSessionsCSV(sessions);
          filename = `sessions-report-${Date.now()}.csv`;
          break;

        default:
          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_REPORT_TYPE',
              message: 'Invalid report type. Use: financial, sessions',
            },
          });
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(csvData);
    } catch (error) {
      logger.error('Export report error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'EXPORT_FAILED',
          message: 'Failed to export report',
        },
      });
    }
  }

  /**
   * Generate CSV for financial report
   */
  private generateFinancialCSV(data: any): string {
    const lines: string[] = [];

    // Header
    lines.push('Financial Summary Report');
    lines.push(`Period: ${data.period.startDate || 'All'} to ${data.period.endDate || 'All'}`);
    lines.push('');

    // Revenue section
    lines.push('REVENUE');
    lines.push('Therapy Type,Amount,Percentage');
    for (const item of data.revenue.breakdown) {
      lines.push(`${item.therapyType},${item.amount},${item.percentage}%`);
    }
    lines.push(`Total Revenue,${data.revenue.total},100%`);
    lines.push('');

    // Expenses section
    lines.push('EXPENSES');
    lines.push('Category,Amount,Percentage');
    for (const item of data.expenses.breakdown) {
      lines.push(`${item.category},${item.amount},${item.percentage}%`);
    }
    lines.push(`Total Expenses,${data.expenses.total},100%`);
    lines.push('');

    // Profit/Loss
    lines.push('PROFIT/LOSS');
    lines.push(`Amount,${data.profitLoss.amount}`);
    lines.push(`Margin,${data.profitLoss.margin}%`);
    lines.push('');

    // Outstanding Dues
    lines.push('OUTSTANDING DUES');
    lines.push(`Total,${data.outstandingDues.total}`);

    return lines.join('\n');
  }

  /**
   * Generate CSV for sessions report
   */
  private generateSessionsCSV(data: any): string {
    const lines: string[] = [];

    // Header
    lines.push('Sessions Report');
    lines.push('');

    // Summary
    lines.push('SUMMARY');
    lines.push(`Total Sessions,${data.summary.total}`);
    lines.push(`Completed,${data.summary.completed}`);
    lines.push(`Cancelled,${data.summary.cancelled}`);
    lines.push(`Scheduled,${data.summary.scheduled}`);
    lines.push(`Total Revenue,${data.summary.totalRevenue}`);
    lines.push('');

    // Sessions detail
    lines.push('SESSIONS DETAIL');
    lines.push('Date,Patient,Therapist,Therapy Type,Status,Cost');
    for (const session of data.sessions) {
      const date = new Date(session.scheduledDate).toISOString().split('T')[0];
      const patient = `${session.patient.firstName} ${session.patient.lastName}`;
      const therapist = `${session.therapist.firstName} ${session.therapist.lastName}`;
      lines.push(
        `${date},${patient},${therapist},${session.therapyType.name},${session.status},${session.cost}`
      );
    }

    return lines.join('\n');
  }
}

export const reportsController = new ReportsController();
