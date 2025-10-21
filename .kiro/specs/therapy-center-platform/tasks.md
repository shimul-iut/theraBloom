# Implementation Plan

This implementation plan breaks down the therapy center management platform into discrete, manageable coding tasks. Each task builds incrementally on previous work, following test-driven development principles where appropriate. Tasks are organized to deliver core functionality first, with optional testing sub-tasks marked with "*".

## Task List

- [x] 1. Project Setup and Infrastructure



  - Initialize Next.js 14+ project with TypeScript and App Router
  - Configure TailwindCSS and shadcn/ui with theme customization
  - Set up ESLint, Prettier, and Git hooks
  - Create Docker and docker-compose configuration for development
  - Configure environment variables and validation
  - _Requirements: 15.5_

- [x] 2. Backend Foundation and Database Setup



  - Initialize Node.js/Express backend with TypeScript
  - Configure Prisma ORM with PostgreSQL connection
  - Create complete Prisma schema with all models (Tenant, User, Patient, Session, Payment, SessionPayment, ProgressReport, RescheduleRequest, Notification, etc.)
  - Set up database migrations and seed data
  - Configure Redis client for caching
  - _Requirements: 9.1, 9.2, 9.3_

- [x] 3. Authentication and Authorization System



  - [x] 3.1 Implement JWT token generation and verification utilities


    - Create JWT service with access and refresh token generation
    - Implement bcrypt password hashing utilities
    - _Requirements: 1.5, 10.1_
  
  - [x] 3.2 Create authentication middleware


    - Build JWT verification middleware
    - Implement tenant context extraction from JWT
    - Create role-based access control (RBAC) middleware
    - _Requirements: 1.4, 10.5_
  
  - [x] 3.3 Build authentication API endpoints


    - POST /api/v1/auth/login - User login with email/password
    - POST /api/v1/auth/refresh - Refresh access token
    - POST /api/v1/auth/logout - User logout
    - _Requirements: 1.5_
  
  - [ ]* 3.4 Write authentication tests
    - Test JWT generation and verification
    - Test login flow with valid/invalid credentials
    - Test token refresh mechanism
    - Test RBAC middleware with different roles
    - _Requirements: 1.5, 10.5_

- [x] 4. Multi-Tenant Isolation Implementation



  - [x] 4.1 Create Prisma middleware for automatic tenant filtering


    - Implement middleware to inject tenantId in all queries
    - Add tenant validation for create operations
    - _Requirements: 9.4, 9.5_
  
  - [x] 4.2 Implement tenant context management


    - Create tenant context provider
    - Build tenant extraction utilities from request
    - _Requirements: 9.3_
  
  - [ ]* 4.3 Write multi-tenant isolation tests
    - Test tenant data isolation across queries
    - Test cross-tenant access prevention
    - _Requirements: 9.4_






- [ ] 5. User Management Module
  - [x] 5.1 Create user service layer

    - Implement CRUD operations for users
    - Add user activation/deactivation logic


    - Build user role management
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [x] 5.2 Build user API endpoints

    - GET /api/v1/users - List users (admin only)
    - POST /api/v1/users - Create user (admin only)

    - GET /api/v1/users/:id - Get user details
    - PUT /api/v1/users/:id - Update user
    - DELETE /api/v1/users/:id - Deactivate user
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [x] 5.3 Create Zod validation schemas for user operations


    - Define user creation schema
    - Define user update schema






    - _Requirements: 1.1_
  
  - [ ]* 5.4 Write user management tests
    - Test user CRUD operations

    - Test role-based access control
    - Test user deactivation
    - _Requirements: 1.1, 1.2, 1.3_

- [ ] 6. Patient Management Module
  - [x] 6.1 Create patient service layer

    - Implement patient CRUD operations
    - Add patient search and filtering
    - Build credit balance management

    - Implement outstanding dues tracking
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [x] 6.2 Build patient API endpoints

    - GET /api/v1/patients - List patients with pagination and search
    - POST /api/v1/patients - Create patient
    - GET /api/v1/patients/:id - Get patient details
    - PUT /api/v1/patients/:id - Update patient
    - GET /api/v1/patients/:id/sessions - Get patient session history
    - GET /api/v1/patients/:id/payments - Get patient payment history
    - GET /api/v1/patients/:id/outstanding-dues - Get outstanding dues
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [x] 6.3 Create Zod validation schemas for patient operations

    - Define patient creation schema with guardian details
    - Define patient update schema
    - _Requirements: 4.1_
  
  - [ ]* 6.4 Write patient management tests
    - Test patient CRUD operations
    - Test patient search functionality
    - Test credit balance calculations
    - _Requirements: 4.1, 4.2, 4.3_

- [ ] 7. Therapy Types, Therapist Availability, and Pricing
  - [x] 7.1 Create therapy type service layer


    - Implement therapy type CRUD operations
    - Add validation to prevent deletion of types with active sessions
    - Include default duration and cost fields
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [x] 7.2 Build therapy type API endpoints


    - GET /api/v1/therapy-types - List therapy types
    - POST /api/v1/therapy-types - Create therapy type with defaults
    - PUT /api/v1/therapy-types/:id - Update therapy type
    - DELETE /api/v1/therapy-types/:id - Delete therapy type
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [x] 7.3 Create therapist availability service layer


    - Implement availability CRUD operations
    - Add time slot overlap validation
    - Build availability query by therapist and day
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [x] 7.4 Build therapist availability API endpoints


    - GET /api/v1/therapists/:id/availability - Get therapist availability
    - POST /api/v1/therapists/:id/availability - Set availability
    - PUT /api/v1/therapists/:id/availability/:slotId - Update slot
    - DELETE /api/v1/therapists/:id/availability/:slotId - Remove slot
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [x] 7.5 Create therapist pricing service layer


    - Implement therapist-specific pricing CRUD operations
    - Add pricing lookup with fallback to therapy type defaults
    - Build pricing validation (duration > 0, cost >= 0)
    - _Requirements: 3.6, 3.7, 3.9_
  
  - [x] 7.6 Build therapist pricing API endpoints


    - GET /api/v1/therapists/:id/pricing - Get all therapist pricing
    - POST /api/v1/therapists/:id/pricing - Set pricing for therapy type
    - PUT /api/v1/therapists/:id/pricing/:pricingId - Update pricing
    - DELETE /api/v1/therapists/:id/pricing/:pricingId - Remove pricing
    - GET /api/v1/therapists/:id/pricing/:therapyTypeId - Get specific pricing
    - _Requirements: 3.6, 3.8_
  
  - [x] 7.7 Create Zod validation schemas for pricing


    - Define therapist pricing creation schema
    - Define therapist pricing update schema
    - _Requirements: 3.6_
  
  - [ ]* 7.8 Write therapy, availability, and pricing tests
    - Test therapy type CRUD operations
    - Test availability slot validation
    - Test overlap detection
    - Test pricing CRUD operations
    - Test pricing fallback logic
    - _Requirements: 2.1, 3.1, 3.4, 3.6, 3.7, 3.9_

- [ ] 8. Session Management Module


  - [x] 8.1 Create session service layer


    - Implement session creation with availability validation
    - Add pricing lookup (therapist-specific or therapy type default)
    - Calculate session cost and duration based on pricing
    - Add session rescheduling logic
    - Build session cancellation with credit refund
    - Implement session status management
    - _Requirements: 3.7, 3.9, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_


  
  - [x] 8.2 Build session API endpoints

    - GET /api/v1/sessions - List sessions with filters
    - POST /api/v1/sessions - Create session
    - GET /api/v1/sessions/:id - Get session details
    - PUT /api/v1/sessions/:id - Update/reschedule session
    - POST /api/v1/sessions/:id/cancel - Cancel session



    - GET /api/v1/sessions/calendar - Get calendar view data
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.7_
  
  - [x] 8.3 Implement session payment tracking


    - Create SessionPayment model operations
    - Add partial payment recording
    - Build due amount calculation


    - Update patient outstanding dues on payment
    - _Requirements: 6.8, 6.9, 6.11_
  

  - [x] 8.4 Build session payment API endpoints

    - GET /api/v1/sessions/:id/payments - Get session payments
    - POST /api/v1/sessions/:id/payments - Record partial payment
    - _Requirements: 6.8, 6.9_
  


  - [x] 8.5 Create Zod validation schemas for sessions


    - Define session creation schema
    - Define session update schema
    - Define payment recording schema
    - _Requirements: 5.1, 6.8_
  
  - [ ]* 8.6 Write session management tests
    - Test session creation with availability check
    - Test session rescheduling
    - Test session cancellation with refund
    - Test partial payment recording
    - _Requirements: 5.1, 5.2, 5.4, 5.5, 6.8_

- [ ] 9. Payment and Credit Management
  - [x] 9.1 Create payment service layer


    - Implement payment recording
    - Add credit balance updates
    - Build payment transaction history
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_
  
  - [x] 9.2 Build payment API endpoints


    - GET /api/v1/payments - List payments
    - POST /api/v1/payments - Record payment
    - GET /api/v1/payments/:id - Get payment details
    - GET /api/v1/patients/:id/credits - Get credit balance
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.7_
  
  - [x] 9.3 Create Zod validation schemas for payments


    - Define payment recording schema
    - Define credit purchase schema
    - _Requirements: 6.1, 6.2_
  
  - [ ]* 9.4 Write payment management tests
    - Test payment recording
    - Test credit balance updates
    - Test transaction history
    - _Requirements: 6.1, 6.2, 6.4, 6.7_

- [ ] 10. Progress Reports Module
  - [x] 10.1 Create progress report service layer


    - Implement progress report CRUD operations
    - Add report filtering by patient, therapist, date
    - Build report history retrieval
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_



  
  - [ ] 10.2 Build progress report API endpoints
    - GET /api/v1/progress-reports - List progress reports
    - POST /api/v1/progress-reports - Create progress report
    - GET /api/v1/progress-reports/:id - Get report details
    - PUT /api/v1/progress-reports/:id - Update progress report
    - GET /api/v1/patients/:id/progress-reports - Get patient reports


    - GET /api/v1/progress-reports/:id/export - Export as PDF
    - _Requirements: 12.1, 12.2, 12.3, 12.5, 12.7_
  
  - [ ] 10.3 Create Zod validation schemas for progress reports
    - Define progress report creation schema
    - Define progress report update schema
    - _Requirements: 12.1, 12.2_
  
  - [x]* 10.4 Write progress report tests



    - Test progress report CRUD operations
    - Test filtering and history retrieval
    - _Requirements: 12.1, 12.3, 12.5_




- [ ] 11. Reschedule Request Module
  - [ ] 11.1 Create reschedule request service layer
    - Implement reschedule request creation with 48-hour validation
    - Add request approval/rejection logic
    - Build automatic session rescheduling on approval


    - _Requirements: 13.4, 13.5, 13.6_
  
  - [ ] 11.2 Build reschedule request API endpoints
    - GET /api/v1/reschedule-requests - List requests
    - POST /api/v1/reschedule-requests - Create request (48hr check)
    - GET /api/v1/reschedule-requests/:id - Get request details
    - PUT /api/v1/reschedule-requests/:id/approve - Approve request
    - PUT /api/v1/reschedule-requests/:id/reject - Reject request
    - DELETE /api/v1/reschedule-requests/:id - Cancel request
    - _Requirements: 13.4, 13.5, 13.6_
  
  - [ ] 11.3 Create Zod validation schemas for reschedule requests
    - Define reschedule request creation schema
    - Define approval/rejection schema
    - _Requirements: 13.4, 13.5_
  
  - [ ]* 11.4 Write reschedule request tests
    - Test 48-hour validation
    - Test approval workflow
    - Test automatic session rescheduling
    - _Requirements: 13.4, 13.5, 13.6_

- [ ] 12. Notification System
  - [ ] 12.1 Set up SMS provider integration
    - Configure Twilio client
    - Create SMS provider interface
    - Implement SMS sending functionality
    - _Requirements: 14.2, 14.3_
  
  - [ ] 12.2 Create notification service layer
    - Implement notification creation and logging
    - Add notification status tracking
    - Build retry logic for failed notifications
    - _Requirements: 14.4, 14.5, 14.6_
  
  - [ ] 12.3 Build notification API endpoints
    - GET /api/v1/notifications - List notifications
    - POST /api/v1/notifications/send - Send manual notification
    - GET /api/v1/notifications/:id - Get notification details
    - GET /api/v1/patients/:id/notifications - Get patient notifications
    - POST /api/v1/notifications/test - Test configuration
    - _Requirements: 14.4, 14.5_
  
  - [ ] 12.4 Implement scheduled payment reminder job
    - Create cron job to run on 15th of each month
    - Query patients with outstanding dues
    - Send SMS reminders with due amount
    - Log all sent notifications
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.8_
  
  - [x] 12.5 Implement notification retry job


    - Create hourly cron job for failed notifications
    - Retry failed notifications up to 3 times
    - Update notification status and retry count
    - _Requirements: 14.6_


  
  - [ ]* 12.6 Write notification system tests
    - Test SMS sending
    - Test notification logging
    - Test retry logic
    - Test payment reminder job


    - _Requirements: 14.2, 14.4, 14.6_

- [ ] 13. Expense Management Module
  - [ ] 13.1 Create expense service layer
    - Implement expense CRUD operations
    - Add expense filtering by category and date
    - Build expense summary calculations
    - _Requirements: 7.1, 7.2, 7.3_
  


  - [ ] 13.2 Build expense API endpoints
    - GET /api/v1/expenses - List expenses
    - POST /api/v1/expenses - Create expense
    - GET /api/v1/expenses/:id - Get expense details


    - PUT /api/v1/expenses/:id - Update expense
    - DELETE /api/v1/expenses/:id - Delete expense
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [x] 13.3 Create Zod validation schemas for expenses

    - Define expense creation schema
    - Define expense update schema
    - _Requirements: 7.1_
  
  - [ ]* 13.4 Write expense management tests
    - Test expense CRUD operations
    - Test expense filtering
    - _Requirements: 7.1, 7.2, 7.3_

- [ ] 14. Reporting and Dashboard Module
  - [x] 14.1 Create dashboard service layer

    - Implement KPI calculations (sessions, revenue, utilization)
    - Build financial summary calculations
    - Add trend analysis for charts
    - _Requirements: 8.1, 8.2, 8.5_
  

  - [ ] 14.2 Build reporting API endpoints
    - GET /api/v1/reports/dashboard - Get dashboard KPIs
    - GET /api/v1/reports/financial - Get financial summary
    - GET /api/v1/reports/sessions - Get session reports
    - GET /api/v1/reports/export - Export reports (CSV/PDF)
    - _Requirements: 8.1, 8.2, 8.3, 8.4_


  
  - [ ] 14.3 Implement report export functionality
    - Add CSV export for financial data
    - Add PDF generation for reports
    - _Requirements: 7.6, 8.3_
  
  - [ ]* 14.4 Write reporting tests
    - Test KPI calculations
    - Test financial summaries


    - Test export functionality


    - _Requirements: 8.1, 8.2_

- [ ] 15. Therapist Dashboard Module
  - [ ] 15.1 Create therapist dashboard service layer
    - Implement therapist-specific session queries


    - Build today's schedule retrieval
    - Add weekly overview calculations
    - Build patient list for therapist
    - _Requirements: 13.1, 13.2, 13.3, 13.8, 13.9_
  
  - [ ] 15.2 Build therapist dashboard API endpoints
    - GET /api/v1/therapist/dashboard - Get dashboard data
    - GET /api/v1/therapist/schedule - Get therapist schedule
    - GET /api/v1/therapist/patients - Get therapist patients
    - GET /api/v1/therapist/sessions/upcoming - Get upcoming sessions


    - GET /api/v1/therapist/sessions/today - Get today's sessions


    - PUT /api/v1/therapist/sessions/:id/complete - Mark complete
    - _Requirements: 13.1, 13.2, 13.3, 13.7, 13.8_
  


  - [ ]* 15.3 Write therapist dashboard tests
    - Test therapist-specific data filtering
    - Test session completion
    - _Requirements: 13.1, 13.7, 13.9_

- [ ] 16. Audit Logging System
  - [x] 16.1 Create audit log service layer


    - Implement audit log creation for all critical actions
    - Add audit log querying and filtering
    - _Requirements: 10.3, 10.4_
  
  - [x] 16.2 Implement audit middleware


    - Create middleware to log create/update/delete operations
    - Capture user, timestamp, and changes
    - _Requirements: 10.3_
  
  - [ ]* 16.3 Write audit logging tests
    - Test audit log creation
    - Test audit log querying
    - _Requirements: 10.3, 10.4_

- [ ] 17. Frontend: Authentication and Layout
  - [ ] 17.1 Set up Next.js authentication
    - Create login page with form
    - Implement JWT token storage (httpOnly cookies)
    - Build authentication context provider
    - Add protected route middleware
    - _Requirements: 1.5_
  
  - [ ] 17.2 Create main dashboard layout
    - Build responsive sidebar with navigation
    - Create header with user menu
    - Implement breadcrumbs component
    - Add role-based navigation items
    - _Requirements: 11.1, 11.2_
  
  - [ ] 17.3 Create therapist-specific layout
    - Build therapist sidebar with relevant navigation
    - Create therapist header
    - _Requirements: 13.1, 13.9_

- [ ] 18. Frontend: shadcn/ui Component Setup
  - [x] 18.1 Install and configure shadcn/ui components


    - Initialize shadcn/ui with default theme
    - Install core components (button, card, dialog, form, input, select, table, etc.)
    - Customize theme colors and typography
    - _Requirements: 11.4_
  
  - [x] 18.2 Create reusable data table component


    - Build TanStack Table wrapper with shadcn/ui styling
    - Add pagination, sorting, and filtering
    - Implement column visibility toggle
    - _Requirements: 11.2_
  

  - [x] 18.3 Create shared UI components


    - Build stats card component
    - Create loading spinner component
    - Build empty state component
    - Create error boundary component
    - _Requirements: 11.5_

- [x] 19. Frontend: Patient Management

  - [x] 19.1 Create patient list page


    - Build patient data table with search and filters
    - Add pagination and sorting
    - Implement quick actions (view, edit)
    - _Requirements: 4.5_

  
  - [x] 19.2 Create patient detail page

    - Display patient information
    - Show session history
    - Display payment history and outstanding dues
    - Show progress reports timeline

    - _Requirements: 4.2, 4.3_
  

  - [ ] 19.3 Create patient form
    - Build patient creation form with validation
    - Implement patient edit form


    - Add guardian information fields
    - _Requirements: 4.1, 4.2_

  
  - [ ] 19.4 Implement React Query hooks for patients
    - Create usePatients hook
    - Create usePatient hook
    - Create useCreatePatient mutation




    - Create useUpdatePatient mutation
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 20. Frontend: Schedule and Calendar




  - [x] 20.1 Create schedule calendar page

    - Integrate React Big Calendar
    - Display sessions on calendar
    - Implement month/week/day views
    - Add session click to view details
    - _Requirements: 5.7, 11.2_
  
  - [x] 20.2 Create session creation dialog

    - Build session form with patient/therapist selection
    - Add therapy type and time slot selection
    - Display calculated cost based on therapist pricing
    - Implement availability validation
    - _Requirements: 3.7, 5.1, 5.2_
  
  - [x] 20.3 Create session detail modal


    - Display session information
    - Show payment status
    - Add reschedule and cancel actions
    - _Requirements: 5.3, 5.4, 5.5_


  
  - [x] 20.4 Implement React Query hooks for sessions


    - Create useSessions hook
    - Create useSession hook
    - Create useCreateSession mutation
    - Create useUpdateSession mutation
    - Create useCancelSession mutation
    - _Requirements: 5.1, 5.2, 5.4, 5.5_

- [ ] 21. Frontend: Payment Management
  - [ ] 21.1 Create payment list page
    - Build payment data table
    - Add filtering by date and patient
    - Display payment method and amount
    - _Requirements: 6.7_
  
  - [ ] 21.2 Create payment recording dialog
    - Build payment form with patient selection
    - Add amount and payment method fields
    - Implement credit balance update
    - _Requirements: 6.1, 6.2_
  
  - [ ] 21.3 Create partial payment dialog
    - Build session payment form
    - Add partial payment amount field
    - Display remaining due amount
    - _Requirements: 6.8, 6.9_
  
  - [ ] 21.4 Implement React Query hooks for payments
    - Create usePayments hook
    - Create useCreatePayment mutation
    - Create useSessionPayments hook
    - _Requirements: 6.1, 6.7_

- [ ] 22. Frontend: Progress Reports
  - [ ] 22.1 Create progress reports list page
    - Build progress reports data table
    - Add filtering by patient and therapist
    - Display report date and preview
    - _Requirements: 12.3, 12.5_
  
  - [ ] 22.2 Create progress report form
    - Build report creation form with rich text editor
    - Add session and patient selection
    - Implement report notes field
    - _Requirements: 12.1, 12.2_
  
  - [ ] 22.3 Create progress report detail page
    - Display full report content
    - Show associated session and patient
    - Add edit and export actions
    - _Requirements: 12.3, 12.7_
  
  - [ ] 22.4 Implement React Query hooks for progress reports
    - Create useProgressReports hook
    - Create useProgressReport hook
    - Create useCreateProgressReport mutation
    - Create useUpdateProgressReport mutation
    - _Requirements: 12.1, 12.2, 12.3_

- [ ] 23. Frontend: Therapist Dashboard
  - [ ] 23.1 Create therapist dashboard page
    - Build today's schedule widget
    - Create weekly overview calendar
    - Display patient list
    - Show pending actions section
    - _Requirements: 13.1, 13.2, 13.3, 13.6_
  
  - [ ] 23.2 Create session completion dialog
    - Build session completion form
    - Add progress notes field
    - Implement status update
    - _Requirements: 13.7_
  
  - [ ] 23.3 Create reschedule request dialog
    - Build reschedule request form with 48-hour validation
    - Add reason field
    - Display validation messages
    - _Requirements: 13.4, 13.5, 13.6_
  
  - [ ] 23.4 Implement React Query hooks for therapist dashboard
    - Create useTherapistDashboard hook
    - Create useTherapistSchedule hook
    - Create useCompleteSession mutation
    - Create useCreateRescheduleRequest mutation
    - _Requirements: 13.1, 13.2, 13.7_

- [ ] 24. Frontend: Admin Dashboard and Reports
  - [ ] 24.1 Create admin dashboard page
    - Build KPI stats cards (sessions, revenue, utilization)
    - Create revenue chart with Recharts
    - Display recent sessions table
    - Show outstanding dues summary
    - _Requirements: 8.1, 8.5_
  
  - [ ] 24.2 Create financial dashboard page
    - Build profit/loss summary cards
    - Create expense breakdown chart
    - Display revenue trends chart
    - Add date range selector
    - _Requirements: 8.2, 8.5_
  
  - [ ] 24.3 Create report export functionality
    - Implement CSV export for financial data
    - Add PDF export for reports
    - _Requirements: 8.3_
  
  - [ ] 24.4 Implement React Query hooks for reports
    - Create useDashboardKPIs hook
    - Create useFinancialSummary hook
    - Create useExportReport mutation
    - _Requirements: 8.1, 8.2, 8.3_

- [ ] 25. Frontend: Therapist Configuration
  - [ ] 25.1 Create therapist pricing management page
    - Build therapist pricing data table
    - Display pricing for each therapy type
    - Show fallback to default pricing
    - Add edit and delete actions
    - _Requirements: 3.6, 3.8, 3.9_
  
  - [ ] 25.2 Create therapist pricing dialog
    - Build pricing form with therapy type selection
    - Add session duration and cost fields
    - Implement validation
    - _Requirements: 3.6_
  
  - [ ] 25.3 Implement React Query hooks for therapist pricing
    - Create useTherapistPricing hook
    - Create useCreateTherapistPricing mutation
    - Create useUpdateTherapistPricing mutation
    - Create useDeleteTherapistPricing mutation
    - _Requirements: 3.6, 3.8_

- [ ] 26. Frontend: Notifications and Settings
  - [ ] 26.1 Create notifications log page
    - Build notifications data table
    - Display notification status and type
    - Add filtering by patient and date
    - _Requirements: 14.4, 14.5_
  
  - [ ] 26.2 Create notification settings page
    - Build notification configuration form
    - Add SMS provider settings
    - Implement payment reminder day setting
    - _Requirements: 14.7_
  
  - [ ] 26.3 Implement React Query hooks for notifications
    - Create useNotifications hook
    - Create useSendNotification mutation
    - _Requirements: 14.4, 14.5_

- [ ] 27. Error Handling and Loading States
  - [ ] 27.1 Implement global error handling
    - Create error boundary components
    - Add toast notifications for errors
    - Implement API error interceptors
    - _Requirements: 11.5_
  
  - [ ] 27.2 Add loading states throughout application
    - Implement skeleton loaders for tables
    - Add loading spinners for forms
    - Create suspense boundaries for async components
    - _Requirements: 11.5_

- [ ] 28. Performance Optimization
  - [ ] 28.1 Implement caching strategies
    - Configure Redis caching for frequently accessed data
    - Set up React Query cache configuration
    - Add cache invalidation logic
    - _Requirements: 15.3_
  
  - [ ] 28.2 Optimize database queries
    - Add database indexes for frequently queried columns
    - Implement pagination for large datasets
    - Use select to limit returned fields
    - _Requirements: 15.1, 15.4_
  
  - [ ] 28.3 Implement API rate limiting
    - Add rate limiting middleware
    - Configure limits per user and tenant
    - _Requirements: 15.1_

- [ ] 29. Deployment and DevOps
  - [ ] 29.1 Create production Docker configuration
    - Build optimized Docker images
    - Configure multi-stage builds
    - Set up docker-compose for production
    - _Requirements: 15.5_
  
  - [ ] 29.2 Set up environment configuration
    - Create environment variable templates
    - Document all required environment variables
    - Implement environment validation
    - _Requirements: 15.5_
  
  - [ ] 29.3 Configure logging and monitoring
    - Set up Winston logger with structured logging
    - Add request logging with Morgan
    - Implement error tracking
    - _Requirements: 15.5_

- [ ] 30. Documentation and Final Integration
  - [ ] 30.1 Write API documentation
    - Document all API endpoints
    - Add request/response examples
    - Create Postman collection
    - _Requirements: All_
  
  - [ ] 30.2 Create user documentation
    - Write user guide for each role
    - Document common workflows
    - Create troubleshooting guide
    - _Requirements: All_
  
  - [ ] 30.3 Perform end-to-end integration testing
    - Test complete user workflows
    - Verify multi-tenant isolation
    - Test notification system
    - Validate payment and credit flows
    - Test therapist pricing and session cost calculation
    - _Requirements: All_
