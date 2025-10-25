# 🔧 Fix: Unavailability Feature Database Error

## Error
```
Cannot read properties of undefined (reading 'findMany')
```

## Root Cause
The Prisma client hasn't been regenerated after adding the `TherapistUnavailability` model to the schema. The migration file exists, but the TypeScript types haven't been generated yet.

## Solution

Run these commands in the `backend` directory:

### Step 1: Generate Prisma Client
```bash
cd backend
npx prisma generate
```

This will regenerate the Prisma client with the new `TherapistUnavailability` model.

### Step 2: Run Migrations (if not already applied)
```bash
npx prisma migrate deploy
```

Or if you're in development:
```bash
npx prisma migrate dev
```

### Step 3: Restart the Backend Server
```bash
npm run dev
```

## Verification

After running the commands, verify the fix:

1. **Check Prisma Client Types**
   ```bash
   # The file should exist
   ls node_modules/.prisma/client/index.d.ts
   ```

2. **Test the API**
   ```bash
   curl http://localhost:3000/api/v1/therapists/{therapistId}/unavailability
   ```
   
   Should return:
   ```json
   {
     "success": true,
     "data": []
   }
   ```

3. **Check in UI**
   - Navigate to a therapist detail page
   - The "Unavailability Periods" section should load without errors
   - You should see "No unavailability periods set" message

## Alternative: Reset Database (Development Only)

If you're in development and want a clean slate:

```bash
cd backend

# Reset database (WARNING: This deletes all data!)
npx prisma migrate reset

# This will:
# 1. Drop the database
# 2. Create a new database
# 3. Run all migrations
# 4. Generate Prisma client
```

## Quick Fix Script

Create a file `backend/fix-prisma.sh`:

```bash
#!/bin/bash
echo "🔧 Fixing Prisma client..."

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

echo "✅ Done! Restart your server."
```

Make it executable and run:
```bash
chmod +x fix-prisma.sh
./fix-prisma.sh
```

## For Windows (PowerShell)

Create `backend/fix-prisma.ps1`:

```powershell
Write-Host "🔧 Fixing Prisma client..." -ForegroundColor Yellow

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

Write-Host "✅ Done! Restart your server." -ForegroundColor Green
```

Run:
```powershell
.\fix-prisma.ps1
```

## Expected Output

After running `npx prisma generate`, you should see:

```
✔ Generated Prisma Client (5.x.x) to ./node_modules/@prisma/client in XXXms

Start using Prisma Client in Node.js (See: https://pris.ly/d/client)
```

The client should now include:
- `prisma.therapistUnavailability.findMany()`
- `prisma.therapistUnavailability.findUnique()`
- `prisma.therapistUnavailability.create()`
- `prisma.therapistUnavailability.update()`
- `prisma.therapistUnavailability.delete()`

## Troubleshooting

### Issue: "Migration already applied"
This is fine. It means the database schema is up to date.

### Issue: "Database connection error"
Make sure your database is running and the connection string in `.env` is correct.

### Issue: Still getting the error after regenerating
1. Stop the backend server completely
2. Delete `node_modules/.prisma` folder
3. Run `npx prisma generate` again
4. Restart the server

### Issue: TypeScript errors in IDE
1. Restart your TypeScript server in VS Code: `Cmd/Ctrl + Shift + P` → "TypeScript: Restart TS Server"
2. Or restart your IDE

## Prevention

To avoid this in the future, always run these commands after modifying `schema.prisma`:

```bash
# 1. Generate client
npx prisma generate

# 2. Create migration (development)
npx prisma migrate dev --name your_migration_name

# 3. Or apply migrations (production)
npx prisma migrate deploy
```

## Summary

The error occurs because:
1. ✅ Schema has the model defined
2. ✅ Migration file exists
3. ❌ Prisma client not regenerated
4. ❌ TypeScript types not available

**Solution**: Run `npx prisma generate` in the backend directory.

---

**Status**: Ready to fix  
**Time to fix**: ~1 minute  
**Risk**: None (just regenerating types)
