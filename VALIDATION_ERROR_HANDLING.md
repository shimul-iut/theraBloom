# Validation Error Handling

## Overview

The system now properly handles validation errors with detailed feedback to help users understand what went wrong.

## Backend Changes

### Enhanced Controller Validation

All session controller methods now use `safeParse()` instead of `parse()` to provide better error handling:

```typescript
// Before (throws exception)
const input = createSessionSchema.parse(req.body);

// After (returns validation result)
const validationResult = createSessionSchema.safeParse(req.body);

if (!validationResult.success) {
  return res.status(400).json({
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: validationResult.error.errors,
    },
  });
}

const input = validationResult.data;
```

### Validation Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "validation": "uuid",
        "code": "invalid_string",
        "message": "Invalid ID format",
        "path": ["patientId"]
      },
      {
        "validation": "uuid",
        "code": "invalid_string",
        "message": "Invalid ID format",
        "path": ["therapistId"]
      }
    ]
  }
}
```

## Common Validation Errors

### 1. Invalid UUID Format

**Error:**
```json
{
  "validation": "uuid",
  "code": "invalid_string",
  "message": "Invalid ID format",
  "path": ["patientId"]
}
```

**Cause:**
- Empty string sent as ID
- Non-UUID string sent as ID
- Undefined/null value

**Solution:**
- Ensure all ID fields are valid UUIDs
- Check that form fields are properly populated
- Validate IDs before sending to API

### 2. Invalid Time Format

**Error:**
```json
{
  "code": "invalid_string",
  "message": "Invalid time format (HH:MM)",
  "path": ["startTime"]
}
```

**Cause:**
- Time not in HH:MM format
- Invalid time values (e.g., 25:00)

**Solution:**
- Use HTML time input type
- Validate time format before submission

### 3. End Time Before Start Time

**Error:**
```json
{
  "message": "End time must be after start time",
  "path": ["endTime"]
}
```

**Cause:**
- End time is before or equal to start time

**Solution:**
- Calculate end time based on duration
- Validate time range before submission

### 4. Scheduling in the Past

**Error:**
```json
{
  "message": "Cannot schedule sessions in the past",
  "path": ["scheduledDate"]
}
```

**Cause:**
- Selected date is before today

**Solution:**
- Set minimum date to today
- Validate date before submission

### 5. Missing Required Fields

**Error:**
```json
{
  "code": "invalid_type",
  "message": "Required",
  "path": ["patientId"]
}
```

**Cause:**
- Required field not provided

**Solution:**
- Ensure all required fields are filled
- Add form validation

## Frontend Handling

### Error Detection

The frontend error handler detects validation errors:

```typescript
export function isValidationError(error: any): boolean {
  const apiError = extractApiError(error);
  return apiError.code === 'VALIDATION_ERROR' || apiError.code === 'INVALID_INPUT';
}
```

### Error Display

Validation errors are displayed with details:

```typescript
if (isValidationError(error)) {
  const errors = getValidationErrors(error);
  // Display field-specific errors
  errors.forEach(err => {
    toast.error(`${err.path.join('.')}: ${err.message}`);
  });
} else {
  toast.error(formatErrorForDisplay(error));
}
```

## Form Validation

### Client-Side Validation

Add validation to forms before submission:

```typescript
const validateForm = (data: CreateSessionInput): string[] => {
  const errors: string[] = [];
  
  if (!data.patientId) {
    errors.push('Patient is required');
  }
  
  if (!data.therapistId) {
    errors.push('Therapist is required');
  }
  
  if (!data.therapyTypeId) {
    errors.push('Therapy type is required');
  }
  
  if (!data.startTime || !data.endTime) {
    errors.push('Start and end times are required');
  }
  
  if (data.startTime >= data.endTime) {
    errors.push('End time must be after start time');
  }
  
  return errors;
};
```

### Form Submission

```typescript
const handleSubmit = async (data: CreateSessionInput) => {
  // Client-side validation
  const errors = validateForm(data);
  
  if (errors.length > 0) {
    errors.forEach(error => toast.error(error));
    return;
  }
  
  // Submit to API
  try {
    await createSession.mutateAsync(data);
  } catch (error) {
    // Error handler will display appropriate message
  }
};
```

## Debugging Validation Errors

### 1. Check Request Payload

Log the data being sent:

```typescript
console.log('Submitting session data:', data);
```

### 2. Verify ID Formats

Ensure all IDs are valid UUIDs:

```typescript
const isValidUUID = (id: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

console.log('Patient ID valid:', isValidUUID(data.patientId));
console.log('Therapist ID valid:', isValidUUID(data.therapistId));
```

### 3. Check Form State

Verify form values before submission:

```typescript
const formValues = watch();
console.log('Current form values:', formValues);
```

### 4. Inspect API Response

Check the full error response:

```typescript
onError: (error: any) => {
  console.error('Full error:', error);
  console.error('Response data:', error.response?.data);
}
```

## Best Practices

### 1. Always Validate on Both Sides

```typescript
// Client-side (UX)
if (!data.patientId) {
  toast.error('Please select a patient');
  return;
}

// Server-side (Security)
const validationResult = createSessionSchema.safeParse(req.body);
if (!validationResult.success) {
  return res.status(400).json({ error: ... });
}
```

### 2. Provide Clear Error Messages

```typescript
// ✓ Good
"Patient is required"
"Invalid time format (HH:MM)"
"End time must be after start time"

// ✗ Bad
"Validation failed"
"Invalid input"
"Error"
```

### 3. Use Appropriate Input Types

```tsx
// ✓ Good
<input type="date" />
<input type="time" />
<select> for dropdowns

// ✗ Bad
<input type="text" /> for dates/times
```

### 4. Disable Submit When Invalid

```tsx
<Button 
  type="submit" 
  disabled={!isValid || isLoading}
>
  Create Session
</Button>
```

### 5. Show Field-Level Errors

```tsx
{errors.patientId && (
  <p className="text-sm text-red-500">
    {errors.patientId.message}
  </p>
)}
```

## Testing Validation

### Test Case 1: Empty IDs

```typescript
POST /api/v1/sessions
{
  "patientId": "",
  "therapistId": "",
  "therapyTypeId": "",
  "scheduledDate": "2025-10-25T00:00:00.000Z",
  "startTime": "09:00",
  "endTime": "10:00"
}

// Expected: 400 with validation errors for all IDs
```

### Test Case 2: Invalid Time Format

```typescript
POST /api/v1/sessions
{
  "patientId": "valid-uuid",
  "therapistId": "valid-uuid",
  "therapyTypeId": "valid-uuid",
  "scheduledDate": "2025-10-25T00:00:00.000Z",
  "startTime": "9:00 AM",  // Invalid format
  "endTime": "10:00 AM"    // Invalid format
}

// Expected: 400 with time format errors
```

### Test Case 3: End Time Before Start Time

```typescript
POST /api/v1/sessions
{
  "patientId": "valid-uuid",
  "therapistId": "valid-uuid",
  "therapyTypeId": "valid-uuid",
  "scheduledDate": "2025-10-25T00:00:00.000Z",
  "startTime": "10:00",
  "endTime": "09:00"  // Before start time
}

// Expected: 400 with end time validation error
```

## Summary

The validation error handling system now provides:

✓ **Detailed error messages** with field paths
✓ **Proper HTTP status codes** (400 for validation errors)
✓ **Structured error responses** with details array
✓ **Client-side validation** for better UX
✓ **Server-side validation** for security
✓ **Clear debugging information** in console
✓ **User-friendly error display** in UI

All validation errors are now properly caught and displayed to users with actionable feedback.

---

**Updated:** October 21, 2025
**Status:** ✓ Complete
