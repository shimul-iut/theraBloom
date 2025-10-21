# Phone Number Authentication - Complete Changes Summary

## Overview
Removed email-based authentication entirely and switched to phone number-only authentication system.

## Files Modified

### 1. Database Schema
**File**: `backend/prisma/schema.prisma`
- Removed `email` field from User model
- Changed `phoneNumber` from optional (`String?`) to required (`String`)
- Removed `@@unique([tenantId, email])` constraint
- Kept `@@unique([tenantId, phoneNumber])` for phone uniqueness per tenant

### 2. Authentication Module

#### `backend/src/modules/auth/auth.schema.ts`
- Simplified login schema to accept only `phoneNumber` and `password`
- Removed email validation logic
- Removed `isPhoneNumber` helper function (no longer needed)
- Phone validation: 11 digits starting with '01' (Bangladesh format)

#### `backend/src/modules/auth/auth.service.ts`
- Updated `login()` to find users by phone number only
- Changed JWT payload to include `phoneNumber` instead of `email`
- Updated `refreshToken()` to use phone number in payload
- Updated `getCurrentUser()` to return phone number
- Fixed Prisma query to not mix `include` and `select`

#### `backend/src/modules/auth/auth.controller.ts`
- Updated error messages to reference phone number
- Changed logging to use phone number instead of email

### 3. User Management Module

#### `backend/src/modules/users/users.schema.ts`
- Removed `email` field from `createUserSchema`
- Made `phoneNumber` required (not optional)
- Removed `email` field from `updateUserSchema`
- Exported `phoneNumberSchema` for reuse

#### `backend/src/modules/users/users.service.ts`
- Removed email uniqueness checks in `createUser()`
- Removed email duplicate checks in `updateUser()`
- Updated all select statements to exclude email
- Changed error messages from "Email already exists" to "Phone number already exists"

#### `backend/src/modules/users/users.controller.ts`
- Updated error codes from `EMAIL_EXISTS` to `PHONE_EXISTS`
- Changed all logging to use phone number instead of email

### 4. JWT & Authentication Middleware

#### `backend/src/utils/jwt.ts`
- Changed `JWTPayload` interface: `email: string` → `phoneNumber: string`

#### `backend/src/middleware/auth.ts`
- Updated request user object to include `phoneNumber` instead of `email`
- Both `authenticate()` and `optionalAuthenticate()` updated

#### `backend/src/types/express.d.ts`
- Updated Express Request type definition
- Changed user object property from `email` to `phoneNumber`

### 5. Other Modules

#### `backend/src/modules/patients/patients.controller.ts`
- Updated logging to use `req.user?.phoneNumber` instead of `req.user?.email`
- Note: Patient guardian emails remain unchanged (optional field)

### 6. Seed Data

#### `backend/prisma/seed.ts`
- Changed upsert queries to use `tenantId_phoneNumber` constraint
- Removed `email` field from all user creation
- Updated demo credentials output to show phone numbers only

## API Changes

### Login Endpoint: `POST /api/v1/auth/login`

**Before:**
```json
{
  "identifier": "admin@example.com",
  "password": "password123"
}
```

**After:**
```json
{
  "phoneNumber": "01712345678",
  "password": "password123"
}
```

### Create User Endpoint: `POST /api/v1/users`

**Before:**
```json
{
  "email": "user@example.com",
  "phoneNumber": "01712345678",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "THERAPIST"
}
```

**After:**
```json
{
  "phoneNumber": "01712345678",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "THERAPIST"
}
```

### Update User Endpoint: `PUT /api/v1/users/:id`

**Before:**
```json
{
  "email": "newemail@example.com",
  "phoneNumber": "01712345678",
  "firstName": "John"
}
```

**After:**
```json
{
  "phoneNumber": "01712345678",
  "firstName": "John"
}
```

## Response Changes

### User Object in Responses

**Before:**
```json
{
  "id": "...",
  "email": "admin@example.com",
  "phoneNumber": "01712345678",
  "firstName": "Admin",
  "lastName": "User",
  "role": "WORKSPACE_ADMIN"
}
```

**After:**
```json
{
  "id": "...",
  "phoneNumber": "01712345678",
  "firstName": "Admin",
  "lastName": "User",
  "role": "WORKSPACE_ADMIN"
}
```

### JWT Payload

**Before:**
```json
{
  "userId": "...",
  "tenantId": "...",
  "role": "WORKSPACE_ADMIN",
  "email": "admin@example.com"
}
```

**After:**
```json
{
  "userId": "...",
  "tenantId": "...",
  "role": "WORKSPACE_ADMIN",
  "phoneNumber": "01712345678"
}
```

## Validation Rules

### Phone Number Format
- **Pattern**: `^01\d{9}$`
- **Length**: Exactly 11 digits
- **Prefix**: Must start with '01'
- **Example**: `01712345678`

### Error Messages
- Invalid format: "Phone number must be 11 digits starting with 01"
- Duplicate: "Phone number already exists"
- Invalid credentials: "Invalid phone number or password"

## Migration Required

After these code changes, you need to:

1. **Generate migration**:
   ```bash
   cd backend
   npx prisma migrate dev --name remove_email_use_phone_only
   ```

2. **Regenerate Prisma client**:
   ```bash
   npx prisma generate
   ```

3. **Reset database** (development):
   ```bash
   npx prisma migrate reset
   ```

## Demo Credentials (After Migration)

| Role       | Phone Number  | Password     |
|------------|---------------|--------------|
| Admin      | 01712345678   | password123  |
| Operator   | 01812345678   | password123  |
| Therapist  | 01912345678   | password123  |
| Accountant | 01612345678   | password123  |

## Breaking Changes

⚠️ **This is a breaking change for any existing clients!**

1. Login endpoint now requires `phoneNumber` instead of `identifier`
2. User creation/update no longer accepts `email` field
3. All user responses no longer include `email` field
4. JWT tokens now contain `phoneNumber` instead of `email`

## Notes

- Patient guardian emails are **NOT** affected (they remain optional)
- Notification system still supports email notifications (for guardians)
- Only User authentication is changed to phone-only
- All phone numbers are validated for Bangladesh format
- Phone numbers are unique per tenant (multi-tenant isolation maintained)
