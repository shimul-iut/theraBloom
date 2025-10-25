# Token Storage Fix

## Problem
The `/patients` page was logging users out immediately after login because the access token was being stored as the string `"undefined"` instead of the actual JWT token value.

## Root Cause
**Backend Response Format:**
```json
{
  "success": true,
  "data": {
    "user": {...},
    "tokens": {
      "accessToken": "actual-jwt-token",
      "refreshToken": "actual-refresh-token"
    }
  }
}
```

**Frontend Expected Format:**
```json
{
  "success": true,
  "data": {
    "user": {...},
    "accessToken": "actual-jwt-token",
    "refreshToken": "actual-refresh-token"
  }
}
```

The frontend was trying to access `data.accessToken` and `data.refreshToken` directly, but they were nested inside `data.tokens`.

## Solution
Updated `frontend/lib/auth.ts` to handle the nested tokens object:

```typescript
// Handle nested tokens object from backend
const accessToken = data.tokens?.accessToken || data.accessToken;
const refreshToken = data.tokens?.refreshToken || data.refreshToken;
```

This fix:
1. ✅ Checks for tokens in the nested `tokens` object first
2. ✅ Falls back to direct properties for backward compatibility
3. ✅ Properly stores actual JWT tokens instead of "undefined"

## Testing
1. Clear localStorage: Click "Clear Everything & Re-login" on `/debug` page
2. Login with: `01712345678` / `password123`
3. Check `/debug` page - tokens should show actual JWT values (not "undefined...")
4. Navigate to `/patients` - should stay logged in and show patient list

## Files Changed
- `frontend/lib/auth.ts` - Fixed token extraction from login response
- `frontend/app/debug/page.tsx` - Enhanced debug output to detect "undefined" tokens
