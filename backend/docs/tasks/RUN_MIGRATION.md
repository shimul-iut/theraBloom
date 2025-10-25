# Quick Migration Guide: Email to Phone Number Authentication

## ⚠️ Important: Existing Data

If you have existing users in your database, you have two options:

### Option A: Fresh Start (Recommended for Development)

```bash
cd backend

# Reset database completely
npx prisma migrate reset

# This will drop everything and start fresh with phone-only users
```

### Option B: Preserve Existing Data

See `MIGRATION_FIX.md` for detailed instructions on handling existing users.

## Step-by-Step Instructions

### 1. Generate and Apply Migration

```bash
cd backend

# Generate the migration
npx prisma migrate dev --name remove_email_use_phone_only

# This will:
# - Create a new migration file
# - Apply it to your database
# - Regenerate the Prisma client automatically
```

**Note:** If you get an error about NULL phone numbers, use Option A above or see `MIGRATION_FIX.md`.

### 2. Verify Migration

Check that the migration was successful:

```bash
# View the database schema
npx prisma studio

# Or check via CLI
npx prisma db pull
```

### 3. Seed the Database

```bash
# Run the seed script to create demo users
npx prisma db seed
```

Expected output:
```
🌱 Starting database seed...
✅ Created tenant: Demo Therapy Center
✅ Created users: Admin, Operator, Therapist, Accountant
✅ Created therapy types: Physical, Occupational, Speech
✅ Created therapist availability schedules
✅ Created therapist-specific pricing
✅ Created sample patients: Emma, Liam
✅ Created sample session
🎉 Database seed completed successfully!

📝 Demo Credentials (Phone Number):
   Admin:      01712345678 / password123
   Operator:   01812345678 / password123
   Therapist:  01912345678 / password123
   Accountant: 01612345678 / password123
```

### 4. Test the Changes

Start your backend server:

```bash
npm run dev
```

Test login with phone number:

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "01712345678",
    "password": "password123"
  }'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "phoneNumber": "01712345678",
      "firstName": "Admin",
      "lastName": "User",
      "role": "WORKSPACE_ADMIN",
      "tenantId": "...",
      "tenantName": "Demo Therapy Center"
    },
    "tokens": {
      "accessToken": "...",
      "refreshToken": "..."
    }
  }
}
```

## Alternative: Fresh Start (Development Only)

If you want to completely reset your database:

```bash
cd backend

# This will drop the database, run all migrations, and seed
npx prisma migrate reset

# Confirm when prompted
```

## Troubleshooting

### Error: "email" column doesn't exist

If you see Prisma errors about the email column:

```bash
# Regenerate Prisma client
npx prisma generate

# Restart your dev server
npm run dev
```

### Error: Migration failed

If the migration fails due to existing data:

1. **Development**: Use `npx prisma migrate reset` to start fresh
2. **Production**: You'll need to handle existing data:
   - Ensure all users have phone numbers
   - Create a data migration script if needed

### Error: Phone number validation fails

Make sure phone numbers follow Bangladesh format:
- Must be exactly 11 digits
- Must start with '01'
- Example: `01712345678`

## Verification Checklist

After migration, verify:

- [ ] Database schema updated (no email column in User table)
- [ ] Prisma client regenerated
- [ ] Seed script runs successfully
- [ ] Login works with phone number
- [ ] User creation works without email
- [ ] JWT tokens contain phoneNumber
- [ ] All API responses exclude email field

## Need Help?

Check these files for details:
- `PHONE_AUTH_CHANGES.md` - Complete list of changes
- `MIGRATION_NOTES.md` - Technical migration details
- `prisma/migrations/` - Generated migration files

## Rollback (If Needed)

If you need to rollback:

```bash
# Revert to previous migration
npx prisma migrate resolve --rolled-back <migration-name>

# Or reset and restore from backup
npx prisma migrate reset
# Then restore your database backup
```
