# 🎯 Therapist Unavailability Management - Feature Guide

## Quick Start

The Therapist Unavailability Management feature allows you to mark therapists as unavailable for specific time periods, automatically detect conflicting sessions, and reschedule them.

## Where to Find It

### In the UI
1. Navigate to **Therapists** page
2. Click on any therapist to view their details
3. Scroll down to the **"Unavailability Periods"** section
4. Click **"Mark Unavailable"** to create a new unavailability period

### Location in Code
- **Frontend Page**: `frontend/app/therapists/[id]/page.tsx`
- **Component**: `frontend/components/therapist/unavailability-list.tsx`
- **Form Dialog**: `frontend/components/therapist/unavailability-form.tsx`
- **Hooks**: `frontend/hooks/use-therapist-unavailability.ts`

## How to Use

### Creating Unavailability

1. **Click "Mark Unavailable"** button in the Unavailability Periods section

2. **Choose Unavailability Type**:
   - **Specific Time Slot**: Mark a specific time range on a single day
   - **Entire Day**: Mark a full day as unavailable
   - **Date Range**: Mark multiple consecutive days as unavailable

3. **Fill in Details**:
   - **Date**: Select the date (or date range)
   - **Time** (optional): For specific time slots, select start and end time
   - **Reason**: Choose from:
     - Sick Leave
     - Vacation
     - Personal Leave
     - Emergency
     - Training
     - Other
   - **Notes** (optional): Add any additional information

4. **Handle Conflicts**:
   - If there are scheduled sessions during the unavailability period, you'll see them listed
   - For each affected session, choose:
     - **Reschedule**: Select a new time slot from available options
     - **Cancel**: Cancel the session

5. **Confirm**: Click "Confirm & Create" to save

### Viewing Unavailability Periods

All unavailability periods are displayed in the **Unavailability Periods** card on the therapist detail page.

Each period shows:
- 📅 Date range
- 🕐 Time range (if specific slot)
- 🏷️ Reason (color-coded badge)
- 📝 Notes
- 📆 Creation date

### Deleting Unavailability

Click the **trash icon** (🗑️) next to any unavailability period to delete it.

## API Endpoints

### Get Unavailability Periods
```
GET /api/v1/therapists/:therapistId/unavailability
```

### Get Affected Sessions
```
GET /api/v1/therapists/:therapistId/unavailability/affected-sessions
```

### Get Available Reschedule Slots
```
GET /api/v1/therapists/:therapistId/unavailability/reschedule-slots
```

### Create Unavailability
```
POST /api/v1/therapists/:therapistId/unavailability
```

### Update Unavailability
```
PUT /api/v1/therapists/:therapistId/unavailability/:id
```

### Delete Unavailability
```
DELETE /api/v1/therapists/:therapistId/unavailability/:id
```

## Examples

### Example 1: Sick Leave (Single Day)
```
Type: Entire Day
Date: October 25, 2025
Reason: Sick Leave
Notes: Flu - need rest
```

### Example 2: Doctor's Appointment (Specific Time)
```
Type: Specific Time Slot
Date: October 25, 2025
Time: 14:00 - 16:00
Reason: Personal Leave
Notes: Doctor's appointment
```

### Example 3: Vacation (Multiple Days)
```
Type: Date Range
Start Date: October 25, 2025
End Date: October 30, 2025
Reason: Vacation
Notes: Annual leave - beach vacation
```

## Features

✅ **Three Unavailability Types**
- Single time slot
- Entire day
- Date range

✅ **Automatic Conflict Detection**
- Finds all sessions affected by the unavailability period
- Shows patient names and session times

✅ **Smart Rescheduling**
- Suggests available time slots for rescheduling
- Considers therapist availability and existing bookings
- Looks ahead 30 days by default

✅ **Reason Tracking**
- Categorize unavailability with predefined reasons
- Color-coded badges for easy identification

✅ **Notes Support**
- Add additional context or information
- Visible in the unavailability list

## Color Coding

- 🔴 **Sick Leave**: Red badge
- 🔵 **Vacation**: Blue badge
- 🟡 **Personal Leave**: Yellow badge
- 🟠 **Emergency**: Orange badge
- 🟣 **Training**: Purple badge
- ⚪ **Other**: Gray badge

## Related Features

### Break Slots
Break slots are managed separately through the **Availability Setup** section. They represent regular break times in the therapist's schedule (e.g., lunch break).

**Difference**:
- **Break Slots**: Recurring weekly breaks (e.g., every Monday 12:00-13:00)
- **Unavailability**: One-time or temporary periods (e.g., vacation, sick leave)

### Availability Slots
Regular availability is managed through the **Availability Setup** section. This defines when the therapist is normally available for sessions.

## Technical Details

### Database Model
```prisma
model TherapistUnavailability {
  id          String                 @id @default(uuid())
  tenantId    String
  therapistId String
  startDate   DateTime
  endDate     DateTime
  startTime   String?
  endTime     String?
  reason      UnavailabilityReason
  notes       String?
  createdAt   DateTime               @default(now())
  updatedAt   DateTime               @updatedAt
}
```

### Reason Enum
```prisma
enum UnavailabilityReason {
  SICK_LEAVE
  VACATION
  PERSONAL_LEAVE
  EMERGENCY
  TRAINING
  OTHER
}
```

## Troubleshooting

### Issue: Can't see the Unavailability Periods section
**Solution**: Make sure the therapist has a session duration configured. Go to Edit Therapist and set the session duration.

### Issue: No available reschedule slots shown
**Solution**: This means there are no available time slots in the next 30 days. You may need to:
- Add more availability slots for the therapist
- Extend the search period
- Cancel the affected sessions instead

### Issue: Affected sessions not detected
**Solution**: The system only detects SCHEDULED sessions. Cancelled or completed sessions are not included.

## Support

For more information, see:
- **Full Documentation**: `THERAPIST_BREAKS_AND_UNAVAILABILITY_COMPLETE.md`
- **Break Slots Guide**: `BREAK_SLOTS_UI_COMPLETE.md`
- **Feature Locations**: `WHERE_TO_FIND_BREAK_FEATURES.md`

---

**Last Updated**: October 25, 2025  
**Version**: 1.0.0
