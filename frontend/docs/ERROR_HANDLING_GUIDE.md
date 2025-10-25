# Frontend Error Handling Guide

## Overview

The frontend implements comprehensive error handling for all API interactions, with special focus on session scheduling conflicts and validation errors.

## Error Handler Utility

### Location
`frontend/lib/error-handler.ts`

### Features

1. **Error Extraction** - Extracts error information from API responses
2. **User-Friendly Messages** - Converts error codes to readable messages
3. **Conflict Detection** - Identifies scheduling conflicts
4. **Validation Errors** - Handles validation error details

## Error Types

### 1. Scheduling Conflicts

#### Therapist Scheduling Conflict
**Error Code:** `THERAPIST_SCHEDULING_CONFLICT`

**Message:** "The therapist already has a session scheduled at this time. Please choose a different time slot."

**When it occurs:**
- Creating a session when therapist has overlapping session
- Updating a session to a time when therapist is busy

**User Experience:**
- Toast notification with detailed message
- Extended duration (5000ms) for visibility
- Descriptive subtitle explaining the issue
- Suggestion to select different time slot

#### Patient Scheduling Conflict
**Error Code:** `PATIENT_SCHEDULING_CONFLICT`

**Message:** "The patient already has a session scheduled at this time. Please choose a different time slot."

**When it occurs:**
- Creating a session when patient has overlapping session
- Updating a session to a time when patient is busy

**User Experience:**
- Toast notification with detailed message
- Extended duration (5000ms) for visibility
- Descriptive subtitle explaining the issue
- Suggestion to select different time slot

### 2. Validation Errors

**Error Code:** `VALIDATION_ERROR`

**Common Validation Issues:**
- End time before start time
- Scheduling in the past
- Invalid UUID formats
- Missing required fields
- Invalid time formats

**User Experience:**
- Toast notification with validation message
- Form field errors (if applicable)
- Clear indication of what needs to be fixed

### 3. Resource Not Found

**Error Codes:**
- `PATIENT_NOT_FOUND`
- `THERAPIST_NOT_FOUND`
- `THERAPY_TYPE_NOT_FOUND`
- `SESSION_NOT_FOUND`

**User Experience:**
- Toast notification
- Redirect to list page (if applicable)

### 4. Business Logic Errors

**Error Codes:**
- `THERAPIST_NOT_AVAILABLE` - Therapist not available at selected time
- `INSUFFICIENT_CREDIT` - Patient doesn't have enough credit
- `INVALID_SESSION_STATUS` - Cannot perform action on session

**User Experience:**
- Toast notification with specific message
- Actionable suggestions when possible

## Implementation

### Session Hooks

All session hooks (`use-sessions.ts`) implement enhanced error handling:

```typescript
import {
  formatErrorForDisplay,
  isSchedulingConflict,
  getConflictDetails,
} from '@/lib/error-handler';

export function useCreateSession() {
  return useMutation({
    onError: (error: any) => {
      if (isSchedulingConflict(error)) {
        const conflictDetails = getConflictDetails(error);
        toast.error(conflictDetails.message, {
          duration: 5000,
          description: conflictDetails.type === 'therapist'
            ? 'The therapist has another session at this time...'
            : 'The patient has another session at this time...',
        });
      } else {
        toast.error(formatErrorForDisplay(error));
      }
    },
  });
}
```

### Error Handler Functions

#### `extractApiError(error: any): ApiError`
Extracts error information from various error formats.

```typescript
const apiError = extractApiError(error);
// Returns: { code: 'THERAPIST_SCHEDULING_CONFLICT', message: '...' }
```

#### `getUserFriendlyMessage(errorCode: string): string`
Converts error codes to user-friendly messages.

```typescript
const message = getUserFriendlyMessage('THERAPIST_SCHEDULING_CONFLICT');
// Returns: "The therapist already has a session scheduled at this time..."
```

#### `isSchedulingConflict(error: any): boolean`
Checks if error is any type of scheduling conflict.

```typescript
if (isSchedulingConflict(error)) {
  // Handle scheduling conflict
}
```

#### `getConflictDetails(error: any)`
Gets detailed information about the conflict.

```typescript
const details = getConflictDetails(error);
// Returns: { type: 'therapist', message: '...' }
```

## UI Components

### ConflictAlert Component

**Location:** `frontend/components/schedule/conflict-alert.tsx`

**Purpose:** Display scheduling conflict information with visual feedback

**Usage:**
```tsx
<ConflictAlert
  type="therapist"
  message="The therapist already has a session at this time"
  onViewSchedule={() => router.push('/schedule')}
/>
```

**Features:**
- Visual alert with icon
- Conflict type indicator (therapist/patient)
- Detailed message
- Optional link to view schedule
- Suggestions for resolution

## Toast Notifications

### Success Messages
```typescript
toast.success('Session created successfully');
toast.success('Session updated successfully');
toast.success('Session cancelled successfully');
```

### Error Messages

#### Standard Errors
```typescript
toast.error('Failed to create session');
```

#### Scheduling Conflicts
```typescript
toast.error('The therapist already has a session scheduled at this time', {
  duration: 5000,
  description: 'Please select a different time slot.',
});
```

#### Validation Errors
```typescript
toast.error('Please check your input and try again');
```

## Error Response Format

### Backend Error Response
```json
{
  "success": false,
  "error": {
    "code": "THERAPIST_SCHEDULING_CONFLICT",
    "message": "Therapist already has a session scheduled at this time"
  }
}
```

### Frontend Handling
```typescript
// Axios interceptor catches the error
// Error handler extracts the information
// Toast displays user-friendly message
```

## Best Practices

### 1. Always Use Error Handler
```typescript
// ✓ Good
onError: (error) => {
  toast.error(formatErrorForDisplay(error));
}

// ✗ Bad
onError: (error) => {
  toast.error(error.message);
}
```

### 2. Check for Specific Error Types
```typescript
// ✓ Good
if (isSchedulingConflict(error)) {
  // Handle conflict specifically
} else {
  // Handle other errors
}

// ✗ Bad
toast.error(error.message); // Generic handling
```

### 3. Provide Context
```typescript
// ✓ Good
toast.error(message, {
  description: 'Please select a different time slot.',
});

// ✗ Bad
toast.error(message); // No context
```

### 4. Use Appropriate Duration
```typescript
// ✓ Good - Longer for important errors
toast.error(message, { duration: 5000 });

// ✓ Good - Default for simple errors
toast.error(message);
```

## Testing Error Handling

### Test Scenarios

#### 1. Therapist Conflict
```typescript
// Create session with therapist who has existing session
POST /api/v1/sessions
{
  "therapistId": "therapist-1",
  "scheduledDate": "2025-10-21T00:00:00.000Z",
  "startTime": "09:00",
  "endTime": "10:00"
}

// Expected: Toast with therapist conflict message
```

#### 2. Patient Conflict
```typescript
// Create session with patient who has existing session
POST /api/v1/sessions
{
  "patientId": "patient-1",
  "scheduledDate": "2025-10-21T00:00:00.000Z",
  "startTime": "09:00",
  "endTime": "10:00"
}

// Expected: Toast with patient conflict message
```

#### 3. Validation Error
```typescript
// Create session with end time before start time
POST /api/v1/sessions
{
  "startTime": "10:00",
  "endTime": "09:00"
}

// Expected: Toast with validation error message
```

## Error Message Mapping

| Error Code | User Message | Duration | Action |
|------------|-------------|----------|--------|
| `THERAPIST_SCHEDULING_CONFLICT` | "The therapist already has a session..." | 5000ms | Show conflict alert |
| `PATIENT_SCHEDULING_CONFLICT` | "The patient already has a session..." | 5000ms | Show conflict alert |
| `THERAPIST_NOT_AVAILABLE` | "The therapist is not available..." | 4000ms | Suggest different time |
| `VALIDATION_ERROR` | "Please check your input..." | 4000ms | Highlight fields |
| `INSUFFICIENT_CREDIT` | "Patient does not have sufficient credit..." | 4000ms | Show credit balance |
| `SESSION_NOT_FOUND` | "Session not found" | 3000ms | Redirect to list |

## Future Enhancements

### 1. Conflict Resolution UI
- Show available time slots
- Suggest alternative times
- Display therapist/patient schedule

### 2. Inline Validation
- Real-time conflict checking
- Availability preview
- Time slot suggestions

### 3. Enhanced Error Details
- Show conflicting session details
- Display time overlap visualization
- Provide quick reschedule options

### 4. Error Recovery
- Automatic retry for transient errors
- Offline queue for failed requests
- Optimistic updates with rollback

## Summary

The frontend error handling system provides:

✓ **Comprehensive error detection**
✓ **User-friendly messages**
✓ **Specific conflict handling**
✓ **Visual feedback**
✓ **Actionable suggestions**
✓ **Consistent experience**
✓ **Type-safe implementation**

All scheduling conflicts and validation errors are properly handled with clear, actionable messages for users.
