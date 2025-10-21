# Double-Booking Prevention System

## Overview

The session management system implements comprehensive double-booking prevention to ensure:
1. **No therapist** can have overlapping sessions
2. **No patient** can have overlapping sessions
3. **No time slot conflicts** at any level

## Validation Rules

### 1. Therapist Conflict Detection

**Rule:** A therapist cannot have two sessions with any time overlap on the same date.

**Checked During:**
- Session creation (`POST /api/v1/sessions`)
- Session update/reschedule (`PUT /api/v1/sessions/:id`)

**Implementation:**
```typescript
checkTherapistSchedulingConflict(
  tenantId: string,
  therapistId: string,
  scheduledDate: Date,
  startTime: string,
  endTime: string,
  excludeSessionId?: string
): Promise<boolean>
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "THERAPIST_SCHEDULING_CONFLICT",
    "message": "Therapist already has a session scheduled at this time"
  }
}
```

### 2. Patient Conflict Detection

**Rule:** A patient cannot have two sessions with any time overlap on the same date.

**Checked During:**
- Session creation (`POST /api/v1/sessions`)
- Session update/reschedule (`PUT /api/v1/sessions/:id`)

**Implementation:**
```typescript
checkPatientSchedulingConflict(
  tenantId: string,
  patientId: string,
  scheduledDate: Date,
  startTime: string,
  endTime: string,
  excludeSessionId?: string
): Promise<boolean>
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "PATIENT_SCHEDULING_CONFLICT",
    "message": "Patient already has a session scheduled at this time"
  }
}
```

## Overlap Detection Algorithm

### Time Overlap Logic

Two sessions overlap if ANY of these conditions are true:

1. **New session starts during existing session**
   ```
   Existing: |--------|
   New:         |--------|
   ```

2. **New session ends during existing session**
   ```
   Existing:    |--------|
   New:      |--------|
   ```

3. **New session completely contains existing session**
   ```
   Existing:   |-----|
   New:      |---------|
   ```

4. **Sessions share boundaries** (same start OR end time)
   ```
   Existing: |--------|
   New:              |--------|
   ```

### Implementation

```typescript
private hasTimeOverlap(
  existingSessions: Array<{ startTime: string; endTime: string }>,
  requestedStartTime: string,
  requestedEndTime: string
): boolean {
  // Convert times to minutes for comparison
  const reqStart = timeToMinutes(requestedStartTime);
  const reqEnd = timeToMinutes(requestedEndTime);

  for (const session of existingSessions) {
    const existStart = timeToMinutes(session.startTime);
    const existEnd = timeToMinutes(session.endTime);

    // Check all overlap conditions
    if (
      (reqStart >= existStart && reqStart < existEnd) ||  // Starts during
      (reqEnd > existStart && reqEnd <= existEnd) ||      // Ends during
      (reqStart <= existStart && reqEnd >= existEnd) ||   // Contains
      (reqStart === existStart || reqEnd === existEnd)    // Shares boundary
    ) {
      return true; // Conflict detected
    }
  }

  return false; // No conflicts
}
```

## Conflict Scenarios

### Valid Scenarios (No Conflict)

#### Scenario 1: Sequential Sessions
```
Session 1: 09:00 - 10:00
Session 2: 10:01 - 11:00  ✓ VALID (1 minute gap)
```

#### Scenario 2: Different Days
```
Session 1: 2025-10-21 09:00 - 10:00
Session 2: 2025-10-22 09:00 - 10:00  ✓ VALID (different dates)
```

#### Scenario 3: Cancelled Session
```
Session 1: 09:00 - 10:00 (CANCELLED)
Session 2: 09:00 - 10:00  ✓ VALID (cancelled sessions ignored)
```

### Invalid Scenarios (Conflict)

#### Scenario 1: Exact Overlap
```
Session 1: 09:00 - 10:00
Session 2: 09:00 - 10:00  ❌ CONFLICT (exact same time)
```

#### Scenario 2: Partial Overlap (Start)
```
Session 1: 09:00 - 10:00
Session 2: 09:30 - 10:30  ❌ CONFLICT (overlaps 30 minutes)
```

#### Scenario 3: Partial Overlap (End)
```
Session 1: 09:00 - 10:00
Session 2: 08:30 - 09:30  ❌ CONFLICT (overlaps 30 minutes)
```

#### Scenario 4: Complete Containment
```
Session 1: 09:00 - 10:00
Session 2: 08:00 - 11:00  ❌ CONFLICT (contains session 1)
```

#### Scenario 5: Shared Start Time
```
Session 1: 09:00 - 10:00
Session 2: 09:00 - 09:30  ❌ CONFLICT (shares start time)
```

#### Scenario 6: Shared End Time
```
Session 1: 09:00 - 10:00
Session 2: 09:30 - 10:00  ❌ CONFLICT (shares end time)
```

#### Scenario 7: Adjacent Sessions (Boundary)
```
Session 1: 09:00 - 10:00
Session 2: 10:00 - 11:00  ❌ CONFLICT (shares boundary at 10:00)
```

## Session Status Handling

### Statuses Checked for Conflicts

Only these statuses are considered when checking conflicts:
- `SCHEDULED` - Future scheduled sessions
- `COMPLETED` - Past completed sessions

### Statuses Ignored

These statuses are NOT checked for conflicts:
- `CANCELLED` - Cancelled sessions don't block time slots
- `NO_SHOW` - No-show sessions don't block time slots

**Rationale:** Cancelled and no-show sessions free up the time slot for rebooking.

## Update/Reschedule Handling

When updating or rescheduling a session:

1. **Exclude Current Session:** The session being updated is excluded from conflict checks
2. **Check New Time Slot:** Validate the new time against all other sessions
3. **Validate Both Parties:** Check conflicts for both therapist and patient

**Example:**
```typescript
// Updating session ABC123
// Exclude ABC123 from conflict check
const hasConflict = await checkTherapistSchedulingConflict(
  tenantId,
  therapistId,
  newDate,
  newStartTime,
  newEndTime,
  'ABC123' // Exclude this session
);
```

## Multi-Tenant Isolation

All conflict checks are scoped to the tenant:

```typescript
const where = {
  tenantId,        // Only check within same tenant
  therapistId,     // Or patientId
  scheduledDate,   // Same date
  status: {
    in: ['SCHEDULED', 'COMPLETED']
  }
};
```

**Result:** Therapists/patients in different tenants can have overlapping sessions.

## Performance Considerations

### Database Queries

Conflict checks use optimized queries:

```typescript
// Only fetch necessary fields
select: {
  id: true,
  startTime: true,
  endTime: true,
}

// Filter by date and status
where: {
  tenantId,
  therapistId, // or patientId
  scheduledDate,
  status: { in: ['SCHEDULED', 'COMPLETED'] }
}
```

### Indexing Recommendations

For optimal performance, ensure these indexes exist:

```sql
-- Therapist conflict check
CREATE INDEX idx_sessions_therapist_date 
ON sessions(tenant_id, therapist_id, scheduled_date, status);

-- Patient conflict check
CREATE INDEX idx_sessions_patient_date 
ON sessions(tenant_id, patient_id, scheduled_date, status);
```

## Testing

### Test Cases

#### 1. Therapist Double-Booking Prevention
```typescript
// Create session 1
POST /api/v1/sessions
{
  "therapistId": "therapist-1",
  "patientId": "patient-1",
  "scheduledDate": "2025-10-21T00:00:00.000Z",
  "startTime": "09:00",
  "endTime": "10:00"
}
// Response: 201 Created

// Try to create overlapping session
POST /api/v1/sessions
{
  "therapistId": "therapist-1",  // Same therapist
  "patientId": "patient-2",      // Different patient
  "scheduledDate": "2025-10-21T00:00:00.000Z",
  "startTime": "09:30",
  "endTime": "10:30"
}
// Response: 409 THERAPIST_SCHEDULING_CONFLICT
```

#### 2. Patient Double-Booking Prevention
```typescript
// Create session 1
POST /api/v1/sessions
{
  "therapistId": "therapist-1",
  "patientId": "patient-1",
  "scheduledDate": "2025-10-21T00:00:00.000Z",
  "startTime": "09:00",
  "endTime": "10:00"
}
// Response: 201 Created

// Try to create overlapping session
POST /api/v1/sessions
{
  "therapistId": "therapist-2",  // Different therapist
  "patientId": "patient-1",      // Same patient
  "scheduledDate": "2025-10-21T00:00:00.000Z",
  "startTime": "09:30",
  "endTime": "10:30"
}
// Response: 409 PATIENT_SCHEDULING_CONFLICT
```

#### 3. Valid Sequential Sessions
```typescript
// Create session 1
POST /api/v1/sessions
{
  "therapistId": "therapist-1",
  "patientId": "patient-1",
  "scheduledDate": "2025-10-21T00:00:00.000Z",
  "startTime": "09:00",
  "endTime": "10:00"
}
// Response: 201 Created

// Create non-overlapping session
POST /api/v1/sessions
{
  "therapistId": "therapist-1",  // Same therapist
  "patientId": "patient-1",      // Same patient
  "scheduledDate": "2025-10-21T00:00:00.000Z",
  "startTime": "10:01",          // 1 minute after
  "endTime": "11:00"
}
// Response: 201 Created ✓
```

## Error Messages

### User-Friendly Messages

The system provides clear, actionable error messages:

**Therapist Conflict:**
```
"Therapist already has a session scheduled at this time"
```

**Patient Conflict:**
```
"Patient already has a session scheduled at this time"
```

### Frontend Handling

Frontend should:
1. Display the error message to the user
2. Highlight the conflicting time slot
3. Suggest alternative time slots
4. Allow user to view existing sessions

## Summary

The double-booking prevention system ensures:

✓ No therapist can be double-booked
✓ No patient can be double-booked
✓ No time slot overlaps are allowed
✓ Boundary times are treated as conflicts
✓ Cancelled sessions don't block slots
✓ Updates exclude the current session
✓ Multi-tenant isolation is maintained
✓ Performance is optimized with proper queries

This creates a robust scheduling system that prevents conflicts at all levels.
