# Phone Number Login Feature

## Overview
Added support for user login using phone numbers in addition to email addresses. Phone numbers must follow Bangladesh format: 11 digits starting with '01'.

## Changes Made

### 1. Database Schema (Prisma)
- Added `phoneNumber` field to `User` model (optional, TEXT type)
- Added unique constraint on `[tenantId, phoneNumber]`
- Added index on `[tenantId, phoneNumber]` for query performance
- Migration: `20251019080145_add_phone_number_to_user`

### 2. Authentication Schema (`backend/src/modules/auth/auth.schema.ts`)
- Changed `loginSchema` to accept `identifier` instead of `email`
- Added phone number validation regex: `/^01\d{9}$/`
- Added custom refinement to validate identifier as either email or phone
- Added `isPhoneNumber()` helper function

### 3. Authentication Service (`backend/src/modules/auth/auth.service.ts`)
- Updated `login()` method to accept `identifier` (email or phone)
- Added logic to detect if identifier is phone or email
- Query user by `phoneNumber` or `email` based on identifier type
- Changed error messages to generic "Invalid credentials" for security

### 4. User Schema (`backend/src/modules/users/users.schema.ts`)
- Added `phoneNumber` field to `createUserSchema` (optional)
- Added `phoneNumber` field to `updateUserSchema` (optional)
- Phone validation: 11 digits starting with '01'

### 5. User Service (`backend/src/modules/users/users.service.ts`)
- Updated `createUser()` to handle phone number
- Added duplicate phone number check during user creation
- Updated `updateUser()` to handle phone number updates
- Added duplicate phone number check during updates
- Added `phoneNumber` to all user select statements

## Phone Number Format
- **Length**: Exactly 11 digits
- **Pattern**: Must start with '01'
- **Examples**: 
  - Valid: `01712345678`, `01812345678`, `01912345678`
  - Invalid: `1712345678` (missing 0), `0171234567` (too short), `017123456789` (too long)

## API Usage

### Login with Email
```json
POST /api/auth/login
{
  "identifier": "user@example.com",
  "password": "password123"
}
```

### Login with Phone
```json
POST /api/auth/login
{
  "identifier": "01712345678",
  "password": "password123"
}
```

### Create User with Phone
```json
POST /api/users
{
  "email": "user@example.com",
  "phoneNumber": "01712345678",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "THERAPIST"
}
```

## Database Migration
To apply the migration:
```bash
cd backend
npx prisma migrate dev
```

To regenerate Prisma client:
```bash
npx prisma generate
```

## Security Considerations
- Phone numbers are unique per tenant (multi-tenant isolation maintained)
- Generic error messages prevent user enumeration
- Phone number is optional - users can be created with just email
- Both email and phone can be used for the same user account

## Testing
After restarting the backend server, test the following scenarios:
1. Login with existing email
2. Login with phone number (after adding phone to user)
3. Create new user with phone number
4. Update user to add/change phone number
5. Attempt duplicate phone number (should fail)
6. Invalid phone format (should fail validation)
