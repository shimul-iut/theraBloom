# Run Database Seed

The seed file has been updated with:
- ✅ 3 Therapists (John Smith, Sarah Williams, Michael Brown)
- ✅ 3 Therapy Types (Physical, Occupational, Speech)
- ✅ 2 Patients (Emma Johnson, Liam Smith)
- ✅ 7 Sessions (today, tomorrow, past, cancelled)
- ✅ Therapist availability schedules
- ✅ Therapist-specific pricing

## How to Run

### If using Docker:
```bash
docker-compose exec backend npm run seed
```

### If running locally:
```bash
cd backend
npm run seed
```

## What Gets Created

### Users
- **Admin:** 01712345678 / password123
- **Operator:** 01812345678 / password123
- **Therapist 1:** 01912345678 / password123 (John Smith)
- **Therapist 2:** 01913345678 / password123 (Sarah Williams)
- **Therapist 3:** 01914345678 / password123 (Michael Brown)
- **Accountant:** 01612345678 / password123

### Therapy Types
1. Physical Therapy (60 min, $50)
2. Occupational Therapy (45 min, $45)
3. Speech Therapy (30 min, $40)

### Patients
1. Emma Johnson (DOB: 2018-05-15)
2. Liam Smith (DOB: 2019-08-22)

### Sessions
1. **Today 10:00** - Emma + John Smith + Physical Therapy (SCHEDULED)
2. **Today 14:00** - Liam + Sarah Williams + Speech Therapy (SCHEDULED)
3. **Tomorrow 09:00** - Emma + John Smith + Occupational Therapy (SCHEDULED)
4. **Tomorrow 11:00** - Liam + Michael Brown + Physical Therapy (SCHEDULED)
5. **Tomorrow 16:00** - Emma + Michael Brown + Occupational Therapy (CANCELLED)
6. **Day After 10:00** - Emma + Sarah Williams + Speech Therapy (SCHEDULED)
7. **Yesterday 15:00** - Liam + John Smith + Physical Therapy (COMPLETED)

## After Running Seed

1. Login as Admin: `01712345678` / `password123`
2. Navigate to `/schedule` to see the calendar with sessions
3. Navigate to `/therapists` to see the list of therapists
4. Navigate to `/patients` to see the patients
5. Filter sessions by therapist or status
6. Click on dates to see session details

## Note
Running the seed will use `upsert` for most data, so it's safe to run multiple times. However, sessions will be duplicated if you run it again.
