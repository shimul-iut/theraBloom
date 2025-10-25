# Database Reset Complete ✓

## What Was Done

Successfully reset the database and reseeded with fresh data using UUID v4 IDs.

## Changes Applied

### 1. Database Reset
- Dropped all existing tables
- Ran all 6 migrations
- Created fresh schema with UUID defaults

### 2. Data Seeded

**Tenant:**
- Demo Therapy Center

**Therapy Types (3):**
1. Physical Therapy - 60 min, $50
2. Occupational Therapy - 45 min, $45
3. Speech Therapy - 30 min, $40

**Users (6):**
1. **Admin** - 01712345678
2. **Operator** - 01812345678
3. **Therapist 1: John Smith** - 01912345678
   - ✓ specializationId: Physical Therapy
   - sessionDuration: 60 min
   - sessionCost: $60
4. **Therapist 2: Sarah Williams** - 01913345678
   - ✓ specializationId: Speech Therapy
   - sessionDuration: 30 min
   - sessionCost: $45
5. **Therapist 3: Michael Brown** - 01914345678
   - ✓ specializationId: Occupational Therapy
   - sessionDuration: 45 min
   - sessionCost: $48
6. **Accountant** - 01612345678

**Patients (2):**
1. Emma Johnson - Credit: $200
2. Liam Smith - Credit: $150

**Sessions (7):**
- 2 today
- 3 tomorrow/future
- 1 completed (yesterday)
- 1 cancelled

**Therapist Availability:**
- All therapists available Monday-Friday, 9 AM - 5 PM
- For all therapy types

## Verification

### Check specializationId in Prisma Studio

1. Open Prisma Studio:
   ```bash
   cd backend
   npm run prisma:studio
   ```

2. Go to **User** table

3. Look at the therapist records:
   - **John Smith** → specializationId should show UUID of Physical Therapy
   - **Sarah Williams** → specializationId should show UUID of Speech Therapy
   - **Michael Brown** → specializationId should show UUID of Occupational Therapy

4. Click on any specializationId to navigate to the TherapyType record

### Check via SQL

```sql
SELECT 
  u.id,
  u."firstName",
  u."lastName",
  u.role,
  u."specializationId",
  t.name as specialization_name
FROM "User" u
LEFT JOIN "TherapyType" t ON u."specializationId" = t.id
WHERE u.role = 'THERAPIST';
```

Expected output:
```
John Smith    | THERAPIST | <uuid> | Physical Therapy
Sarah Williams| THERAPIST | <uuid> | Speech Therapy
Michael Brown | THERAPIST | <uuid> | Occupational Therapy
```

### Check via API

```bash
GET http://localhost:3000/api/v1/users
Authorization: Bearer <your-token>
```

Look for therapists in the response - each should have:
```json
{
  "id": "uuid",
  "firstName": "John",
  "lastName": "Smith",
  "role": "THERAPIST",
  "specializationId": "uuid-of-physical-therapy",
  "sessionDuration": 60,
  "sessionCost": "60.00"
}
```

## All IDs are Now UUIDs

Every record now has a UUID v4 format ID:

**Example IDs:**
- Tenant: `550e8400-e29b-41d4-a716-446655440000`
- User: `6ba7b810-9dad-11d1-80b4-00c04fd430c8`
- TherapyType: `6ba7b811-9dad-11d1-80b4-00c04fd430c8`
- Patient: `6ba7b812-9dad-11d1-80b4-00c04fd430c8`
- Session: `6ba7b813-9dad-11d1-80b4-00c04fd430c8`

## Login Credentials

All passwords: **password123**

| Role | Phone Number | Name |
|------|-------------|------|
| Admin | 01712345678 | Admin User |
| Operator | 01812345678 | Operator User |
| Therapist | 01912345678 | John Smith (Physical) |
| Therapist | 01913345678 | Sarah Williams (Speech) |
| Therapist | 01914345678 | Michael Brown (Occupational) |
| Accountant | 01612345678 | Accountant User |

## Test the Application

### 1. Start Backend

```bash
cd backend
npm run dev
```

### 2. Start Frontend

```bash
cd frontend
npm run dev
```

### 3. Login

- Go to http://localhost:3001/login
- Phone: 01712345678
- Password: password123

### 4. Create a Session

1. Go to Schedule page
2. Click "New Session"
3. Select:
   - Patient: Emma Johnson or Liam Smith
   - Therapist: Any therapist
   - Therapy Type: Should auto-select based on therapist's specialization
   - Date: Today or future date
   - Time: Any available time

4. Submit and verify:
   - Session created successfully
   - UUID validation works
   - Double-booking prevention works

## Troubleshooting

### Issue: specializationId still null

**Solution:**
```bash
cd backend
npx prisma migrate reset --force
```

This will:
1. Drop all tables
2. Run migrations
3. Reseed data
4. All therapists will have specializationId

### Issue: Can't login

**Solution:**
Check if backend is running:
```bash
cd backend
npm run dev
```

### Issue: Sessions not creating

**Solution:**
Check validation errors in browser console and backend logs.

## Summary

✓ **Database Reset** - Fresh start with UUID
✓ **All Migrations Applied** - 6 migrations
✓ **Data Seeded** - 6 users, 2 patients, 7 sessions
✓ **specializationId Set** - All therapists have specialization
✓ **UUID Format** - All IDs are UUID v4
✓ **Ready to Use** - Application is ready for testing

---

**Quick Verification:**
```bash
cd backend && npm run prisma:studio
```

Then check User table → Therapists should have specializationId!

---

**Completed:** October 21, 2025
**Status:** ✓ Complete
