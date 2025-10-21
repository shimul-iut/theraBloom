# CORS Configuration Fix ✅

## Issue
CORS error when trying to login from frontend:
```
Access to XMLHttpRequest at 'http://localhost:3001/api/v1/auth/login' from origin 'http://localhost:3000' 
has been blocked by CORS policy: The value of the 'Access-Control-Allow-Origin' header in the response 
must not be the wildcard '*' when the request's credentials mode is 'include'.
```

## Root Cause
The backend was using wildcard `*` for CORS origin, but when using `credentials: true` (which we need for cookies), 
the CORS policy requires a specific origin to be set, not a wildcard.

## Solution
Updated `backend/src/server.ts` to specify the exact frontend origin:

```typescript
// CORS
app.use(
  cors({
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.FRONTEND_URL || 'http://localhost:3000'
      : 'http://localhost:3000',
    credentials: true,
  })
);
```

## What Changed
- **Before:** `origin: '*'` (wildcard)
- **After:** `origin: 'http://localhost:3000'` (specific origin)

## How to Apply
1. **Restart the backend server:**
   ```bash
   cd backend
   # Stop the server (Ctrl+C)
   npm run dev
   ```

2. **Test the login:**
   - Go to http://localhost:3000
   - Enter phone: `01712345678`
   - Enter password: `password123`
   - Click "Sign In"

## Environment Variables
For production, set the `FRONTEND_URL` environment variable:
```env
FRONTEND_URL=https://your-frontend-domain.com
```

## Verification
After restarting the backend, you should be able to:
- ✅ Login successfully
- ✅ See the dashboard
- ✅ Navigate through the app
- ✅ Logout and login again

## Additional Notes
- The `credentials: true` setting allows cookies to be sent with requests
- This is necessary for session management and CSRF protection
- In production, make sure to set the correct `FRONTEND_URL` environment variable
