import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import env from './config/env';
import { logger, morganStream } from './utils/logger';
import prisma from './config/database';
import redis from './config/redis';
import { setupTenantMiddleware } from './middleware/prisma-tenant';
import { setTenantContextMiddleware } from './middleware/tenant';

const app = express();

// Initialize Prisma tenant middleware
setupTenantMiddleware();

// ============================================
// MIDDLEWARE
// ============================================

// Security
app.use(helmet());

// CORS
app.use(
  cors({
    origin: process.env.NODE_ENV === 'production'
      ? process.env.FRONTEND_URL || 'http://localhost:3001'
      : 'http://localhost:3001',
    credentials: true,
  })
);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP logging
app.use(morgan('combined', { stream: morganStream }));

// Tenant context middleware (sets tenant context from authenticated user)
app.use(setTenantContextMiddleware);

// Audit context middleware (captures IP and user agent for audit logging)
import { auditMiddleware } from './middleware/audit.middleware';
app.use(auditMiddleware);

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', async (_req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    // Check Redis connection
    await redis.ping();

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        redis: 'connected',
      },
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================
// API ROUTES
// ============================================

app.get('/api/v1', (_req, res) => {
  res.json({
    message: 'Therapy Center Platform API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api/v1',
    },
  });
});

// Module routes
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import patientsRoutes from './modules/patients/patients.routes';
import therapyTypesRoutes from './modules/therapy-types/therapy-types.routes';
import therapistAvailabilityRoutes from './modules/therapist-availability/therapist-availability.routes';
import therapistUnavailabilityRoutes from './modules/therapist-unavailability/therapist-unavailability.routes';
import therapistPricingRoutes from './modules/therapist-pricing/therapist-pricing.routes';
import sessionsRoutes from './modules/sessions/sessions.routes';
import paymentsRoutes from './modules/payments/payments.routes';
import invoicesRoutes from './modules/invoices/invoices.routes';
import progressReportsRoutes from './modules/progress-reports/progress-reports.routes';
import rescheduleRequestsRoutes from './modules/reschedule-requests/reschedule-requests.routes';
import expensesRoutes from './modules/expenses/expenses.routes';
import reportsRoutes from './modules/reports/reports.routes';
import therapistDashboardRoutes from './modules/therapist-dashboard/therapist-dashboard.routes';
import auditLogsRoutes from './modules/audit-logs/audit-logs.routes';

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/patients', patientsRoutes);
app.use('/api/v1/therapy-types', therapyTypesRoutes);
app.use('/api/v1/therapists', therapistAvailabilityRoutes);
app.use('/api/v1/therapists', therapistUnavailabilityRoutes);
app.use('/api/v1/therapists', therapistPricingRoutes);
app.use('/api/v1/sessions', sessionsRoutes);
app.use('/api/v1/payments', paymentsRoutes);
app.use('/api/v1/invoices', invoicesRoutes);
app.use('/api/v1/progress-reports', progressReportsRoutes);
app.use('/api/v1/reschedule-requests', rescheduleRequestsRoutes);
app.use('/api/v1/expenses', expensesRoutes);
app.use('/api/v1/reports', reportsRoutes);
app.use('/api/v1/therapist', therapistDashboardRoutes);
app.use('/api/v1/audit-logs', auditLogsRoutes);

// TODO: Add more module routes here
// etc.

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
      path: req.path,
    },
  });
});

// Global error handler
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : err.message,
      timestamp: new Date().toISOString(),
      path: req.path,
    },
  });
});

// ============================================
// START SERVER
// ============================================

const PORT = parseInt(env.PORT, 10);

app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📝 Environment: ${env.NODE_ENV}`);
  logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
  logger.info(`🔗 API: http://localhost:${PORT}/api/v1`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await prisma.$disconnect();
  await redis.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  await prisma.$disconnect();
  await redis.quit();
  process.exit(0);
});
