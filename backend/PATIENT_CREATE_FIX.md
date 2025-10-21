# Patient Creation Date Format Fix

## Problem
Creating a new patient was failing with error:
```json
{
  "error": {
    "code": "CREATE_PATIENT_FAILED",
    "message": "Failed to create patient"
  }
}
```

## Root Cause
The backend schema validation expected `dateOfBirth` in full datetime format:
```
"2016-09-14T00:00:00.000Z"
```

But the frontend HTML date input sends just a date string:
```
"2016-09-14"
```

This caused Zod validation to fail with the `.datetime()` validator.

## Solution
Updated `backend/src/modules/patients/patients.schema.ts` to accept both formats:

```typescript
dateOfBirth: z.string().refine((date) => {
  // Accept both date strings (YYYY-MM-DD) and datetime strings
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const datetimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
  return dateRegex.test(date) || datetimeRegex.test(date);
}, 'Invalid date format')
```

Also improved error handling in the controller to show validation errors:
```typescript
// Handle Zod validation errors
if (error instanceof Error && error.name === 'ZodError') {
  return res.status(400).json({
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: error.message,
    },
  });
}
```

## Testing
1. Navigate to `/patients` page
2. Click "Add Patient" button
3. Fill in the form with:
   - First Name: Sameen
   - Last Name: An Naziah
   - Date of Birth: 2016-09-14
   - Guardian Name: Anik Islam
   - Guardian Phone: 01819458461
   - Address: Moghbazar Doctor Goli
4. Submit - should now create successfully!

## Files Changed
- `backend/src/modules/patients/patients.schema.ts` - Updated date validation
- `backend/src/modules/patients/patients.controller.ts` - Improved error handling
