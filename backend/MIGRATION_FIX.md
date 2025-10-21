# Migration Fix: Handling Existing NULL Phone Numbers

## Problem
The migration failed because there are 4 existing users with NULL phone numbers in the database.

## Solution Options

### Option 1: Reset Database (Recommended for Development)

This is the cleanest approach if you're in development and don't need to preserve existing data:

```bash
cd backend

# Drop everything and start fresh
npx prisma migrate reset

# This will:
# - Drop the database
# - Run all migrations
# - Run the seed script with new phone-only users
```

### Option 2: Two-Step Migration (For Production or Preserving Data)

If you need to keep existing data, follow these steps:

#### Step 1: Update existing users with phone numbers

First, manually update the existing users to have phone numbers:

```bash
# Connect to your database
# For PostgreSQL:
psql -U your_username -d your_database_name

# Run this SQL to update existing users:
UPDATE "User" 
SET "phoneNumber" = '0171234567' || "id"::text 
WHERE "phoneNumber" IS NULL;

# This generates unique phone numbers for existing users
# You should replace these with real phone numbers later
```

Or use Prisma Studio:

```bash
npx prisma studio
```

Then manually edit each user to add a phone number.

#### Step 2: Run the migration again

```bash
npx prisma migrate dev --name remove_email_use_phone_only
```

### Option 3: Create a Data Migration Script

Create a script to handle the data migration:

```bash
# Create the script
touch backend/scripts/migrate-phone-numbers.ts
```

Add this content to `backend/scripts/migrate-phone-numbers.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Migrating users without phone numbers...');

  // Find users without phone numbers
  const usersWithoutPhone = await prisma.user.findMany({
    where: {
      phoneNumber: null,
    },
  });

  console.log(`Found ${usersWithoutPhone.length} users without phone numbers`);

  // Update each user with a temporary phone number
  for (const user of usersWithoutPhone) {
    const tempPhone = `0199999${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
    
    await prisma.user.update({
      where: { id: user.id },
      data: { phoneNumber: tempPhone },
    });

    console.log(`✅ Updated user ${user.email} with temp phone: ${tempPhone}`);
  }

  console.log('✅ Migration complete!');
  console.log('⚠️  Please update these users with real phone numbers');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Run the script:

```bash
npx ts-node backend/scripts/migrate-phone-numbers.ts
```

Then run the migration:

```bash
npx prisma migrate dev --name remove_email_use_phone_only
```

## Recommended Approach

**For Development Environment:**
```bash
npx prisma migrate reset
```

**For Production Environment:**
1. Backup your database first
2. Use Option 2 or 3 to update existing users
3. Run the migration
4. Update users with real phone numbers

## After Migration

Once the migration succeeds, verify:

```bash
# Check the schema
npx prisma studio

# Test login with phone number
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "01712345678",
    "password": "password123"
  }'
```

## Quick Fix Command

If you just want to get it working quickly in development:

```bash
cd backend && npx prisma migrate reset && npm run dev
```

This will:
1. Drop and recreate the database
2. Apply all migrations
3. Seed with demo users
4. Start the server
