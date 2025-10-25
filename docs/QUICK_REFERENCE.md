# 🚀 Therapist Unavailability - Quick Reference

## For Developers

### Backend Files
```
backend/src/modules/therapist-unavailability/
├── therapist-unavailability.schema.ts      # Validation schemas
├── therapist-unavailability.service.ts     # Business logic
├── therapist-unavailability.controller.ts  # API endpoints
└── therapist-unavailability.routes.ts      # Route definitions
```

### Frontend Files
```
frontend/
├── hooks/
│   └── use-therapist-unavailability.ts     # React hooks
└── components/therapist/
    ├── unavailability-form.tsx             # Create form
    └── unavailability-list.tsx             # List view
```

### API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/therapists/:id/unavailability` | List periods |
| GET | `/api/v1/therapists/:id/unavailability/:unavailabilityId` | Get one |
| GET | `/api/v1/therapists/:id/unavailability/affected-sessions` | Get conflicts |
| GET | `/api/v1/therapists/:id/unavailability/reschedule-slots` | Get slots |
| POST | `/api/v1/therapists/:id/unavailability` | Create |
| PUT | `/api/v1/therapists/:id/unavailability/:unavailabilityId` | Update |
| DELETE | `/api/v1/therapists/:id/unavailability/:unavailabilityId` | Delete |

### React Hooks

```typescript
// List unavailability periods
const { data, isLoading } = useTherapistUnavailability(therapistId, startDate?, endDate?);

// Get affected sessions
const { data: sessions } = useAffectedSessions(therapistId, startDate, endDate, startTime?, endTime?);

// Get reschedule slots
const { data: slots } = useAvailableRescheduleSlots(therapistId, startDate, sessionDuration, daysAhead?);

// Create unavailability
const createMutation = useCreateUnavailability(therapistId);
await createMutation.mutateAsync(data);

// Delete unavailability
const deleteMutation = useDeleteUnavailability(therapistId);
await deleteMutation.mutateAsync(unavailabilityId);
```

### Data Types

```typescript
// Unavailability Reason
type UnavailabilityReason = 
  | 'SICK_LEAVE'
  | 'VACATION'
  | 'PERSONAL_LEAVE'
  | 'EMERGENCY'
  | 'TRAINING'
  | 'OTHER';

// Create Input
interface CreateUnavailabilityInput {
  startDate: string;              // ISO date
  endDate: string;                // ISO date
  startTime?: string;             // HH:MM (optional)
  endTime?: string;               // HH:MM (optional)
  reason: UnavailabilityReason;
  notes?: string;
  rescheduleSessionIds?: string[];
}

// Unavailability Period
interface TherapistUnavailability {
  id: string;
  therapistId: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  reason: UnavailabilityReason;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Affected Session
interface AffectedSession {
  id: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  status: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

// Available Slot
interface AvailableSlot {
  date: string;
  startTime: string;
  endTime: string;
  dayOfWeek: string;
}
```

### Example Usage

#### Create Entire Day Unavailability
```typescript
const createMutation = useCreateUnavailability(therapistId);

await createMutation.mutateAsync({
  startDate: '2025-10-25T00:00:00.000Z',
  endDate: '2025-10-25T23:59:59.999Z',
  reason: 'SICK_LEAVE',
  notes: 'Flu - need rest'
});
```

#### Create Time Slot Unavailability
```typescript
await createMutation.mutateAsync({
  startDate: '2025-10-25T00:00:00.000Z',
  endDate: '2025-10-25T23:59:59.999Z',
  startTime: '14:00',
  endTime: '16:00',
  reason: 'PERSONAL_LEAVE',
  notes: 'Doctor appointment'
});
```

#### Create Date Range Unavailability
```typescript
await createMutation.mutateAsync({
  startDate: '2025-10-25T00:00:00.000Z',
  endDate: '2025-10-30T23:59:59.999Z',
  reason: 'VACATION',
  notes: 'Annual leave'
});
```

#### With Session Rescheduling
```typescript
await createMutation.mutateAsync({
  startDate: '2025-10-25T00:00:00.000Z',
  endDate: '2025-10-25T23:59:59.999Z',
  reason: 'SICK_LEAVE',
  rescheduleSessionIds: ['session-1', 'session-2']
});
```

### Database Schema

```prisma
model TherapistUnavailability {
  id          String                 @id @default(uuid())
  tenantId    String
  therapistId String
  startDate   DateTime
  endDate     DateTime
  startTime   String?
  endTime     String?
  reason      UnavailabilityReason
  notes       String?
  createdAt   DateTime               @default(now())
  updatedAt   DateTime               @updatedAt

  @@index([therapistId])
  @@index([startDate, endDate])
  @@map("therapist_unavailability")
}

enum UnavailabilityReason {
  SICK_LEAVE
  VACATION
  PERSONAL_LEAVE
  EMERGENCY
  TRAINING
  OTHER
}
```

### Color Codes

| Reason | Badge Color |
|--------|-------------|
| SICK_LEAVE | Red (`bg-red-100 text-red-800`) |
| VACATION | Blue (`bg-blue-100 text-blue-800`) |
| PERSONAL_LEAVE | Yellow (`bg-yellow-100 text-yellow-800`) |
| EMERGENCY | Orange (`bg-orange-100 text-orange-800`) |
| TRAINING | Purple (`bg-purple-100 text-purple-800`) |
| OTHER | Gray (`bg-gray-100 text-gray-800`) |

### Common Queries

#### Get unavailability for date range
```typescript
const { data } = useTherapistUnavailability(
  therapistId,
  '2025-10-01',
  '2025-10-31'
);
```

#### Check for conflicts
```typescript
const { data: sessions } = useAffectedSessions(
  therapistId,
  '2025-10-25',
  '2025-10-26',
  '09:00',
  '17:00'
);
```

#### Get reschedule options
```typescript
const { data: slots } = useAvailableRescheduleSlots(
  therapistId,
  '2025-10-26',  // Start looking from this date
  45,            // Session duration in minutes
  30             // Look ahead 30 days
);
```

### Error Handling

```typescript
try {
  await createMutation.mutateAsync(data);
  toast.success('Unavailability created');
} catch (error: any) {
  const message = error.response?.data?.error?.message 
    || 'Failed to create unavailability';
  toast.error(message);
}
```

### Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# E2E tests
npm run test:e2e
```

---

## For Users

### Where to Find It
1. Go to **Therapists** page
2. Click on a therapist
3. Scroll to **"Unavailability Periods"** section
4. Click **"Mark Unavailable"**

### Three Types
1. **Specific Time Slot** - Mark a specific time on one day
2. **Entire Day** - Mark a full day unavailable
3. **Date Range** - Mark multiple days unavailable

### Reasons
- 🔴 Sick Leave
- 🔵 Vacation
- 🟡 Personal Leave
- 🟠 Emergency
- 🟣 Training
- ⚪ Other

### What Happens
1. System finds conflicting sessions
2. Shows you the conflicts
3. You choose how to handle each:
   - Reschedule to a new time
   - Cancel the session
4. System updates everything automatically

---

**Quick Links**
- [Full Documentation](THERAPIST_BREAKS_AND_UNAVAILABILITY_COMPLETE.md)
- [User Guide](UNAVAILABILITY_FEATURE_GUIDE.md)
- [Implementation Summary](IMPLEMENTATION_SUMMARY.md)
- [Checklist](UNAVAILABILITY_CHECKLIST.md)
