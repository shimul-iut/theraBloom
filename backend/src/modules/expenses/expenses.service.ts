import prisma from '../../config/database';
import { CreateExpenseInput, UpdateExpenseInput } from './expenses.schema';
import { ExpenseCategory } from '@prisma/client';

export class ExpensesService {
  /**
   * Get expenses with filters and pagination
   */
  async getExpenses(
    tenantId: string,
    filters: {
      category?: ExpenseCategory;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };

    if (filters.category) where.category = filters.category;

    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = new Date(filters.startDate);
      if (filters.endDate) where.date.lte = new Date(filters.endDate);
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          User: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      prisma.expense.count({ where }),
    ]);

    return {
      expenses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get expense by ID
   */
  async getExpenseById(tenantId: string, expenseId: string) {
    const expense = await prisma.expense.findFirst({
      where: {
        id: expenseId,
        tenantId,
      },
      include: {
        User: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!expense) {
      throw new Error('Expense not found');
    }

    return expense;
  }

  /**
   * Create expense
   */
  async createExpense(tenantId: string, userId: string, input: CreateExpenseInput) {
    const expense = await prisma.expense.create({
      data: {
        id: crypto.randomUUID(),
        tenantId,
        category: input.category,
        amount: input.amount,
        date: new Date(input.date),
        description: input.description,
        paymentMethod: input.paymentMethod,
        createdBy: userId,
        updatedAt: new Date(),
      },
      include: {
        User: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return expense;
  }

  /**
   * Update expense
   */
  async updateExpense(
    tenantId: string,
    expenseId: string,
    input: UpdateExpenseInput
  ) {
    // Check if expense exists
    const existingExpense = await prisma.expense.findFirst({
      where: {
        id: expenseId,
        tenantId,
      },
    });

    if (!existingExpense) {
      throw new Error('Expense not found');
    }

    const updateData: any = {};
    if (input.category !== undefined) updateData.category = input.category;
    if (input.amount !== undefined) updateData.amount = input.amount;
    if (input.date !== undefined) updateData.date = new Date(input.date);
    if (input.description !== undefined) updateData.description = input.description;
    if (input.paymentMethod !== undefined) updateData.paymentMethod = input.paymentMethod;

    const expense = await prisma.expense.update({
      where: { id: expenseId },
      data: updateData,
      include: {
        User: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return expense;
  }

  /**
   * Delete expense
   */
  async deleteExpense(tenantId: string, expenseId: string) {
    // Check if expense exists
    const existingExpense = await prisma.expense.findFirst({
      where: {
        id: expenseId,
        tenantId,
      },
    });

    if (!existingExpense) {
      throw new Error('Expense not found');
    }

    await prisma.expense.delete({
      where: { id: expenseId },
    });

    return { message: 'Expense deleted successfully' };
  }

  /**
   * Get expense summary by category
   */
  async getExpenseSummary(
    tenantId: string,
    startDate?: string,
    endDate?: string
  ) {
    const where: any = { tenantId };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    // Get all expenses for the period
    const expenses = await prisma.expense.findMany({
      where,
      select: {
        category: true,
        amount: true,
      },
    });

    // Calculate totals by category
    const summaryMap = new Map<ExpenseCategory, number>();
    let totalAmount = 0;

    for (const expense of expenses) {
      const currentAmount = summaryMap.get(expense.category) || 0;
      summaryMap.set(expense.category, currentAmount + Number(expense.amount));
      totalAmount += Number(expense.amount);
    }

    // Convert to array format
    const summary = Array.from(summaryMap.entries()).map(([category, amount]) => ({
      category,
      amount,
      percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0,
    }));

    return {
      summary,
      totalAmount,
      period: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
    };
  }
}

export const expensesService = new ExpensesService();
