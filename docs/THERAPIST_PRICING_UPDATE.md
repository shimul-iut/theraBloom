# Therapist Pricing and Session Form Updates

## Summary
Successfully updated the therapy center platform to include therapist-specific pricing management and auto-fill functionality in session forms.

## Changes Made

### 1. Backend Seed Data (`backend/prisma/seed.ts`)
- ✅ Removed `specialization` field from therapist creation (field doesn't exist in schema)
- ✅ Therapist pricing data already exists in seed file with comprehensive pricing for all therapists
- ✅ Added console logs to show therapist specializations based on their pricing

**Therapist Pricing in Seed:**
- **John Smith**: Physical Therapy ($60/60min), Occupational Therapy ($50/45min)
- **Sarah Williams**: Speech Therapy ($45/30min), Physical Therapy ($55/60min)
- **Michael Brown**: Occupational Therapy ($48/45min), Speech Therapy ($42/30min)

### 2. Therapist Form (`frontend/components/therapists/therapist-form.tsx`)
- ✅ Added therapy type pricing management section
- ✅ Displays all available therapy types with checkboxes
- ✅ Allows setting custom duration and cost per therapy type
- ✅ Loads existing pricing when editing a therapist
- ✅ Removed `specialization` text field (not in schema)

**New Features:**
- Checkbox selection for each therapy type
- Duration input (minutes) for each selected therapy type
- Cost input ($) for each selected therapy type
- Auto-populates with therapy type defaults when selected
- Loads existing therapist pricing when editing

### 3. Therapist Mutations Hook (`frontend/hooks/use-therapists-mutations.ts`)
- ✅ Updated `useCreateTherapist` to accept pricing array
- ✅ Creates therapist pricing records after therapist creation
- ✅ Updated `useUpdateTherapist` to manage pricing updates
- ✅ Deletes old pricing and creates new pricing on update
- ✅ Invalidates pricing queries after updates

### 4. Session Form (`frontend/components/schedule/session-form.tsx`)
- ✅ Auto-fills cost based on therapist-specific pricing
- ✅ Falls back to therapy type default cost if no therapist pricing exists
- ✅ Auto-calculates end time based on session duration
- ✅ Updates when therapist or therapy type selection changes

**Auto-fill Logic:**
1. When both therapist and therapy type are selected, fetch therapist-specific pricing
2. If therapist pricing exists, use that cost and duration
3. If no therapist pricing, fall back to therapy type defaults
4. Auto-calculate end time based on start time + duration

### 5. Therapy Types Hook (`frontend/hooks/use-therapy-types.ts`)
- ✅ Added `cost` property to `TherapyType` interface

### 6. UI Components
- ✅ Created `Checkbox` component (`frontend/components/ui/checkbox.tsx`)
- Simple HTML checkbox with custom styling
- Supports `checked` and `onCheckedChange` props

### 7. Therapist Pages
- ✅ Updated `frontend/app/therapists/new/page.tsx` to pass pricing to mutation
- ✅ Updated `frontend/app/therapists/[id]/edit/page.tsx` to pass therapist ID and pricing

## How to Use

### Creating a Therapist with Pricing
1. Navigate to "Add New Therapist"
2. Fill in personal information (name, phone, password)
3. In the "Therapy Type Pricing" section, check the therapy types this therapist offers
4. For each selected therapy type, set the session duration and cost
5. Click "Create Therapist"

### Editing Therapist Pricing
1. Navigate to therapist list and click "Edit" on a therapist
2. Existing pricing will be pre-loaded with checkboxes selected
3. Modify duration/cost or add/remove therapy types
4. Click "Update Therapist"

### Creating Sessions with Auto-fill
1. Navigate to "Schedule" → "New Session"
2. Select a patient
3. Select a therapist
4. Select a therapy type
5. **Cost and duration auto-fill based on therapist pricing**
6. Set start time - **end time auto-calculates**
7. Adjust if needed and create session

## Testing

Run the seed script to populate test data:
```bash
cd backend
npm run seed
```

This will create:
- 3 therapists with different pricing configurations
- Multiple therapy types
- Sample sessions

## Notes

- The `specialization` field was removed as it doesn't exist in the Prisma schema
- Therapist specialization is now implied by their pricing configuration
- Session form intelligently uses therapist-specific pricing when available
- All pricing is stored in the `TherapistPricing` table with therapist-therapy type relationships
