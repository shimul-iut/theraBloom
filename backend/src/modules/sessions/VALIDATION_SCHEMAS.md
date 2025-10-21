# Session Validation Schemas

This document describes all Zod validation schemas for the sessions module.

## Session Schemas

### 1. Create Session Schema

**Schema:** `createSessionSchema`

Validates data for creating a new session.

**Fields:**
- `patientId` (UUID, required) - Patient ID
- `therapistId` (UUID, required) - Therapist ID
- `therapyTypeId` (UUID, required) - Therapy type ID
- `scheduledDate` (ISO datetime, required) - Session scheduled date
- `startTime` (HH:MM format, required) - Session start time
- `endTime` (HH:MM format, required) - Session end time
- `notes` (string, optional, max 1000 chars) - Session notes
- `paidWithCredit` (boolean, default: false) - Whether paid with patient credit

**Custom Validations:**
1. End time must be after start time
2. Scheduled date cannot be in the past

**Example:**
```json
{
  "patientId": "123e4567-e89b-12d3-a456-426614174000",
  "therapistId": "123e4567-e89b-12d3-a456-426614174001",
  "therapyTypeId": "123e4567-e89b-12d3-a456-426614174002",
  "scheduledDate": "2025-10-25T00:00:00.000Z",
  "startTime": "09:00",
  "endTime": "10:00",
  "notes": "Initial assessment session",
  "paidWithCredit": false
}
```

### 2. Update Session Schema

**Schema:** `updateSessionSchema`

Validates data for updating/rescheduling a session.

**Fields:**
- `scheduledDate` (ISO datetime, optional) - New scheduled date
- `startTime` (HH:MM format, optional) - New start time
- `endTime` (HH:MM format, optional) - New end time
- `status` (SessionStatus enum, optional) - Session status
- `notes` (string, optional, max 1000 chars) - Session notes

**Custom Validations:**
1. If both times provided, end time must be after start time
2. If scheduled date provided, cannot be in the past

**Status Values:**
- `SCHEDULED`
- `COMPLETED`
- `CANCELLED`
- `NO_SHOW`

**Example:**
```json
{
  "scheduledDate": "2025-10-26T00:00:00.000Z",
  "startTime": "10:00",
  "endTime": "11:00",
  "status": "SCHEDULED",
  "notes": "Rescheduled due to therapist availability"
}
```

### 3. Cancel Session Schema

**Schema:** `cancelSessionSchema`

Validates data for cancelling a session.

**Fields:**
- `cancelReason` (string, required, 5-500 chars) - Reason for cancellation

**Example:**
```json
{
  "cancelReason": "Patient requested cancellation due to illness"
}
```

### 4. Session Filters Schema

**Schema:** `sessionFiltersSchema`

Validates query parameters for filtering sessions.

**Fields:**
- `patientId` (UUID, optional) - Filter by patient
- `therapistId` (UUID, optional) - Filter by therapist
- `therapyTypeId` (UUID, optional) - Filter by therapy type
- `status` (SessionStatus enum, optional) - Filter by status
- `startDate` (ISO datetime, optional) - Filter from date
- `endDate` (ISO datetime, optional) - Filter to date
- `page` (integer, default: 1) - Page number
- `limit` (integer, default: 20, max: 100) - Items per page

**Example:**
```
GET /api/v1/sessions?therapistId=123e4567-e89b-12d3-a456-426614174001&status=SCHEDULED&page=1&limit=20
```

### 5. Calendar Filters Schema

**Schema:** `calendarFiltersSchema`

Validates query parameters for calendar view.

**Fields:**
- `startDate` (ISO datetime, required) - Calendar start date
- `endDate` (ISO datetime, required) - Calendar end date
- `therapistId` (UUID, optional) - Filter by therapist

**Example:**
```
GET /api/v1/sessions/calendar?startDate=2025-10-01T00:00:00.000Z&endDate=2025-10-31T23:59:59.999Z
```

### 6. Session ID Parameter Schema

**Schema:** `sessionIdParamSchema`

Validates session ID in URL parameters.

**Fields:**
- `id` (UUID, required) - Session ID

## Session Payment Schemas

### 1. Record Session Payment Schema

**Schema:** `recordSessionPaymentSchema`

Validates data for recording a session payment.

**Fields:**
- `amountPaid` (number, required, positive, max: 1,000,000) - Payment amount
- `paymentMethod` (PaymentMethod enum, required) - Payment method
- `paidAt` (ISO datetime, optional) - Payment date (defaults to now)
- `dueDate` (ISO datetime, optional) - Due date for remaining payment
- `notes` (string, optional, max 500 chars) - Payment notes

**Payment Methods:**
- `CASH`
- `CARD`
- `BANK_TRANSFER`
- `CREDIT`

**Example:**
```json
{
  "amountPaid": 5000,
  "paymentMethod": "CASH",
  "paidAt": "2025-10-21T10:30:00.000Z",
  "notes": "Partial payment received"
}
```

### 2. Session Payment Filters Schema

**Schema:** `sessionPaymentFiltersSchema`

Validates parameters for fetching session payments.

**Fields:**
- `sessionId` (UUID, required) - Session ID

### 3. Payment Summary Parameter Schema

**Schema:** `paymentSummaryParamSchema`

Validates parameters for payment summary.

**Fields:**
- `sessionId` (UUID, required) - Session ID

## Business Logic Validation

Beyond schema validation, the service layer enforces critical business rules:

### Double-Booking Prevention

**Therapist Conflict Detection:**
- No therapist can have overlapping sessions
- Checks for any time overlap, including shared boundaries
- Validates on both create and update operations
- Error: `THERAPIST_SCHEDULING_CONFLICT`

**Patient Conflict Detection:**
- No patient can have overlapping sessions
- Prevents double-booking for patients
- Validates on both create and update operations
- Error: `PATIENT_SCHEDULING_CONFLICT`

**Overlap Detection Rules:**
1. New session starts during existing session
2. New session ends during existing session
3. New session completely contains existing session
4. Sessions share the same start or end time

### Example Conflict Scenarios

**Scenario 1: Overlapping Start**
```
Existing: 09:00 - 10:00
New:      09:30 - 10:30  ❌ CONFLICT
```

**Scenario 2: Overlapping End**
```
Existing: 09:00 - 10:00
New:      08:30 - 09:30  ❌ CONFLICT
```

**Scenario 3: Complete Overlap**
```
Existing: 09:00 - 10:00
New:      08:30 - 10:30  ❌ CONFLICT
```

**Scenario 4: Shared Boundary**
```
Existing: 09:00 - 10:00
New:      10:00 - 11:00  ❌ CONFLICT (shares boundary)
```

**Scenario 5: No Overlap (Valid)**
```
Existing: 09:00 - 10:00
New:      10:01 - 11:00  ✓ VALID
```

## Validation Error Handling

### Schema Validation Errors

When Zod validation fails:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "path": ["endTime"],
        "message": "End time must be after start time"
      }
    ]
  }
}
```

### Business Logic Errors

**Therapist Scheduling Conflict:**
```json
{
  "success": false,
  "error": {
    "code": "THERAPIST_SCHEDULING_CONFLICT",
    "message": "Therapist already has a session scheduled at this time"
  }
}
```

**Patient Scheduling Conflict:**
```json
{
  "success": false,
  "error": {
    "code": "PATIENT_SCHEDULING_CONFLICT",
    "message": "Patient already has a session scheduled at this time"
  }
}
```

## Common Validation Rules

### Time Format
- Must be in HH:MM format (24-hour)
- Examples: "09:00", "14:30", "23:59"

### Date Format
- Must be ISO 8601 datetime string
- Examples: "2025-10-21T10:30:00.000Z"

### UUID Format
- Must be valid UUID v4
- Example: "123e4567-e89b-12d3-a456-426614174000"

## Usage in Controllers

All schemas are used in controllers with `.parse()` method:

```typescript
const input = createSessionSchema.parse(req.body);
```

This automatically validates and throws if validation fails.

## Type Safety

All schemas export TypeScript types:

```typescript
import { CreateSessionInput, UpdateSessionInput } from './sessions.schema';

function createSession(data: CreateSessionInput) {
  // TypeScript knows the exact shape of data
}
```

## Testing Validation

Example test cases:

```typescript
// Valid session creation
const validSession = {
  patientId: "123e4567-e89b-12d3-a456-426614174000",
  therapistId: "123e4567-e89b-12d3-a456-426614174001",
  therapyTypeId: "123e4567-e89b-12d3-a456-426614174002",
  scheduledDate: "2025-10-25T00:00:00.000Z",
  startTime: "09:00",
  endTime: "10:00",
  paidWithCredit: false
};

// Invalid - end time before start time
const invalidSession = {
  ...validSession,
  startTime: "10:00",
  endTime: "09:00" // Error: End time must be after start time
};

// Invalid - past date
const pastSession = {
  ...validSession,
  scheduledDate: "2020-01-01T00:00:00.000Z" // Error: Cannot schedule sessions in the past
};
```

## Best Practices

1. Always validate input at the controller level
2. Use schema types for type safety
3. Provide clear error messages
4. Validate both format and business rules
5. Use custom refinements for complex validations
6. Keep validation logic in schemas, not services
