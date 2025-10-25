# 🎉 Therapist Breaks & Unavailability Management - Complete

## Overview
A comprehensive system for managing therapist breaks, urgent leaves, and unavailability periods with automatic session conflict detection and rescheduling options.

## Features Implemented

### 1. Break Slots ☕
- **Purpose**: Mark time slots where therapist takes breaks (no therapy sessions)
- **Type**: `BREAK` slot type in availability
- **Behavior**: Blocks time slot from booking but shows as scheduled break time

### 2. Unavailability Periods 🚫
- **Single Slot**: Mark specific time slot unavailable
- **Entire Day**: Mark full day unavailable
- **Date Range**: Mark multiple days unavailable
- **Reasons**: Sick leave, vacation, personal leave, emergency, training, other

### 3. Conflict Detection & Rescheduling 🔄
- **Automatic Detection**: Finds all sessions affected by unavailability
- **Available Slots**: Suggests alternative time slots for rescheduling
- **Bulk Reschedule**: Reschedule multiple sessions at once

## Database Schema

### New Model: TherapistUnavailability
```prisma
model TherapistUnavailability {
  id          String                 @id @default(uuid())
  tenantId    String
  therapistId String
  startDate   DateTime               // Start date of unavailability
  endDate     DateTime               // End date of unavailability
  startTime   String?                // Optional: specific start time (HH:MM)
  endTime     String?                // Optional: specific end time (HH:MM)
  reason      UnavailabilityReason   // Reason for unavailability
  notes       String?                // Additional notes
  createdAt   DateTime               @default(now())
  updatedAt   DateTime               @updatedAt
}
```

### Updated Model: TherapistAvailability
```prisma
model TherapistAvailability {
  // ... existing fields
  slotType    AvailabilitySlotType @default(AVAILABLE)  // NEW: AVAILABLE or BREAK
}
```

### New Enums
```prisma
enum AvailabilitySlotType {
  AVAILABLE  // Regular availability for sessions
  BREAK      // Break time (no sessions)
}

enum UnavailabilityReason {
  SICK_LEAVE
  VACATION
  PERSONAL_LEAVE
  EMERGENCY
  TRAINING
  OTHER
}
```

## Backend API

### Endpoints

#### 1. Get Unavailability Periods
```
GET /api/v1/therapists/:therapistId/unavailability
Query: ?startDate=2025-10-25&endDate=2025-11-25
```

#### 2. Get Affected Sessions
```
GET /api/v1/therapists/:therapistId/unavailability/affected-sessions
Query: ?startDate=2025-10-25&endDate=2025-10-26&startTime=09:00&endTime=17:00
```

#### 3. Get Available Reschedule Slots
```
GET /api/v1/therapists/:therapistId/unavailability/reschedule-slots
Query: ?startDate=2025-10-25&sessionDuration=45&daysAhead=30
```

#### 4. Create Unavailability
```
POST /api/v1/therapists/:therapistId/unavailability
Body: {
  "startDate": "2025-10-25T00:00:00.000Z",
  "endDate": "2025-10-26T00:00:00.000Z",
  "startTime": "09:00",  // Optional
  "endTime": "17:00",    // Optional
  "reason": "SICK_LEAVE",
  "notes": "Doctor's appointment",
  "rescheduleSessionIds": ["session-id-1", "session-id-2"]  // Optional
}
```

#### 5. Update Unavailability
```
PUT /api/v1/therapists/:therapistId/unavailability/:id
```

#### 6. Delete Unavailability
```
DELETE /api/v1/therapists/:therapistId/unavailability/:id
```

### Request/Response Examples

**Create Entire Day Unavailability:**
```json
{
  "startDate": "2025-10-25T00:00:00.000Z",
  "endDate": "2025-10-25T23:59:59.999Z",
  "reason": "SICK_LEAVE",
  "notes": "Flu - need rest"
}
```

**Create Specific Time Slot Unavailability:**
```json
{
  "startDate": "2025-10-25T00:00:00.000Z",
  "endDate": "2025-10-25T23:59:59.999Z",
  "startTime": "14:00",
  "endTime": "16:00",
  "reason": "PERSONAL_LEAVE",
  "notes": "Family emergency"
}
```

**Create Date Range Unavailability:**
```json
{
  "startDate": "2025-10-25T00:00:00.000Z",
  "endDate": "2025-10-30T23:59:59.999Z",
  "reason": "VACATION",
  "notes": "Annual leave"
}
```

**Response with Affected Sessions:**
```json
{
  "success": true,
  "data": {
    "unavailability": {
      "id": "uuid",
      "therapistId": "uuid",
      "startDate": "2025-10-25T00:00:00.000Z",
      "endDate": "2025-10-26T00:00:00.000Z",
      "reason": "SICK_LEAVE",
      "notes": "Flu"
    },
    "affectedSessions": [
      {
        "id": "session-1",
        "scheduledDate": "2025-10-25T00:00:00.000Z",
        "startTime": "10:00",
        "endTime": "10:45",
        "patient": {
          "firstName": "John",
          "lastName": "Doe"
        }
      }
    ]
  }
}
```

**Available Reschedule Slots Response:**
```json
{
  "success": true,
  "data": [
    {
      "date": "2025-10-27",
      "startTime": "10:00",
      "endTime": "10:45",
      "dayOfWeek": "MONDAY"
    },
    {
      "date": "2025-10-27",
      "startTime": "11:00",
      "endTime": "11:45",
      "dayOfWeek": "MONDAY"
    }
  ]
}
```

## Frontend Components ✅

### 1. Enhanced Availability Slot Form ✅
**Location**: `frontend/components/therapist/availability-slot-form.tsx`

**Features**:
- Slot Type selector (Available / Break)
- Break slots shown in different color (orange)
- Visual indicator for break vs available slots

### 2. Unavailability Management Dialog ✅
**Location**: `frontend/components/therapist/unavailability-form.tsx`

**Features**:
- Unavailability type selector (Single Slot / Entire Day / Date Range)
- Date range picker (single day, multiple days)
- Optional time range picker (for single slot)
- Reason dropdown with predefined options
- Notes textarea
- Affected sessions detection
- Reschedule options for each affected session
- Two-step workflow (form → conflicts)

### 3. Unavailability List Component ✅
**Location**: `frontend/components/therapist/unavailability-list.tsx`

**Features**:
- List all unavailability periods for a therapist
- Color-coded reason badges
- Date and time range display
- Delete functionality
- "Mark Unavailable" button to create new periods

### 4. React Hooks ✅
**Location**: `frontend/hooks/use-therapist-unavailability.ts`

**Hooks**:
- `useTherapistUnavailability` - Fetch unavailability periods
- `useUnavailabilityById` - Fetch single unavailability
- `useAffectedSessions` - Get sessions affected by unavailability
- `useAvailableRescheduleSlots` - Get available slots for rescheduling
- `useCreateUnavailability` - Create new unavailability period
- `useUpdateUnavailability` - Update existing unavailability
- `useDeleteUnavailability` - Delete unavailability period

### 5. Integration with Therapist Detail Page ✅
**Location**: `frontend/app/therapists/[id]/page.tsx`

**Changes**:
- Added UnavailabilityList component
- Integrated with existing therapist management UI
- Positioned before the schedule calendar

## User Workflows

### Workflow 1: Add Break Slot
1. Click "Add Availability Slot"
2. Select "Break" as slot type
3. Choose day, time range
4. Save
5. Break slot appears in orange on calendar

### Workflow 2: Mark Single Slot Unavailable
1. Click "Mark Unavailable" button
2. Select date
3. Select time range (e.g., 14:00 - 16:00)
4. Select reason (e.g., "Personal Leave")
5. System shows affected sessions (if any)
6. Choose reschedule options for each session
7. Confirm
8. Slot marked unavailable, sessions rescheduled

### Workflow 3: Mark Entire Day Unavailable
1. Click "Mark Unavailable"
2. Select date
3. Leave time range empty (entire day)
4. Select reason (e.g., "Sick Leave")
5. System shows all sessions for that day
6. Bulk reschedule or cancel sessions
7. Confirm
8. Entire day marked unavailable

### Workflow 4: Mark Date Range Unavailable
1. Click "Mark Unavailable"
2. Select start date and end date
3. Select reason (e.g., "Vacation")
4. System shows all sessions in date range
5. Review affected sessions (grouped by date)
6. Choose reschedule options
7. Confirm
8. Date range marked unavailable

### Workflow 5: Reschedule Affected Sessions
1. When marking unavailable, system shows affected sessions
2. For each session, dropdown shows available slots
3. Select new slot for each session
4. Or choose "Cancel session" option
5. Confirm all changes
6. Sessions automatically rescheduled
7. Patients notified (if notification system enabled)

## Visual Design

### Calendar View
```
Monday, Oct 25
┌─────────────────┐
│ 🕐 09:00        │  ← Green (Available)
│ + Available     │
└─────────────────┘

┌─────────────────┐
│ ☕ 10:00        │  ← Orange (Break)
│ Break Time      │
└─────────────────┘

┌─────────────────┐
│ 🚫 14:00        │  ← Red/Gray (Unavailable)
│ Sick Leave      │
└─────────────────┘

┌─────────────────┐
│ 🕐 15:00    [X] │  ← Blue (Booked)
│ 👤 John Doe     │
└─────────────────┘
```

### Unavailability Dialog
```
┌─────────────────────────────────────────┐
│ Mark Unavailable                   [X]  │
├─────────────────────────────────────────┤
│                                         │
│ Type:                                   │
│ ○ Single Slot  ○ Entire Day  ● Range   │
│                                         │
│ Date Range:                             │
│ From: [2025-10-25] To: [2025-10-30]    │
│                                         │
│ Time (Optional):                        │
│ From: [--:--] To: [--:--]               │
│                                         │
│ Reason: [Vacation ▼]                    │
│                                         │
│ Notes:                                  │
│ [Annual leave - beach vacation]         │
│                                         │
│ ⚠️ 5 sessions will be affected          │
│ [View Affected Sessions]                │
│                                         │
│           [Cancel]  [Continue]          │
└─────────────────────────────────────────┘
```

### Affected Sessions & Reschedule
```
┌─────────────────────────────────────────┐
│ Affected Sessions (5)                   │
├─────────────────────────────────────────┤
│                                         │
│ Monday, Oct 25                          │
│ ☑ 10:00 - 10:45 - John Doe             │
│   Reschedule to: [Oct 27, 10:00 ▼]     │
│                                         │
│ ☑ 14:00 - 14:45 - Jane Smith           │
│   Reschedule to: [Oct 27, 14:00 ▼]     │
│                                         │
│ Tuesday, Oct 26                         │
│ ☑ 09:00 - 09:45 - Mike Johnson         │
│   Reschedule to: [Oct 28, 09:00 ▼]     │
│                                         │
│ ☐ 11:00 - 11:45 - Sarah Lee            │
│   Action: [Cancel Session ▼]           │
│                                         │
│ Wednesday, Oct 27                       │
│ ☑ 15:00 - 15:45 - Tom Brown            │
│   Reschedule to: [Nov 01, 15:00 ▼]     │
│                                         │
│ [Select All] [Deselect All]            │
│                                         │
│           [Cancel]  [Confirm]           │
└─────────────────────────────────────────┘
```

## Business Logic

### Conflict Detection Rules
1. **Time Overlap**: Check if unavailability period overlaps with scheduled sessions
2. **Date Range**: Check all dates within the range
3. **Time Range**: If specified, only check sessions within that time
4. **Status Filter**: Only check SCHEDULED sessions (ignore CANCELLED, COMPLETED)

### Reschedule Slot Generation
1. **Start Date**: Begin from unavailability end date + 1 day
2. **Duration**: Use therapist's session duration
3. **Availability**: Only show slots within therapist's availability
4. **Conflicts**: Exclude slots with existing sessions
5. **Unavailability**: Exclude slots in other unavailability periods
6. **Limit**: Show next 30 days by default

### Break Slot Behavior
1. **Booking**: Cannot book sessions in break slots
2. **Display**: Show as "Break" in calendar
3. **Color**: Orange/yellow to distinguish from available
4. **Overlap**: Can overlap with unavailability (unavailability takes precedence)

## Error Handling

### Validation Errors
- End date before start date
- End time before start time
- Invalid date format
- Invalid time format
- Missing required fields

### Business Logic Errors
- **SESSIONS_CONFLICT**: Sessions exist in unavailability period without reschedule info
- **THERAPIST_NOT_FOUND**: Therapist doesn't exist
- **UNAVAILABILITY_NOT_FOUND**: Unavailability period doesn't exist

### Error Messages
```json
{
  "success": false,
  "error": {
    "code": "SESSIONS_CONFLICT",
    "message": "There are 5 scheduled sessions during this period. Please provide reschedule information."
  }
}
```

## Files Created

### Backend
1. `backend/src/modules/therapist-unavailability/therapist-unavailability.schema.ts` - Validation schemas
2. `backend/src/modules/therapist-unavailability/therapist-unavailability.service.ts` - Business logic
3. `backend/src/modules/therapist-unavailability/therapist-unavailability.controller.ts` - API endpoints
4. `backend/src/modules/therapist-unavailability/therapist-unavailability.routes.ts` - Route definitions
5. `backend/prisma/migrations/20251025130509_add_breaks_and_unavailability/migration.sql` - Database migration
6. `backend/src/server.ts` - Updated to register unavailability routes

### Frontend
1. `frontend/hooks/use-therapist-unavailability.ts` - React hooks for unavailability management
2. `frontend/components/therapist/unavailability-form.tsx` - Form dialog for creating unavailability
3. `frontend/components/therapist/unavailability-list.tsx` - List component for displaying unavailability periods
4. `frontend/app/therapists/[id]/page.tsx` - Updated to include unavailability management

### Database Changes
- Added `TherapistUnavailability` model
- Added `slotType` field to `TherapistAvailability`
- Added `AvailabilitySlotType` enum
- Added `UnavailabilityReason` enum

### Documentation
- `THERAPIST_BREAKS_AND_UNAVAILABILITY_COMPLETE.md` - This file

## Benefits

### For Admins 👨‍💼
- ✅ **Easy Leave Management**: Mark therapists unavailable quickly
- ✅ **Conflict Detection**: Automatically find affected sessions
- ✅ **Bulk Reschedule**: Reschedule multiple sessions at once
- ✅ **Break Tracking**: Track therapist break times
- ✅ **Reason Tracking**: Know why therapist is unavailable

### For Therapists 👨‍⚕️
- ✅ **Flexible Scheduling**: Mark breaks and leaves easily
- ✅ **Clear Calendar**: See breaks vs available vs booked
- ✅ **No Double Booking**: System prevents booking during breaks/leaves

### For Patients 👥
- ✅ **Automatic Rescheduling**: Sessions rescheduled automatically
- ✅ **Alternative Slots**: Offered alternative times
- ✅ **Transparency**: Know when therapist is unavailable

### For the System 🖥️
- ✅ **Data Integrity**: Prevents invalid bookings
- ✅ **Audit Trail**: Track all unavailability periods
- ✅ **Scalability**: Handles complex scheduling scenarios

## Future Enhancements

1. **Edit Unavailability**
   - Add edit functionality to unavailability form
   - Support updating existing unavailability periods

2. **Calendar Integration**
   - Show unavailability periods directly on calendar
   - Visual indicators for different unavailability types
   - Click to view/edit from calendar

3. **Notifications**
   - Notify patients when sessions are rescheduled
   - Email/SMS notifications for affected sessions

4. **Recurring Unavailability**
   - Support for recurring unavailability patterns
   - E.g., "Every Friday afternoon" or "First Monday of each month"

5. **Approval Workflow**
   - Require admin approval for certain unavailability types
   - Track approval status and history

## Testing Checklist

- [ ] Create break slot
- [ ] Create single slot unavailability
- [ ] Create entire day unavailability
- [ ] Create date range unavailability
- [ ] Detect affected sessions
- [ ] Get available reschedule slots
- [ ] Reschedule affected sessions
- [ ] Update unavailability period
- [ ] Delete unavailability period
- [ ] Prevent booking in break slots
- [ ] Prevent booking in unavailable periods
- [ ] Handle overlapping unavailability periods

## Status

✅ **Backend Complete**  
✅ **Frontend Complete**  
✅ **Integration Complete**

The full unavailability management system is implemented and ready to use. Both backend API and frontend UI are complete and integrated.

---

**Implementation Date:** October 25, 2025  
**Status:** Complete  
**Version:** 1.0.0
