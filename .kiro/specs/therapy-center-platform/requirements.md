# Requirements Document

## Introduction

This document outlines the requirements for an online scheduling and back-office management platform designed for therapy centers serving special children. The platform is a multi-tenant, role-based system that enables therapy centers to manage users, schedules, patients, payments, and financial operations through a web-based admin panel. Initially, this is a back-office-only solution without a public booking portal.

The system must support multiple therapy centers with complete data isolation, role-based access control for different user types (workspace admins, operators, therapists, accountants), and comprehensive financial management capabilities including session tracking, payment processing, and expense management.

## Requirements

### Requirement 1: User Authentication and Role Management

**User Story:** As a workspace admin, I want to manage user accounts with role-based permissions, so that I can control access to different features based on user responsibilities.

#### Acceptance Criteria

1. WHEN a workspace admin creates a new user THEN the system SHALL require role assignment from the following options: Workspace Admin, Operator, Therapist, or Accountant
2. WHEN a workspace admin edits a user account THEN the system SHALL allow modification of user details and role assignments
3. WHEN a workspace admin deactivates a user THEN the system SHALL prevent that user from logging in while preserving their historical data
4. WHEN a user attempts to access a feature THEN the system SHALL verify their role permissions before granting access
5. WHEN a user logs in THEN the system SHALL issue a JWT token with role and tenant information
6. WHEN a JWT token expires THEN the system SHALL provide a refresh token mechanism for seamless re-authentication

### Requirement 2: Therapy Type and Service Configuration

**User Story:** As a workspace admin, I want to define and manage different therapy types offered by my center, so that I can organize services and assign them to therapists.

#### Acceptance Criteria

1. WHEN a workspace admin creates a therapy type THEN the system SHALL store the therapy name, description, and default duration
2. WHEN a workspace admin views therapy types THEN the system SHALL display all therapy types configured for their tenant
3. WHEN a workspace admin edits a therapy type THEN the system SHALL update the therapy type details without affecting historical session records
4. WHEN a workspace admin attempts to delete a therapy type with active sessions THEN the system SHALL prevent deletion and display a warning message
5. IF a therapy type has no associated sessions THEN the system SHALL allow deletion

### Requirement 3: Therapist Availability and Pricing Management

**User Story:** As an operator or admin, I want to define weekly availability schedules and pricing for each therapist, so that I can allocate patient sessions based on therapist availability and charge appropriate rates.

#### Acceptance Criteria

1. WHEN an admin or operator sets therapist availability THEN the system SHALL allow time slot definition per weekday with start time, end time, and therapy type
2. WHEN viewing therapist availability THEN the system SHALL display a calendar-based view showing all available slots per therapist
3. WHEN an admin or operator edits availability THEN the system SHALL update future availability without affecting already scheduled sessions
4. WHEN creating availability slots THEN the system SHALL validate that time slots do not overlap for the same therapist
5. WHEN a therapist is assigned to a session THEN the system SHALL only show available time slots that match the therapy type and therapist's schedule
6. WHEN an admin configures therapist pricing THEN the system SHALL allow setting session duration and cost per therapy type for each therapist
7. WHEN creating a session THEN the system SHALL use therapist-specific pricing if configured, otherwise use therapy type default pricing
8. WHEN viewing therapist pricing THEN the system SHALL display all configured pricing for each therapy type
9. WHEN a therapist has no specific pricing for a therapy type THEN the system SHALL fall back to the therapy type's default duration and cost

### Requirement 4: Patient Profile Management

**User Story:** As an operator or admin, I want to maintain comprehensive patient profiles, so that I can track patient information, therapy plans, and credit balances.

#### Acceptance Criteria

1. WHEN creating a patient profile THEN the system SHALL require name, age, guardian details, contact information, and initial credit balance
2. WHEN viewing a patient profile THEN the system SHALL display patient details, therapy plan, current credit balance, session history, and payment records
3. WHEN editing a patient profile THEN the system SHALL allow updates to patient information while maintaining an audit log of changes
4. WHEN a patient profile is accessed THEN the system SHALL enforce tenant-based data isolation to prevent cross-tenant data access
5. WHEN searching for patients THEN the system SHALL provide filtering by name, guardian name, or contact information within the current tenant

### Requirement 5: Session Scheduling and Management

**User Story:** As an operator or admin, I want to create, reschedule, and cancel therapy sessions for patients, so that I can manage the therapy center's daily operations efficiently.

#### Acceptance Criteria

1. WHEN creating a session THEN the system SHALL require patient selection, therapist selection, therapy type, date, and time slot
2. WHEN creating a session THEN the system SHALL validate that the selected time slot is available for the chosen therapist
3. WHEN a session is created THEN the system SHALL deduct the session cost from the patient's credit balance if using prepaid credits
4. WHEN rescheduling a session THEN the system SHALL update the session details and create an audit log entry with the reason for change
5. WHEN canceling a session THEN the system SHALL mark the session as canceled, refund credits if applicable, and log the cancellation reason
6. WHEN an operator attempts to delete a session record THEN the system SHALL prevent deletion and only allow cancellation
7. WHEN viewing sessions THEN the system SHALL display sessions in a calendar view with filtering by therapist, patient, date range, and status

### Requirement 6: Payment Processing and Credit Management

**User Story:** As a workspace admin, I want to process patient payments and manage prepaid credits, so that I can track financial transactions and patient balances accurately.

#### Acceptance Criteria

1. WHEN recording a payment THEN the system SHALL support cash payment and prepaid credit options
2. WHEN a workspace admin confirms a payment THEN the system SHALL update the patient's credit balance and create a payment transaction record
3. WHEN a payment is recorded THEN the system SHALL store payment date, amount, payment method, and the admin who confirmed it
4. WHEN viewing patient credits THEN the system SHALL display current balance, total credits purchased, and total credits used
5. WHEN a session is booked using credits THEN the system SHALL automatically deduct the session cost from the patient's credit balance
6. WHEN a session is canceled THEN the system SHALL refund credits to the patient's balance if the session was paid with credits
7. WHEN viewing transaction history THEN the system SHALL display all payment and credit transactions for a patient with date, amount, and type
8. WHEN a session is booked with partial cash payment THEN the system SHALL record the partial payment amount and calculate the outstanding due amount
9. WHEN a patient has outstanding dues THEN the system SHALL track the due amount and due date for each session
10. WHEN the 15th of the month arrives AND a patient has outstanding dues THEN the system SHALL automatically send an SMS notification to the patient's guardian
11. WHEN viewing patient financial details THEN the system SHALL display total outstanding dues across all sessions

### Requirement 7: Expense and Financial Management

**User Story:** As a workspace admin or accountant, I want to record and categorize non-therapy expenses, so that I can track all operational costs and calculate profitability.

#### Acceptance Criteria

1. WHEN recording an expense THEN the system SHALL require expense category, amount, date, description, and payment method
2. WHEN creating expense categories THEN the system SHALL support categories including rent, salaries, maintenance, utilities, and custom categories
3. WHEN viewing expenses THEN the system SHALL display expenses filtered by date range, category, and tenant
4. WHEN calculating profit THEN the system SHALL compute total revenue from sessions minus total expenses for a specified period
5. WHEN viewing cash-in-hand THEN the system SHALL calculate total cash payments received minus cash expenses paid
6. WHEN generating financial summaries THEN the system SHALL provide monthly and quarterly reports with revenue, expenses, and profit/loss

### Requirement 8: Dashboard and Reporting

**User Story:** As a workspace admin, I want to view comprehensive dashboards with key performance indicators, so that I can monitor the therapy center's performance and make informed decisions.

#### Acceptance Criteria

1. WHEN accessing the admin dashboard THEN the system SHALL display KPIs including total sessions, therapist utilization rate, total revenue, and outstanding patient credits
2. WHEN viewing the financial dashboard THEN the system SHALL display profit/loss summaries, expense breakdowns by category, and revenue trends over time
3. WHEN generating reports THEN the system SHALL allow export to CSV and PDF formats
4. WHEN a user accesses dashboards THEN the system SHALL enforce role-based visibility to show only authorized data
5. WHEN viewing trends THEN the system SHALL provide visual charts for revenue, expenses, and session counts over time
6. WHEN filtering dashboard data THEN the system SHALL support date range selection and comparison between periods

### Requirement 9: Multi-Tenant Architecture and Data Isolation

**User Story:** As a platform administrator, I want to support multiple therapy centers on the same platform with complete data isolation, so that each center's data remains private and secure.

#### Acceptance Criteria

1. WHEN a new therapy center is onboarded THEN the system SHALL create a unique tenant identifier and associate all data with that tenant
2. WHEN any database query is executed THEN the system SHALL automatically filter results by the current user's tenant_id
3. WHEN a user logs in THEN the system SHALL include tenant information in the JWT token
4. WHEN accessing any resource THEN the system SHALL validate that the resource belongs to the user's tenant before allowing access
5. WHEN creating any record THEN the system SHALL automatically associate it with the current user's tenant
6. IF a user attempts to access data from another tenant THEN the system SHALL deny access and return an authorization error

### Requirement 10: Security and Audit Logging

**User Story:** As a workspace admin, I want comprehensive security measures and audit logs, so that I can ensure data protection and track important system actions.

#### Acceptance Criteria

1. WHEN a user registers or updates their password THEN the system SHALL hash passwords using bcrypt or Argon2
2. WHEN user input is received THEN the system SHALL sanitize and validate all inputs to prevent injection attacks
3. WHEN a critical action occurs (create, edit, delete, cancel) THEN the system SHALL create an audit log entry with user, timestamp, action type, and affected resource
4. WHEN viewing audit logs THEN the system SHALL display logs filtered by date range, user, and action type
5. WHEN API requests are made THEN the system SHALL validate JWT tokens and enforce role-based access control middleware
6. WHEN authentication fails THEN the system SHALL implement rate limiting to prevent brute force attacks

### Requirement 11: User Interface and Accessibility

**User Story:** As any system user, I want a modern, responsive, and accessible admin panel, so that I can efficiently perform my tasks on any device.

#### Acceptance Criteria

1. WHEN accessing the admin panel THEN the system SHALL display a responsive layout that works on desktop, tablet, and mobile devices
2. WHEN viewing schedules THEN the system SHALL provide a calendar-based interface for easy visualization of therapist availability and patient sessions
3. WHEN performing CRUD operations THEN the system SHALL use modal forms and inline editing for efficient data management
4. WHEN navigating the interface THEN the system SHALL comply with WCAG 2.1 Level AA accessibility standards
5. WHEN loading data THEN the system SHALL display loading indicators and handle errors gracefully with user-friendly messages
6. WHEN using forms THEN the system SHALL provide real-time validation feedback and clear error messages

### Requirement 12: Patient Progress Tracking and Reports

**User Story:** As a therapist, I want to record and view patient progress reports after each session, so that I can track treatment effectiveness and share updates with guardians.

#### Acceptance Criteria

1. WHEN a therapist completes a session THEN the system SHALL allow recording a progress report with textual notes
2. WHEN creating a progress report THEN the system SHALL require session reference, report date, and progress notes
3. WHEN viewing a patient profile THEN the system SHALL display all progress reports in chronological order
4. WHEN a progress report is created THEN the system SHALL associate it with the therapist who created it and the specific session
5. WHEN viewing progress reports THEN the system SHALL allow filtering by date range and therapist
6. WHEN a therapist views their dashboard THEN the system SHALL display patients requiring progress report updates
7. WHEN guardians need updates THEN the system SHALL allow exporting progress reports as PDF for sharing

### Requirement 13: Therapist Dashboard and Schedule Management

**User Story:** As a therapist, I want a dedicated dashboard to view my schedule and manage my sessions, so that I can efficiently organize my work and request necessary changes.

#### Acceptance Criteria

1. WHEN a therapist logs in THEN the system SHALL display a personalized dashboard showing their upcoming sessions
2. WHEN viewing the therapist dashboard THEN the system SHALL display today's schedule, weekly overview, and patient list
3. WHEN a therapist views their schedule THEN the system SHALL show session details including patient name, therapy type, time, and status
4. WHEN a therapist needs to change a schedule THEN the system SHALL allow submitting a reschedule request at least 48 hours before the scheduled session
5. WHEN a reschedule request is submitted THEN the system SHALL notify workspace admins and operators for approval
6. WHEN a reschedule request is less than 48 hours before the session THEN the system SHALL prevent submission and display a warning message
7. WHEN a therapist completes a session THEN the system SHALL allow updating the session status and adding progress notes directly from the dashboard
8. WHEN viewing patient information THEN the system SHALL display patient history, previous progress reports, and upcoming sessions for that patient
9. WHEN a therapist dashboard is accessed THEN the system SHALL only display sessions and patients assigned to that specific therapist

### Requirement 14: Automated Payment Reminders and Notifications

**User Story:** As a workspace admin, I want the system to automatically send payment reminders to patients with outstanding dues, so that I can improve payment collection without manual follow-up.

#### Acceptance Criteria

1. WHEN the system runs scheduled tasks THEN the system SHALL check for patients with outstanding dues on the 15th of each month
2. WHEN a patient has outstanding dues on the 15th THEN the system SHALL send an SMS notification to the guardian's phone number
3. WHEN sending payment reminders THEN the system SHALL include patient name, total due amount, and payment instructions
4. WHEN a notification is sent THEN the system SHALL log the notification in the database with timestamp and delivery status
5. WHEN viewing patient details THEN the system SHALL display notification history including sent reminders
6. WHEN a payment reminder fails to send THEN the system SHALL log the failure and retry up to 3 times
7. WHEN configuring notification settings THEN the system SHALL allow admins to customize reminder date (default 15th) and message template
8. WHEN a patient pays their dues THEN the system SHALL not send reminders for that patient in the next cycle

### Requirement 15: Performance and Scalability

**User Story:** As a platform administrator, I want the system to perform efficiently under load and scale as more therapy centers are onboarded, so that user experience remains consistent.

#### Acceptance Criteria

1. WHEN API requests are made THEN the system SHALL respond within 200ms for 95% of requests under normal load
2. WHEN database queries are executed THEN the system SHALL use connection pooling to optimize database connections
3. WHEN frequently accessed data is requested THEN the system SHALL implement caching mechanisms to reduce database load
4. WHEN the database schema is designed THEN the system SHALL include appropriate indexes on frequently queried columns
5. WHEN the application is deployed THEN the system SHALL use Docker containers for consistent deployment across environments
6. WHEN scaling is required THEN the system SHALL support horizontal scaling by adding more application instances
