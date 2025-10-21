# DataTable Not Loading Fix

## Problem
The API endpoint `http://localhost:3000/api/v1/patients` was returning data successfully, but the DataTable in the UI wasn't showing any patients.

## Root Cause
**Backend Response Format:**
```json
{
  "success": true,
  "data": {
    "patients": [
      { "id": "...", "firstName": "Emma", ... },
      { "id": "...", "firstName": "Liam", ... }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 2,
      "totalPages": 1
    }
  }
}
```

**Frontend Expected Format:**
```json
{
  "success": true,
  "data": [
    { "id": "...", "firstName": "Emma", ... },
    { "id": "...", "firstName": "Liam", ... }
  ]
}
```

The hook was trying to use `response.data.data` as an array, but it was actually an object with `patients` and `pagination` properties.

## Solution
Updated `frontend/hooks/use-patients.ts` to extract the `patients` array:

```typescript
export function usePatients() {
    return useQuery({
        queryKey: ['patients'],
        queryFn: async () => {
            const response = await api.get('/patients');
            // Backend returns { patients: [], pagination: {} }
            const data = response.data.data;
            return (data.patients || data) as Patient[];
        },
    });
}
```

The fix:
1. ✅ Extracts `patients` array from the response object
2. ✅ Falls back to `data` directly for backward compatibility
3. ✅ DataTable now receives the correct array format

## Testing
1. Navigate to `/patients` page
2. You should now see the patient list with Emma Johnson and Liam Smith
3. Search, sort, and pagination should all work correctly

## Files Changed
- `frontend/hooks/use-patients.ts` - Fixed response parsing
