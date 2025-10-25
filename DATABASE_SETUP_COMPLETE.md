# Database Setup Complete ✓

## Summary

Successfully applied all Prisma migrations and seeded the database with initial data.

## Migrations Applied

1. `20251018174156_init_migration` - Initial database schema
2. `20251019080145_add_phone_number_to_user` - Added phone number field
3. `20251019084940_remove_email_use_phone_only` - Switched to phone-only auth
4. `20251020182058_add_therapist_specialization` - Added specialization
5. `20251020185937_add_therapist_specialization` - Specialization update
6. `20251020192417_change_specialization_to_id` - Changed to ID reference

## Database Schema

### Tables Created

- ✓ Tenant
- ✓ User
- ✓ Patient
- ✓ TherapyType
- ✓ TherapistAvailability
- ✓ TherapistPricing
- ✓ Session
- ✓ Payment
- ✓ SessionPayment
- ✓ ProgressReport
- ✓ RescheduleRequest
- ✓ Notification
- ✓ Expense
- ✓ AuditLog

## Seed Data Created

### Tenant
- **Demo Therapy Center** - Sample tenant for testing

### Therapy Types
1. **Physical Therapy** - 60 min, $50
2. **Occupational Therapy** - 45 min, $45
3. **Speech Therapy** - 30 min, $40

### Users

#### Admin
- **Phone:** 01712345678
- **Password:** password123
- **Role:** WORKSPACE_ADMIN

#### Operator
- **Phone:** 01812345678
- **Password:** password123
- **Role:** OPERATOR

#### Therapists

**Therapist 1: John Smith**
- **Phone:** 01912345678
- **Password:** password123
- **Role:** THERAPIST
- **Specialization:** Physical Therapy
- **Pricing:** $60 / 60 min

**Therapist 2: Sarah Williams**
- **Phone:** 01913345678
- **Password:** password123
- **Role:** THERAPIST
- **Specialization:** Speech Therapy
- **Pricing:** $45 / 30 min

**Therapist 3: Michael Brown**
- **Phone:** 01914345678
- **Password:** password123
- **Role:** THERAPIST
- **Specialization:** Occupational Therapy
- **Pricing:** $48 / 45 min

#### Accountant
- **Phone:** 01612345678
- **Password:** password123
- **Role:** ACCOUNTANT

### Therapist Availability

All therapists have availability schedules:
- **Monday - Friday:** 09:00 - 17:00
- **Therapy types:** Based on their specialization

### Sample Patients

**Patient 1: Emma Johnson**
- Age: 8
- Guardian: Robert Johnson
- Phone: 01711111111
- Credit Balance: $500

**Patient 2: Liam Davis**
- Age: 10
- Guardian: Jennifer Davis
- Phone: 01722222222
- Credit Balance: $300

### Sample Sessions

7 sample sessions created:
- Today's sessions
- Tomorrow's sessions
- Past sessions
- Cancelled sessions

## Testing the Setup

### 1. Login Test

Try logging in with any of the demo credentials:

```bash
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json

{
  "phoneNumber": "01712345678",
  "password": "password123"
}
```

### 2. Get Sessions

```bash
GET http://localhost:3000/api/v1/sessions
Authorization: Bearer <your-token>
```

### 3. Create Session

```bash
POST http://localhost:3000/api/v1/sessions
Authorization: Bearer <your-token>
Content-Type: application/json

{
  "patientId": "<patient-id>",
  "therapistId": "<therapist-id>",
  "therapyTypeId": "<therapy-type-id>",
  "scheduledDate": "2025-10-25T00:00:00.000Z",
  "startTime": "10:00",
  "endTime": "11:00"
}
```

## Database Connection

**Connection String:**
```
postgresql://postgres:postgres@localhost:5432/therapy_platform
```

**Environment Variables:**
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/therapy_platform"
```

## Prisma Commands

### View Database in Prisma Studio
```bash
cd backend
npx prisma studio
```

### Generate Prisma Client
```bash
cd backend
npx prisma generate
```

### Create New Migration
```bash
cd backend
npx prisma migrate dev --name your_migration_name
```

### Reset Database (WARNING: Deletes all data)
```bash
cd backend
npx prisma migrate reset
```

### Apply Migrations
```bash
cd backend
npx prisma migrate deploy
```

### Seed Database
```bash
cd backend
npm run prisma:seed
```

## Verification

### Check Tables Exist

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

### Check User Count

```sql
SELECT COUNT(*) FROM "User";
```

### Check Sessions

```sql
SELECT 
  s.id,
  s."scheduledDate",
  s."startTime",
  s."endTime",
  s.status,
  p."firstName" || ' ' || p."lastName" as patient,
  u."firstName" || ' ' || u."lastName" as therapist
FROM "Session" s
JOIN "Patient" p ON s."patientId" = p.id
JOIN "User" u ON s."therapistId" = u.id;
```

## Troubleshooting

### Issue: "Table does not exist"

**Solution:**
```bash
cd backend
npx prisma migrate deploy
```

### Issue: "No seed data"

**Solution:**
```bash
cd backend
npm run prisma:seed
```

### Issue: "Connection refused"

**Solution:**
1. Check if PostgreSQL is running
2. Verify connection string in `.env`
3. Check if database exists

### Issue: "Migration failed"

**Solution:**
```bash
cd backend
npx prisma migrate reset
npx prisma migrate deploy
npm run prisma:seed
```

## Next Steps

1. **Start Backend Server:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Login to Application:**
   - Go to http://localhost:3001/login
   - Use phone: 01712345678
   - Password: password123

4. **Test Scheduling:**
   - Navigate to Schedule page
   - Try creating a session
   - Test double-booking prevention

## Database Status

✓ **Migrations:** All applied successfully
✓ **Seed Data:** Created successfully
✓ **Tables:** All tables exist
✓ **Indexes:** All indexes created
✓ **Constraints:** All constraints applied
✓ **Ready:** Database is ready for use

---

**Setup Date:** October 21, 2025
**Status:** ✓ Complete
