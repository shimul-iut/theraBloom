# Single Specialization Migration Guide

## Overview
Changed the system from supporting multiple therapy types per therapist to a single specialization model. Each therapist now has one specialization with associated pricing stored directly in the User model.

## Database Schema Changes

### User Model Updates
Added three new fields to the `User` model:
```prisma
model User {
  // ... existing fields
  specialization   String?
  sessionDuration  Int?
  sessionCost      Decimal?  @db.Decimal(10, 2)
  // ... rest of fields
}
```

### Migration Steps

1. **Run Prisma Migration**
```bash
cd backend
npx prisma migrate dev --name add_therapist_specialization
```

2. **Generate Prisma Client**
```bash
npx prisma generate
```

3. **Run Seed Script**
```bash
npm run prisma:seed
```

## Changes Made

### Backend

#### 1. Schema (`backend/prisma/schema.prisma`)
- Added `specialization` field (String, optional)
- Added `sessionDuration` field (Int, optional)
- Added `sessionCost` field (Decimal, optional)

#### 2. Seed Data (`backend/prisma/seed.ts`)
- Moved therapy type creation before therapist creation
- Added specialization, duration, and cost to therapist creation
- Removed therapist pricing table seeding (no longer needed)
- Updated console logs to show single specialization

**New Therapist Data:**
- John Smith: Physical Therapy, $60/60min
- Sarah Williams: Speech Therapy, $45/30min
- Michael Brown: Occupational Therapy, $48/45min

#### 3. Users Service (`backend/src/modules/users/users.service.ts`)
- Removed therapistPricing joins
- Added specialization, sessionDuration, sessionCost to select queries
- Removed pricing transformation logic
- Simplified getUserById method

### Frontend

#### 1. Therapist Interface (`frontend/hooks/use-therapists.ts`)
- Removed `TherapistPricingDetail` interface
- Removed `pricingDetails` array
- Added `specialization`, `sessionDuration`, `sessionCost` fields

#### 2. Therapist Form (`frontend/components/therapists/therapist-form.tsx`)
- **Complete rewrite** from checkbox-based multi-select to dropdown single-select
- Added specialization dropdown (Select component)
- Added duration and cost input fields
- Auto-fills duration/cost when specialization is selected
- Removed all checkbox and pricing array logic

#### 3. Therapist Mutations (`frontend/hooks/use-therapists-mutations.ts`)
- Updated `CreateTherapistInput` interface
- Removed pricing array handling
- Simplified to single specialization fields
- Removed therapist pricing API calls

#### 4. Therapist Pages
- **New Page** (`frontend/app/therapists/new/page.tsx`): Simplified to pass single object
- **Edit Page** (`frontend/app/therapists/[id]/edit/page.tsx`): Updated to handle single specialization
- **Detail Page** (`frontend/app/therapists/[id]/page.tsx`): Shows single specialization instead of list

#### 5. Therapists List (`frontend/app/therapists/page.tsx`)
- Updated pricing column to show single price/duration
- Removed multi-entry display logic

#### 6. Session Form (`frontend/components/schedule/session-form.tsx`)
- Removed `useTherapistPricingForType` hook
- Updated to read pricing from therapist object directly
- Simplified auto-fill logic

## Data Model Comparison

### Before (Multiple Specializations)
```typescript
{
  id: "123",
  firstName: "John",
  lastName: "Smith",
  pricingDetails: [
    { therapyType: "Physical Therapy", duration: 60, cost: 60 },
    { therapyType: "Occupational Therapy", duration: 45, cost: 50 }
  ]
}
```

### After (Single Specialization)
```typescript
{
  id: "123",
  firstName: "John",
  lastName: "Smith",
  specialization: "Physical Therapy",
  sessionDuration: 60,
  sessionCost: 60
}
```

## UI Changes

### Therapist Form
**Before:**
- Checkboxes for each therapy type
- Expandable sections for duration/cost per type
- Could select multiple therapy types

**After:**
- Single dropdown for specialization
- Two input fields: duration and cost
- Auto-fills from therapy type defaults
- One specialization per therapist

### Therapists Table
**Before:**
```
Specialization: Physical Therapy, Occupational Therapy
Pricing: Physical Therapy: $60/60min
         Occupational Therapy: $50/45min
```

**After:**
```
Specialization: Physical Therapy
Pricing: $60.00 / 60min
```

### Therapist Detail Page
**Before:**
- List of therapy types with individual pricing cards

**After:**
- Single specialization with one pricing display

## Benefits

1. **Simplified Data Model**: No need for TherapistPricing join table
2. **Clearer Business Logic**: One therapist = one specialization
3. **Easier to Understand**: Simpler for users and developers
4. **Better Performance**: No joins needed for therapist queries
5. **Cleaner UI**: Less cluttered forms and displays

## Breaking Changes

⚠️ **Important**: This is a breaking change that affects:
- Database schema
- API responses
- Frontend components
- Existing data (requires migration)

## Migration Checklist

- [ ] Backup database
- [ ] Run Prisma migration
- [ ] Generate Prisma client
- [ ] Run seed script
- [ ] Test therapist creation
- [ ] Test therapist editing
- [ ] Test session creation with auto-fill
- [ ] Verify therapist list display
- [ ] Verify therapist detail page

## Rollback Plan

If needed to rollback:
1. Revert Prisma schema changes
2. Run `npx prisma migrate dev` to create rollback migration
3. Restore previous frontend code from git
4. Restore database from backup

## Testing

### Test Therapist Creation
1. Navigate to `/therapists/new`
2. Fill in name and phone
3. Select "Physical Therapy" from specialization dropdown
4. **Verify**: Duration auto-fills to 60, cost to 50
5. Modify to $65 and 60min
6. Create therapist
7. **Verify**: Appears in list with correct specialization and pricing

### Test Therapist Editing
1. Edit existing therapist
2. Change specialization from "Physical Therapy" to "Speech Therapy"
3. **Verify**: Duration and cost update
4. Save changes
5. **Verify**: List shows updated specialization

### Test Session Auto-fill
1. Create new session
2. Select therapist "John Smith"
3. **Verify**: Cost auto-fills to $60, end time calculates based on 60min
4. Change therapist to "Sarah Williams"
5. **Verify**: Cost updates to $45, end time recalculates for 30min

## Files Modified

### Backend
- `backend/prisma/schema.prisma` - Added specialization fields
- `backend/prisma/seed.ts` - Updated to use single specialization
- `backend/src/modules/users/users.service.ts` - Simplified queries

### Frontend
- `frontend/hooks/use-therapists.ts` - Updated interface
- `frontend/components/therapists/therapist-form.tsx` - Complete rewrite
- `frontend/hooks/use-therapists-mutations.ts` - Simplified mutations
- `frontend/app/therapists/new/page.tsx` - Updated for single specialization
- `frontend/app/therapists/[id]/edit/page.tsx` - Updated for single specialization
- `frontend/app/therapists/[id]/page.tsx` - Updated display
- `frontend/app/therapists/page.tsx` - Updated table column
- `frontend/components/schedule/session-form.tsx` - Simplified auto-fill

## Summary

The system now enforces a one-to-one relationship between therapists and specializations. This simplifies the data model, improves performance, and makes the UI more intuitive. Each therapist has exactly one specialization with associated pricing stored directly in their user record.
