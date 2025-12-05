import prisma from '../../config/database';
import { SessionStatus } from '@prisma/client';

export class ReportsService {
  /**
   * Get dashboard KPIs
   */
  async getDashboardKPIs(tenantId: string, startDate?: string, endDate?: string) {
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const where: any = { tenantId };
    if (startDate || endDate) {
      where.scheduledDate = dateFilter;
    }

    // Get session statistics
    const [
      totalSessions,
      completedSessions,
      cancelledSessions,
      scheduledSessions,
      sessions,
    ] = await Promise.all([
      prisma.session.count({ where }),
      prisma.session.count({ where: { ...where, status: 'COMPLETED' } }),
      prisma.session.count({ where: { ...where, status: 'CANCELLED' } }),
      prisma.session.count({ where: { ...where, status: 'SCHEDULED' } }),
      prisma.session.findMany({
        where: { ...where, status: 'COMPLETED' },
        select: { cost: true },
      }),
    ]);

    // Calculate revenue from completed sessions
    const totalRevenue = sessions.reduce((sum, session) => sum + Number(session.cost), 0);

    // Get payment statistics
    const paymentWhere: any = { tenantId };
    if (startDate || endDate) {
      paymentWhere.date = dateFilter;
    }

    const payments = await prisma.payment.findMany({
      where: paymentWhere,
      select: { amount: true },
    });

    const totalPayments = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);

    // Get expense statistics
    const expenseWhere: any = { tenantId };
    if (startDate || endDate) {
      expenseWhere.date = dateFilter;
    }

    const expenses = await prisma.expense.findMany({
      where: expenseWhere,
      select: { amount: true },
    });

    const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

    // Calculate profit/loss
    const profitLoss = totalRevenue - totalExpenses;

    // Get active patients count
    const activePatientsCount = await prisma.patient.count({
      where: { tenantId, active: true },
    });

    // Get active therapists count
    const activeTherapistsCount = await prisma.user.count({
      where: { tenantId, role: 'THERAPIST', active: true },
    });

    // Calculate utilization rate (completed sessions / total sessions)
    const utilizationRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

    // Calculate average session cost
    const avgSessionCost = completedSessions > 0 ? totalRevenue / completedSessions : 0;

    return {
      sessions: {
        total: totalSessions,
        completed: completedSessions,
        cancelled: cancelledSessions,
        scheduled: scheduledSessions,
        utilizationRate: Math.round(utilizationRate * 100) / 100,
      },
      revenue: {
        total: totalRevenue,
        avgPerSession: Math.round(avgSessionCost * 100) / 100,
      },
      payments: {
        total: totalPayments,
      },
      expenses: {
        total: totalExpenses,
      },
      profitLoss: {
        amount: profitLoss,
        percentage: totalRevenue > 0 ? Math.round((profitLoss / totalRevenue) * 10000) / 100 : 0,
      },
      patients: {
        active: activePatientsCount,
      },
      therapists: {
        active: activeTherapistsCount,
      },
      period: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
    };
  }

  /**
   * Get financial summary
   */
  async getFinancialSummary(tenantId: string, startDate?: string, endDate?: string) {
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    // Revenue from completed sessions
    const sessionWhere: any = { tenantId, status: 'COMPLETED' };
    if (startDate || endDate) {
      sessionWhere.scheduledDate = dateFilter;
    }

    const sessions = await prisma.session.findMany({
      where: sessionWhere,
      select: {
        cost: true,
        scheduledDate: true,
        TherapyType: {
          select: { name: true },
        },
      },
    });

    const totalRevenue = sessions.reduce((sum, session) => sum + Number(session.cost), 0);

    // Revenue by therapy type
    const revenueByType = new Map<string, number>();
    for (const session of sessions) {
      const typeName = session.TherapyType.name;
      const current = revenueByType.get(typeName) || 0;
      revenueByType.set(typeName, current + Number(session.cost));
    }

    const revenueBreakdown = Array.from(revenueByType.entries()).map(([type, amount]) => ({
      therapyType: type,
      amount,
      percentage: totalRevenue > 0 ? Math.round((amount / totalRevenue) * 10000) / 100 : 0,
    }));

    // Payments received
    const paymentWhere: any = { tenantId };
    if (startDate || endDate) {
      paymentWhere.date = dateFilter;
    }

    const payments = await prisma.payment.findMany({
      where: paymentWhere,
      select: {
        amount: true,
        method: true,
      },
    });

    const totalPaymentsReceived = payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );

    // Payments by method
    const paymentsByMethod = new Map<string, number>();
    for (const payment of payments) {
      const current = paymentsByMethod.get(payment.method) || 0;
      paymentsByMethod.set(payment.method, current + Number(payment.amount));
    }

    const paymentMethodBreakdown = Array.from(paymentsByMethod.entries()).map(
      ([method, amount]) => ({
        method,
        amount,
        percentage:
          totalPaymentsReceived > 0
            ? Math.round((amount / totalPaymentsReceived) * 10000) / 100
            : 0,
      })
    );

    // Expenses
    const expenseWhere: any = { tenantId };
    if (startDate || endDate) {
      expenseWhere.date = dateFilter;
    }

    const expenses = await prisma.expense.findMany({
      where: expenseWhere,
      select: {
        amount: true,
        category: true,
      },
    });

    const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

    // Expenses by category
    const expensesByCategory = new Map<string, number>();
    for (const expense of expenses) {
      const current = expensesByCategory.get(expense.category) || 0;
      expensesByCategory.set(expense.category, current + Number(expense.amount));
    }

    const expenseBreakdown = Array.from(expensesByCategory.entries()).map(
      ([category, amount]) => ({
        category,
        amount,
        percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 10000) / 100 : 0,
      })
    );

    // Outstanding dues
    const patients = await prisma.patient.findMany({
      where: { tenantId, active: true },
      select: { totalOutstandingDues: true },
    });

    const totalOutstandingDues = patients.reduce(
      (sum, patient) => sum + Number(patient.totalOutstandingDues),
      0
    );

    // Calculate profit/loss
    const profitLoss = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (profitLoss / totalRevenue) * 100 : 0;

    return {
      revenue: {
        total: totalRevenue,
        breakdown: revenueBreakdown,
      },
      payments: {
        total: totalPaymentsReceived,
        breakdown: paymentMethodBreakdown,
      },
      expenses: {
        total: totalExpenses,
        breakdown: expenseBreakdown,
      },
      outstandingDues: {
        total: totalOutstandingDues,
      },
      profitLoss: {
        amount: profitLoss,
        margin: Math.round(profitMargin * 100) / 100,
      },
      period: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
    };
  }

  /**
   * Get session reports
   */
  async getSessionReports(
    tenantId: string,
    filters: {
      therapistId?: string;
      patientId?: string;
      therapyTypeId?: string;
      status?: SessionStatus;
      startDate?: string;
      endDate?: string;
    }
  ) {
    const where: any = { tenantId };

    if (filters.therapistId) where.therapistId = filters.therapistId;
    if (filters.patientId) where.patientId = filters.patientId;
    if (filters.therapyTypeId) where.therapyTypeId = filters.therapyTypeId;
    if (filters.status) where.status = filters.status;

    if (filters.startDate || filters.endDate) {
      where.scheduledDate = {};
      if (filters.startDate) where.scheduledDate.gte = new Date(filters.startDate);
      if (filters.endDate) where.scheduledDate.lte = new Date(filters.endDate);
    }

    const sessions = await prisma.session.findMany({
      where,
      orderBy: { scheduledDate: 'desc' },
      include: {
        Patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        User: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        TherapyType: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Calculate statistics
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter((s) => s.status === 'COMPLETED').length;
    const cancelledSessions = sessions.filter((s) => s.status === 'CANCELLED').length;
    const scheduledSessions = sessions.filter((s) => s.status === 'SCHEDULED').length;

    const totalRevenue = sessions
      .filter((s) => s.status === 'COMPLETED')
      .reduce((sum, session) => sum + Number(session.cost), 0);

    // Sessions by therapist
    const sessionsByTherapist = new Map<string, { name: string; count: number; revenue: number }>();
    for (const session of sessions) {
      const therapistName = `${session.User.firstName} ${session.User.lastName}`;
      const current = sessionsByTherapist.get(session.therapistId) || {
        name: therapistName,
        count: 0,
        revenue: 0,
      };
      current.count++;
      if (session.status === 'COMPLETED') {
        current.revenue += Number(session.cost);
      }
      sessionsByTherapist.set(session.therapistId, current);
    }

    const therapistStats = Array.from(sessionsByTherapist.entries()).map(
      ([therapistId, stats]) => ({
        therapistId,
        therapistName: stats.name,
        sessionCount: stats.count,
        revenue: stats.revenue,
      })
    );

    // Sessions by therapy type
    const sessionsByType = new Map<string, { name: string; count: number; revenue: number }>();
    for (const session of sessions) {
      const typeName = session.TherapyType.name;
      const current = sessionsByType.get(session.therapyTypeId) || {
        name: typeName,
        count: 0,
        revenue: 0,
      };
      current.count++;
      if (session.status === 'COMPLETED') {
        current.revenue += Number(session.cost);
      }
      sessionsByType.set(session.therapyTypeId, current);
    }

    const therapyTypeStats = Array.from(sessionsByType.entries()).map(([typeId, stats]) => ({
      therapyTypeId: typeId,
      therapyTypeName: stats.name,
      sessionCount: stats.count,
      revenue: stats.revenue,
    }));

    return {
      summary: {
        total: totalSessions,
        completed: completedSessions,
        cancelled: cancelledSessions,
        scheduled: scheduledSessions,
        totalRevenue,
      },
      sessions,
      statistics: {
        byTherapist: therapistStats,
        byTherapyType: therapyTypeStats,
      },
      filters,
    };
  }

  /**
   * Get revenue trend data for charts
   */
  async getRevenueTrend(
    tenantId: string,
    startDate: string,
    endDate: string,
    groupBy: 'day' | 'week' | 'month' = 'day'
  ) {
    const sessions = await prisma.session.findMany({
      where: {
        tenantId,
        status: 'COMPLETED',
        scheduledDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      select: {
        scheduledDate: true,
        cost: true,
      },
      orderBy: { scheduledDate: 'asc' },
    });

    // Group by date
    const revenueByDate = new Map<string, number>();

    for (const session of sessions) {
      let dateKey: string;
      const date = new Date(session.scheduledDate);

      if (groupBy === 'day') {
        dateKey = date.toISOString().split('T')[0];
      } else if (groupBy === 'week') {
        // Get week start (Monday)
        const dayOfWeek = date.getDay();
        const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const weekStart = new Date(date.setDate(diff));
        dateKey = weekStart.toISOString().split('T')[0];
      } else {
        // month
        dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      const current = revenueByDate.get(dateKey) || 0;
      revenueByDate.set(dateKey, current + Number(session.cost));
    }

    const trend = Array.from(revenueByDate.entries())
      .map(([date, revenue]) => ({
        date,
        revenue,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      trend,
      groupBy,
      period: {
        startDate,
        endDate,
      },
    };
  }
}

export const reportsService = new ReportsService();
