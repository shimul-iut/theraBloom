import { Request, Response } from 'express';
import { expensesService } from './expenses.service';
import {
  createExpenseSchema,
  updateExpenseSchema,
} from './expenses.schema';
import { getTenantId, getUserId } from '../../middleware/tenant';
import { logger } from '../../utils/logger';
import { ExpenseCategory } from '@prisma/client';

export class ExpensesController {
  /**
   * GET /api/v1/expenses
   */
  async getExpenses(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const filters = {
        category: req.query.category as ExpenseCategory | undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      };

      const result = await expensesService.getExpenses(tenantId, filters);

      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Get expenses error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_EXPENSES_FAILED',
          message: 'Failed to fetch expenses',
        },
      });
    }
  }

  /**
   * GET /api/v1/expenses/:id
   */
  async getExpenseById(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const expenseId = req.params.id;

      const expense = await expensesService.getExpenseById(tenantId, expenseId);

      return res.json({
        success: true,
        data: expense,
      });
    } catch (error) {
      logger.error('Get expense error:', error);

      if (error instanceof Error && error.message === 'Expense not found') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'EXPENSE_NOT_FOUND',
            message: 'Expense not found',
          },
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_EXPENSE_FAILED',
          message: 'Failed to fetch expense',
        },
      });
    }
  }

  /**
   * POST /api/v1/expenses
   */
  async createExpense(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const userId = getUserId(req);
      const input = createExpenseSchema.parse(req.body);

      const expense = await expensesService.createExpense(tenantId, userId, input);

      logger.info(`Expense created: ${expense.id} by ${req.user?.phoneNumber}`);

      return res.status(201).json({
        success: true,
        data: expense,
      });
    } catch (error) {
      logger.error('Create expense error:', error);

      return res.status(500).json({
        success: false,
        error: {
          code: 'CREATE_EXPENSE_FAILED',
          message: 'Failed to create expense',
        },
      });
    }
  }

  /**
   * PUT /api/v1/expenses/:id
   */
  async updateExpense(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const expenseId = req.params.id;
      const input = updateExpenseSchema.parse(req.body);

      const expense = await expensesService.updateExpense(tenantId, expenseId, input);

      logger.info(`Expense updated: ${expenseId} by ${req.user?.phoneNumber}`);

      return res.json({
        success: true,
        data: expense,
      });
    } catch (error) {
      logger.error('Update expense error:', error);

      if (error instanceof Error && error.message === 'Expense not found') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'EXPENSE_NOT_FOUND',
            message: 'Expense not found',
          },
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'UPDATE_EXPENSE_FAILED',
          message: 'Failed to update expense',
        },
      });
    }
  }

  /**
   * DELETE /api/v1/expenses/:id
   */
  async deleteExpense(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const expenseId = req.params.id;

      const result = await expensesService.deleteExpense(tenantId, expenseId);

      logger.info(`Expense deleted: ${expenseId} by ${req.user?.phoneNumber}`);

      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Delete expense error:', error);

      if (error instanceof Error && error.message === 'Expense not found') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'EXPENSE_NOT_FOUND',
            message: 'Expense not found',
          },
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'DELETE_EXPENSE_FAILED',
          message: 'Failed to delete expense',
        },
      });
    }
  }

  /**
   * GET /api/v1/expenses/summary
   */
  async getExpenseSummary(req: Request, res: Response) {
    try {
      const tenantId = getTenantId(req);
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      const summary = await expensesService.getExpenseSummary(tenantId, startDate, endDate);

      return res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      logger.error('Get expense summary error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_SUMMARY_FAILED',
          message: 'Failed to fetch expense summary',
        },
      });
    }
  }
}

export const expensesController = new ExpensesController();
