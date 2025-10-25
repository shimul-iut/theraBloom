# Prisma Studio Guide - Visual Database Interface

## What is Prisma Studio?

Prisma Studio is a visual database browser and editor that comes built-in with Prisma. It provides a user-friendly GUI to:
- View all your database tables
- Browse and search records
- Create, edit, and delete records
- View relationships between tables
- Filter and sort data

## How to Access Prisma Studio

### Method 1: Using npm script (Recommended)

```bash
cd backend
npm run prisma:studio
```

### Method 2: Using npx directly

```bash
cd backend
npx prisma studio
```

### Method 3: Using Prisma CLI

```bash
cd backend
prisma studio
```

## What Happens When You Run It

1. Prisma Studio starts a local web server
2. It automatically opens in your default browser
3. Default URL: **http://localhost:5555**
4. You'll see all your database models/tables

## Features

### 1. View Tables

- Left sidebar shows all your models:
  - Tenant
  - User
  - Patient
  - Session
  - TherapyType
  - Payment
  - And more...

### 2. Browse Records

- Click on any table to see its records
- View all fields and their values
- See related records (foreign keys)

### 3. Search and Filter

- Search bar at the top
- Filter by any field
- Sort by columns

### 4. Edit Records

- Click on any record to edit
- Modify field values
- Save changes directly

### 5. Create Records

- Click "Add record" button
- Fill in the fields
- Save to database

### 6. Delete Records

- Select records
- Click delete button
- Confirm deletion

### 7. View Relationships

- Click on foreign key fields
- Navigate to related records
- See connections between tables

## Current Database Tables

After running migrations, you'll see these tables:

1. **Tenant** - Therapy center organizations
2. **User** - Admin, operators, therapists, accountants
3. **Patient** - Patient records
4. **TherapyType** - Types of therapy (Physical, Speech, etc.)
5. **TherapistAvailability** - Therapist schedules
6. **TherapistPricing** - Custom pricing per therapist
7. **Session** - Therapy sessions
8. **SessionPayment** - Session payment tracking
9. **Payment** - General payments
10. **ProgressReport** - Patient progress reports
11. **RescheduleRequest** - Session reschedule requests
12. **Notification** - SMS/Email notifications
13. **Expense** - Business expenses
14. **AuditLog** - System audit trail

## Example: Viewing Sessions

1. Open Prisma Studio
2. Click "Session" in the left sidebar
3. You'll see all sessions with:
   - Patient name
   - Therapist name
   - Scheduled date and time
   - Status (SCHEDULED, COMPLETED, etc.)
   - Cost
   - Related records

## Example: Creating a New Patient

1. Click "Patient" in sidebar
2. Click "Add record" button
3. Fill in fields:
   - firstName: "John"
   - lastName: "Doe"
   - dateOfBirth: Select date
   - guardianName: "Jane Doe"
   - guardianPhone: "01712345678"
   - tenantId: Select from dropdown
4. Click "Save 1 change"

## Example: Viewing Relationships

1. Click on "Session" table
2. Click on any session record
3. Click on the "patientId" field
4. It will navigate to that patient's record
5. You can see all related sessions for that patient

## Tips and Tricks

### 1. Quick Navigation

- Use browser back/forward buttons
- Click breadcrumbs at the top
- Use sidebar for quick table switching

### 2. Filtering Data

```
Example: Find all scheduled sessions
1. Go to Session table
2. Click filter icon
3. Select "status" field
4. Choose "equals"
5. Select "SCHEDULED"
```

### 3. Searching

```
Example: Find a patient by name
1. Go to Patient table
2. Type name in search bar
3. Results filter automatically
```

### 4. Editing Multiple Fields

- Click on a record
- Edit multiple fields
- All changes are batched
- Click "Save X changes" once

### 5. Viewing JSON Fields

- Click on JSON fields (like metadata)
- Prisma Studio shows formatted JSON
- You can edit JSON directly

## Common Tasks

### Check if Migrations Ran

1. Open Prisma Studio
2. Look at left sidebar
3. All tables should be visible
4. If tables are missing, run migrations

### Verify Seed Data

1. Open Prisma Studio
2. Check User table - should have 6 users
3. Check Patient table - should have 2 patients
4. Check Session table - should have 7 sessions
5. Check TherapyType table - should have 3 types

### Find Session Conflicts

1. Go to Session table
2. Filter by therapistId
3. Filter by scheduledDate
4. Sort by startTime
5. Look for overlapping times

### Check Patient Credit Balance

1. Go to Patient table
2. Look at creditBalance column
3. See totalOutstandingDues
4. Click on patient to see all payments

### View Therapist Schedule

1. Go to TherapistAvailability table
2. Filter by therapistId
3. See all availability slots
4. Check dayOfWeek and times

## Troubleshooting

### Issue: Prisma Studio won't start

**Solution:**
```bash
cd backend
npx prisma generate
npx prisma studio
```

### Issue: Tables not showing

**Solution:**
```bash
cd backend
npx prisma migrate deploy
npx prisma studio
```

### Issue: Port 5555 already in use

**Solution:**
```bash
# Kill existing Prisma Studio
# On Windows:
netstat -ano | findstr :5555
taskkill /PID <PID> /F

# Then restart
npx prisma studio
```

### Issue: Can't connect to database

**Solution:**
1. Check if PostgreSQL is running
2. Verify DATABASE_URL in .env
3. Test connection:
   ```bash
   npx prisma db pull
   ```

## Security Notes

⚠️ **Important:**
- Prisma Studio is for **development only**
- Never expose it to the internet
- It runs on localhost by default
- Don't use in production

## Keyboard Shortcuts

- **Ctrl/Cmd + K** - Quick search
- **Ctrl/Cmd + S** - Save changes
- **Esc** - Close modal/cancel
- **Tab** - Navigate between fields

## Alternative: Database Clients

If you prefer other tools:

### pgAdmin (PostgreSQL GUI)
- Download: https://www.pgadmin.org/
- Full-featured PostgreSQL client
- More advanced features

### DBeaver (Universal)
- Download: https://dbeaver.io/
- Supports multiple databases
- Free and open source

### TablePlus (Mac/Windows)
- Download: https://tableplus.com/
- Modern, clean interface
- Paid with free trial

## Connection Details for Other Tools

If using external database clients:

```
Host: localhost
Port: 5432
Database: therapy_platform
Username: postgres
Password: postgres
```

## Summary

**To view your database tables:**

```bash
# 1. Navigate to backend
cd backend

# 2. Start Prisma Studio
npm run prisma:studio

# 3. Browser opens automatically at:
http://localhost:5555

# 4. Browse your tables visually!
```

**Benefits:**
- ✓ Visual interface
- ✓ No SQL required
- ✓ Edit data easily
- ✓ See relationships
- ✓ Built into Prisma
- ✓ Free and easy to use

---

**Quick Start:**
```bash
cd backend && npm run prisma:studio
```

Then open http://localhost:5555 in your browser!
