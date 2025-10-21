import { Router } from 'express';
import { expensesController } from './expenses.controller';
import { authenticate } from '../../middleware/auth';
import { requireAdminOrOperator } from '../../middleware/rbac';

const router = Router();

// All routes require authentication and admin/operator role
router.use(authenticate);
router.use(requireAdminOrOperator);

/**
 * GET /api/v1/expenses/summary
 * Get expense summary by category
 */
router.get('/summary', (req, res) => expensesController.getExpenseSummary(req, res));

/**
 * GET /api/v1/expenses
 * List expenses with filters
 */
router.get('/', (req, res) => expensesController.getExpenses(req, res));

/**
 * GET /api/v1/expenses/:id
 * Get expense by ID
 */
router.get('/:id', (req, res) => expensesController.getExpenseById(req, res));

/**
 * POST /api/v1/expenses
 * Create expense
 */
router.post('/', (req, res) => expensesController.createExpense(req, res));

/**
 * PUT /api/v1/expenses/:id
 * Update expense
 */
router.put('/:id', (req, res) => expensesController.updateExpense(req, res));

/**
 * DELETE /api/v1/expenses/:id
 * Delete expense
 */
router.delete('/:id', (req, res) => expensesController.deleteExpense(req, res));

export default router;
