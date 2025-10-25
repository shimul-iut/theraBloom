# How to Open Prisma Studio NOW

## Quick Command

Open your terminal and run:

```bash
cd backend
npm run prisma:studio
```

**OR**

```bash
cd backend
npx prisma studio
```

## What Will Happen

1. Terminal will show:
   ```
   Environment variables loaded from .env
   Prisma schema loaded from prisma/schema.prisma
   Prisma Studio is up on http://localhost:5555
   ```

2. Your browser will automatically open to: **http://localhost:5555**

3. You'll see the Prisma Studio interface with all your tables!

## If Browser Doesn't Open Automatically

Manually open your browser and go to:
```
http://localhost:5555
```

## What You'll See

### Left Sidebar (Tables):
- Tenant
- User  
- Patient
- TherapyType
- TherapistAvailability
- TherapistPricing
- Session
- SessionPayment
- Payment
- ProgressReport
- RescheduleRequest
- Notification
- Expense
- AuditLog

### Main Area:
- Click any table to see its data
- View, edit, create, delete records
- See relationships between tables

## Current Data in Database

After running the seed, you should see:

**Users (6 total):**
- 1 Admin
- 1 Operator
- 3 Therapists
- 1 Accountant

**Patients (2 total):**
- Emma Johnson
- Liam Davis

**Sessions (7 total):**
- Various scheduled, completed, and cancelled sessions

**TherapyTypes (3 total):**
- Physical Therapy
- Occupational Therapy
- Speech Therapy

## Try It Now!

1. Open terminal
2. Run: `cd backend && npm run prisma:studio`
3. Wait for browser to open
4. Click on "User" table
5. See all 6 users with their details!

## To Stop Prisma Studio

Press `Ctrl + C` in the terminal where it's running.

---

**Ready? Run this command:**
```bash
cd backend && npm run prisma:studio
```
