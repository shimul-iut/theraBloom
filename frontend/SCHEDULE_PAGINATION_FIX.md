# Schedule Page Pagination Fix

## Problem
The schedule page was throwing an error:
```
TypeError: filteredSessions.filter is not a function
```

## Root Cause
Same issue as with the patients API - the backend returns paginated responses:

**Backend Response Format:**
```json
{
  "success": true,
  "data": {
    "sessions": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

**Frontend Expected Format:**
```json
{
  "success": true,
  "data": [...]
}
```

## Solution
Updated the hooks to extract the array from the paginated response:

### 1. use-sessions.ts
```typescript
queryFn: async () => {
  const response = await api.get(`/sessions?${queryParams.toString()}`);
  // Backend returns { sessions: [], pagination: {} }
  const data = response.data.data;
  return (data.sessions || data) as Session[];
},
```

### 2. use-therapists.ts
```typescript
queryFn: async () => {
  const response = await api.get('/users?role=THERAPIST');
  // Backend returns { users: [], pagination: {} }
  const data = response.data.data;
  return (data.users || data) as Therapist[];
},
```

## Files Changed
- `frontend/hooks/use-sessions.ts` - Extract sessions array from paginated response
- `frontend/hooks/use-therapists.ts` - Extract users array from paginated response

## Testing
1. Navigate to `/schedule`
2. Calendar should display without errors
3. Sessions should show on correct dates (if any exist)
4. Filters should work correctly
5. No "filter is not a function" errors

## Result
✅ Schedule page now works correctly with paginated backend responses
✅ Consistent with the fix applied to patient management
