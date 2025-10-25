# Run Migration for Single Specialization

## Steps to Apply Changes

### 1. Generate Prisma Migration
```bash
cd backend
npx prisma migrate dev --name add_therapist_specialization
```

This will:
- Create a new migration file
- Apply the migration to your database
- Add the `specialization`, `sessionDuration`, and `sessionCost` columns to the User table

### 2. Generate Prisma Client
```bash
npx prisma generate
```

This will regenerate the Prisma client with the new schema fields.

### 3. Run Seed Script
```bash
npm run prisma:seed
```

This will populate the database with therapists that have single specializations.

### 4. Restart Backend Server
```bash
npm run dev
```

### 5. Restart Frontend Server
```bash
cd ../frontend
npm run dev
```

## Verification

After running the migration:

1. **Check Database**
   - User table should have new columns: `specialization`, `sessionDuration`, `sessionCost`

2. **Check Seed Data**
   - John Smith should have specialization="Physical Therapy", sessionDuration=60, sessionCost=60
   - Sarah Williams should have specialization="Speech Therapy", sessionDuration=30, sessionCost=45
   - Michael Brown should have specialization="Occupational Therapy", sessionDuration=45, sessionCost=48

3. **Test Frontend**
   - Navigate to `/therapists`
   - Verify specialization column shows single therapy type
   - Verify pricing column shows single price/duration
   - Click "Add Therapist" and verify dropdown for specialization
   - Create a new therapist and verify it saves correctly

## Troubleshooting

### If migration fails:
```bash
# Reset database (WARNING: This will delete all data)
npx prisma migrate reset

# Then run seed again
npm run prisma:seed
```

### If Prisma client errors persist:
```bash
# Clean and regenerate
rm -rf node_modules/.prisma
npx prisma generate
```

### If TypeScript errors in seed file:
The errors will disappear after running `npx prisma generate` which updates the Prisma client types.

## What Changed

- **Schema**: Added 3 new fields to User model
- **Seed**: Therapists now created with single specialization
- **Backend**: Simplified queries (no more joins)
- **Frontend**: Single dropdown instead of multiple checkboxes
- **UI**: Cleaner, simpler forms and displays

## Next Steps

After migration is complete:
1. Test creating a new therapist
2. Test editing an existing therapist
3. Test creating a session (verify auto-fill works)
4. Verify all therapist pages display correctly
