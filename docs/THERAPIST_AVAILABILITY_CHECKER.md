# Therapist Availability Checker UI

## Overview
A real-time availability checker that displays therapist schedule status, conflicts, and existing sessions when creating or editing therapy sessions.

## Features Implemented

### Backend API
✅ **New Endpoint**: `GET /api/v1/sessions/check-availability`
- Query parameters: `therapistId`, `date`, `startTime`, `endTime`
- Returns detailed availability information including:
  - Overall availability status
  - Schedule availability (within working hours)
  - Scheduling conflicts detection
  - List of existing sessions on the selected date

### Frontend Components

#### 1. Availability Checker Component
**Location**: `frontend/components/schedule/availability-checker.tsx`

**Features**:
- Real-time availability checking as user fills the form
- Visual status indicators with color-coded badges
- Displays existing sessions for the selected date
- Shows helpful error messages for conflicts
- Loading state with spinner
- Auto-hides when required fields are missing

**Visual Elements**:
- ✅ Green checkmark for available slots
- ❌ Red X for unavailable slots
- ⚠️ Warning icon for schedule conflicts
- 🕐 Clock icon for time-related information
- Color-coded badges for quick status recognition

#### 2. Session Form Integration
**Location**: `frontend/components/schedule/session-form.tsx`

The availability checker is automatically displayed when:
- Therapist is selected
- Date is selected
- Start time is entered
- End time is calculated/entered

### Frontend Hook
**Location**: `frontend/hooks/use-sessions.ts`

New hook: `useCheckAvailability(therapistId, date, startTime, endTime)`
- Automatically fetches availability data
- Caches results for performance
- Only runs when all required parameters are present

## How It Works

### 1. User Flow
1. Admin selects a therapist from the dropdown
2. Admin selects a date
3. Admin enters start time
4. End time is auto-calculated based on session duration
5. **Availability checker appears automatically**
6. Shows real-time availability status
7. Displays any conflicts or existing sessions
8. Admin can proceed if available, or adjust time if not

### 2. Availability Logic
The system checks:
- **Schedule Availability**: Is the therapist scheduled to work at this time?
- **Conflict Detection**: Does the therapist have another session at this time?
- **Existing Sessions**: What other sessions are booked for this date?

### 3. Visual Feedback

#### Available Slot
```
✅ Available
This time slot is available for booking.

Schedule Availability: ✅ Within Schedule
Scheduling Conflicts: ✅ No Conflicts

No other sessions scheduled for this date
```

#### Unavailable - Outside Schedule
```
❌ Not Available
This time slot cannot be booked due to conflicts or schedule restrictions.

Schedule Availability: ❌ Outside Schedule
Scheduling Conflicts: ✅ No Conflicts

⚠️ The therapist is not scheduled to work during this time.
```

#### Unavailable - Conflict
```
❌ Not Available
This time slot cannot be booked due to conflicts or schedule restrictions.

Schedule Availability: ✅ Within Schedule
Scheduling Conflicts: ⚠️ Conflict Detected

Existing Sessions on This Date:
- John Doe (14:00 - 14:50) [Booked]

⚠️ This time slot overlaps with an existing session.
```

## API Response Format

```typescript
{
  available: boolean;
  hasAvailabilitySchedule: boolean;
  hasConflict: boolean;
  therapist: {
    id: string;
    name: string;
  };
  date: string;
  startTime: string;
  endTime: string;
  existingSessions: Array<{
    id: string;
    startTime: string;
    endTime: string;
    patientName: string;
  }>;
}
```

## Files Modified

### Backend
1. `backend/src/modules/sessions/sessions.controller.ts`
   - Added `checkAvailability()` method

2. `backend/src/modules/sessions/sessions.service.ts`
   - Added `checkAvailability()` method with detailed logic

3. `backend/src/modules/sessions/sessions.routes.ts`
   - Added route: `GET /sessions/check-availability`

### Frontend
1. `frontend/hooks/use-sessions.ts`
   - Added `useCheckAvailability()` hook
   - Added `AvailabilityCheck` interface

2. `frontend/components/schedule/availability-checker.tsx` (NEW)
   - Complete availability checker UI component

3. `frontend/components/schedule/session-form.tsx`
   - Integrated availability checker
   - Added watchers for date, startTime, endTime

## Usage

### In Session Creation Page
The availability checker is automatically integrated into:
- `/schedule/new` - Create new session page
- Any page using the `SessionForm` component

### Manual Integration
```tsx
import { AvailabilityChecker } from '@/components/schedule/availability-checker';

<AvailabilityChecker
  therapistId="therapist-uuid"
  date="2025-10-25"
  startTime="14:00"
  endTime="14:50"
/>
```

## Benefits

1. **Prevents Double Booking**: Real-time conflict detection before submission
2. **Better UX**: Immediate feedback instead of error after submission
3. **Transparency**: Shows all existing sessions for the day
4. **Time Saving**: Admins can see availability without trial and error
5. **Reduced Errors**: Clear visual indicators prevent scheduling mistakes

## Testing

### Test Scenarios
1. ✅ Select available time slot → Shows green "Available" status
2. ✅ Select time outside working hours → Shows "Outside Schedule" warning
3. ✅ Select time with existing session → Shows "Conflict Detected" with session details
4. ✅ Change therapist → Availability updates automatically
5. ✅ Change date → Availability updates automatically
6. ✅ Change time → Availability updates automatically

### API Testing
```bash
# Test availability check
curl -X GET "http://localhost:3000/api/v1/sessions/check-availability?therapistId=xxx&date=2025-10-25&startTime=14:00&endTime=14:50" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Future Enhancements

Potential improvements:
- Show therapist's full weekly schedule
- Suggest alternative available time slots
- Calendar view with color-coded availability
- Patient availability checking
- Bulk availability checking for multiple therapists
- Email notifications for schedule changes

## Status
✅ **Complete and Ready to Use**

The therapist availability checker is fully implemented and integrated into the session creation/edit workflow.
