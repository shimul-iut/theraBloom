import { Router } from 'express';
import { therapistDashboardController } from './therapist-dashboard.controller';
import { authenticate } from '../../middleware/auth';
import { requireTherapist } from '../../middleware/rbac';

const router = Router();

// All routes require authentication and therapist role
router.use(authenticate);
router.use(requireTherapist);

/**
 * GET /api/v1/therapist/dashboard
 * Get therapist dashboard overview
 */
router.get('/dashboard', (req, res) => 
  therapistDashboardController.getDashboard(req, res)
);

/**
 * GET /api/v1/therapist/schedule
 * Get therapist schedule with filters
 */
router.get('/schedule', (req, res) => 
  therapistDashboardController.getSchedule(req, res)
);

/**
 * GET /api/v1/therapist/patients
 * Get therapist's patients
 */
router.get('/patients', (req, res) => 
  therapistDashboardController.getPatients(req, res)
);

/**
 * GET /api/v1/therapist/sessions/upcoming
 * Get upcoming sessions
 */
router.get('/sessions/upcoming', (req, res) => 
  therapistDashboardController.getUpcomingSessions(req, res)
);

/**
 * GET /api/v1/therapist/sessions/today
 * Get today's sessions
 */
router.get('/sessions/today', (req, res) => 
  therapistDashboardController.getTodaySessions(req, res)
);

/**
 * PUT /api/v1/therapist/sessions/:id/complete
 * Mark session as complete
 */
router.put('/sessions/:id/complete', (req, res) => 
  therapistDashboardController.completeSession(req, res)
);

/**
 * GET /api/v1/therapist/weekly-overview
 * Get weekly overview
 */
router.get('/weekly-overview', (req, res) => 
  therapistDashboardController.getWeeklyOverview(req, res)
);

export default router;
