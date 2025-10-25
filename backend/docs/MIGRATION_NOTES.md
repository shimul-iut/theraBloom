# Database Migration: Remove Email, Use Phone Number Only

## Changes Made

### Schema Changes (schema.prisma)
- **Removed**: `email` field from User model
- **Modified**: `phoneNumber` field is now required (not optional)
- **Removed**: `@@unique([tenantId, email])` constraint
- **Kept**: `@@unique([tenantId, phoneNumber])` constraint

### Code Changes
1. **Authentication** (`auth.schema.ts`, `auth.service.ts`, `auth.controller.ts`)
   - Login now accepts `phoneNumber` instead of `identifier` (email or phone)
   - JWT payload now contains `phoneNumber` instead of `email`
   - All error messages updated to reference phone number

2. **User Management** (`users.schema.ts`, `users.service.ts`, `users.controller.ts`)
   - `createUserSchema` now requires `phoneNumber` (removed `email`)
   - `updateUserSchema` updated to only handle `phoneNumber`
   - All validation checks now use phone number
   - Removed email uniqueness checks

3. **Middleware & Types** (`auth.ts`, `express.d.ts`)
   - Request user object now has `phoneNumber` instead of `email`
   - JWT verification updated to use phone number

4. **Seed Data** (`seed.ts`)
   - Updated to use `tenantId_phoneNumber` unique constraint
   - Removed email fields from user creation
   - Updated demo credentials output

## Migration Steps

### 1. Generate Prisma Migration
```bash
cd backend
npx prisma migrate dev --name remove_email_use_phone_only
```

This will:
- Drop the `User_tenantId_email_key` unique constraint
- Drop the `email` column from the `User` table
- Make `phoneNumber` NOT NULL
- Keep the `User_tenantId_phoneNumber_key` unique constraint

### 2. Regenerate Prisma Client
```bash
npx prisma generate
```

### 3. Reset Database (Development Only)
If you want to start fresh with the new schema:
```bash
npx prisma migrate reset
```

This will:
- Drop the database
- Run all migrations
- Run the seed script with new phone-only users

### 4. Update Existing Data (Production)
If you have existing data, you'll need a data migration script to:
1. Ensure all users have phone numbers
2. Handle any users without phone numbers (assign default or prompt for input)

## Testing

### Login Request Format (OLD)
```json
{
  "identifier": "admin@example.com",
  "password": "password123"
}
```

### Login Request Format (NEW)
```json
{
  "phoneNumber": "01712345678",
  "password": "password123"
}
```

### Demo Credentials
- Admin: `01712345678` / `password123`
- Operator: `01812345678` / `password123`
- Therapist: `01912345678` / `password123`
- Accountant: `01612345678` / `password123`

## Rollback Plan

If you need to rollback:
1. Revert the schema.prisma changes
2. Run `npx prisma migrate dev` to create a new migration
3. Revert all code changes
4. Regenerate Prisma client

## Notes

- Phone numbers must be 11 digits starting with '01' (Bangladesh format)
- All phone numbers are validated using regex: `^01\d{9}$`
- Phone numbers are unique per tenant
- Guardian emails in Patient model are unchanged (optional field)
