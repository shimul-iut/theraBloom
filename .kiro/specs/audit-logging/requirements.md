# Audit Logging System - Requirements

## Overview
Implement a comprehensive audit logging system to track all critical operations in the therapy management platform, providing full traceability of user actions for compliance, security, and operational monitoring.

## User Stories

### Story 1: System Administrator
As a system administrator, I want to view a complete audit trail of all system activities so that I can monitor operations, investigate issues, and ensure compliance with data protection regulations.

### Story 2: Compliance Officer
As a compliance officer, I want to search and filter audit logs by user, action type, and date range so that I can generate compliance reports and investigate specific incidents.

### Story 3: Operations Manager
As an operations manager, I want to see who made changes to patient records, sessions, and invoices so that I can maintain accountability and resolve disputes.

---

## Functional Requirements

### Requirement 1: Audit Log Capture

**User Story:** As a system, I want to automatically capture audit logs for all critical operations so that no important action goes unrecorded.

#### Operations to Log

**Patient Operations:**
- Patient registration (CREATE)
- Patient profile updates (UPDATE)
- Patient deactivation (DELETE)

**Therapist Operations:**
- Therapist registration (CREATE)
- Therapist profile updates (UPDATE)
- Therapist pricing changes (UPDATE)
- Therapist availability changes (UPDATE)
- Therapist deactivation (DELETE)

**Session Operations:**
- Session creation (CREATE)
- Session rescheduling (UPDATE)
- Session status changes (UPDATE)
- Session cancellation (CANCEL)

**Invoice Operations:**
- Invoice creation (CREATE)
- Invoice voiding (DELETE)

**Payment Operations:**
- Payment recording (CREATE)

**Authentication Operations:**
- User login (LOGIN)
- User logout (LOGOUT)
- Failed login attempts (LOGIN)

#### Acceptance Criteria

1. THE System SHALL automatically create an audit log entry for each logged operation
2. THE System SHALL capture the following information for each audit log:
   - Unique log ID
   - Tenant ID
   - User ID (who performed the action)
   - Action type (CREATE, UPDATE, DELETE, CANCEL, LOGIN, LOGOUT)
   - Resource type (Patient, Therapist, Session, Invoice, Payment, User)
   - Resource ID (ID of the affected record)
   - Changes (JSON object with before/after values for UPDATE operations)
   - IP address of the user
   - User agent (browser/device information)
   - Timestamp
3. THE System SHALL log changes asynchronously to avoid impacting operation performance
4. THE System SHALL handle audit logging failures gracefully without blocking operations

---

### Requirement 2: Audit Log Query API

**User Story:** As a frontend application, I want to query audit logs with filters and pagination so that I can display relevant logs to users.

#### Acceptance Criteria

1. THE System SHALL provide an API endpoint to query audit logs: `GET /audit-logs`
2. THE System SHALL support the following query parameters:
   - `page` (default: 1)
   - `limit` (default: 50, max: 100)
   - `userId` (filter by user who performed action)
   - `action` (filter by action type)
   - `resourceType` (filter by resource type)
   - `resourceId` (filter by specific resource)
   - `startDate` (filter logs from this date)
   - `endDate` (filter logs until this date)
   - `search` (search in resource type, action, or user name)
3. THE System SHALL return audit logs with user information (name, role)
4. THE System SHALL return paginated results with total count
5. THE System SHALL order logs by timestamp descending (newest first)
6. THE System SHALL only return logs for the authenticated user's tenant

---

### Requirement 3: Audit Log Viewer UI

**User Story:** As an administrator, I want a user-friendly interface to view and search audit logs so that I can quickly find relevant information.

#### Acceptance Criteria

1. THE System SHALL provide an Audit Logs page accessible from the main navigation
2. THE System SHALL display audit logs in a table with the following columns:
   - Timestamp
   - User (name and role)
   - Action (with color coding)
   - Resource Type
   - Resource ID/Name
   - Changes summary
3. THE System SHALL provide filter controls:
   - **Date range picker** (from date and to date with calendar UI)
   - **Single date filter** (quick filter for specific date)
   - Action type dropdown (All, Create, Update, Delete, Cancel, Login, Logout)
   - Resource type dropdown (All, Patient, Therapist, Session, Invoice, Payment, User)
   - User selector
   - Search input
4. THE System SHALL provide pagination controls
5. THE System SHALL allow expanding log entries to view detailed changes
6. THE System SHALL display IP address and user agent on expanded view
7. THE System SHALL update results in real-time when filters change
8. THE System SHALL show loading states during data fetching
9. THE System SHALL handle empty states with helpful messages
10. THE System SHALL provide **preset date ranges** (Today, Yesterday, Last 7 days, Last 30 days, Custom)

---

### Requirement 4: Change Tracking

**User Story:** As an administrator, I want to see what specific fields were changed in UPDATE operations so that I can understand exactly what was modified.

#### Acceptance Criteria

1. FOR UPDATE operations, THE System SHALL capture:
   - Field name
   - Old value
   - New value
2. THE System SHALL store changes as a JSON object in the format:
   ```json
   {
     "fieldName": {
       "old": "previous value",
       "new": "new value"
     }
   }
   ```
3. THE System SHALL exclude sensitive fields from change tracking:
   - Password hashes
   - Authentication tokens
4. THE System SHALL format changes for display in the UI:
   - Show field labels (not database column names)
   - Format dates and numbers appropriately
   - Truncate long text values with "show more" option

---

### Requirement 5: Access Control

**User Story:** As a system, I want to restrict audit log access to authorized users only so that sensitive operational data is protected.

#### Acceptance Criteria

1. THE System SHALL only allow WORKSPACE_ADMIN and ACCOUNTANT roles to access audit logs
2. THE System SHALL return 403 Forbidden for unauthorized access attempts
3. THE System SHALL log unauthorized access attempts
4. THE System SHALL enforce tenant isolation (users can only see their tenant's logs)

---

### Requirement 6: Performance and Retention

**User Story:** As a system, I want to maintain audit log performance and manage storage efficiently so that the system remains responsive.

#### Acceptance Criteria

1. THE System SHALL use database indexes on:
   - tenantId + createdAt
   - tenantId + resourceType + resourceId
   - tenantId + userId
2. THE System SHALL implement pagination to limit query results
3. THE System SHALL provide a retention policy configuration (default: 1 year)
4. THE System SHALL provide an admin tool to archive or delete old logs
5. THE System SHALL maintain audit log write performance under 50ms per entry

---

## Non-Functional Requirements

### Security
- Audit logs must be immutable (no updates or deletes except by retention policy)
- Audit log access must be logged itself
- Sensitive data must be masked in audit logs

### Performance
- Audit logging must not block primary operations
- Query response time must be under 2 seconds for typical filters
- Support for at least 1 million audit log entries

### Compliance
- Audit logs must support HIPAA compliance requirements
- Logs must be tamper-evident
- Logs must be exportable for compliance reporting

### Usability
- Search and filter interface must be intuitive
- Results must be easy to read and understand
- Export functionality for audit reports

---

### Requirement 7: Contextual Audit Log Links

**User Story:** As a user viewing a patient, session, or invoice, I want to quickly access related audit logs so that I can see the history of changes for that specific record.

#### Acceptance Criteria

1. THE System SHALL provide a "View Audit Logs" button/link on the following pages:
   - Patient detail page
   - Therapist detail page
   - Session detail/list page
   - Invoice detail page
   - Payment detail page
2. THE System SHALL pre-filter audit logs when accessed via contextual links:
   - Filter by resourceType (e.g., "Patient")
   - Filter by resourceId (e.g., specific patient ID)
3. THE System SHALL display a breadcrumb or header indicating the filtered context
4. THE System SHALL allow users to clear the pre-applied filters
5. THE System SHALL open audit logs in the same tab with proper navigation
6. THE System SHALL show a count of audit log entries for the resource (e.g., "12 changes")

---

## Out of Scope

- Real-time audit log streaming
- Advanced analytics and dashboards
- Automated alerting based on audit patterns
- Integration with external SIEM systems
- Audit log encryption at rest (handled by database)

---

## Success Metrics

1. 100% of critical operations are logged
2. Audit log queries return results in < 2 seconds
3. Zero audit logging failures that block operations
4. Administrators can find specific audit entries in < 30 seconds
5. Audit logs support successful compliance audits
