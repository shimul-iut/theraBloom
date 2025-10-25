# Therapist Table with Pricing & Duration

## Enhancement Overview
Added a "Pricing & Duration" column to the therapists table that displays all therapy types with their respective costs and session durations.

## Changes Made

### Backend (`backend/src/modules/users/users.service.ts`)

#### Updated `getUsers()` Method
1. **Expanded Pricing Query**: Now fetches `sessionDuration` and `sessionCost` along with therapy type names
2. **Added `pricingDetails` Field**: Creates a structured array with pricing information
3. **Maintains Specialization**: Still computes the comma-separated specialization field

```typescript
// Fetches full pricing data
therapistPricing: role === 'THERAPIST' ? {
  select: {
    sessionDuration: true,
    sessionCost: true,
    therapyType: {
      select: {
        name: true,
      },
    },
  },
} : false,

// Transforms into structured format
pricingDetails: [
  {
    therapyType: "Physical Therapy",
    duration: 60,
    cost: 60.00
  },
  // ...
]
```

### Frontend

#### Updated Interface (`frontend/hooks/use-therapists.ts`)
Added `TherapistPricingDetail` interface and `pricingDetails` field to `Therapist` interface:

```typescript
export interface TherapistPricingDetail {
  therapyType: string;
  duration: number;
  cost: number;
}

export interface Therapist {
  // ... existing fields
  pricingDetails?: TherapistPricingDetail[];
}
```

#### Updated Table (`frontend/app/therapists/page.tsx`)
Added new "Pricing & Duration" column that displays:
- Therapy type name
- Cost formatted as currency ($XX.XX)
- Duration in minutes
- Multiple entries stacked vertically for therapists with multiple therapy types

## Table Display Example

| First Name | Last Name | Phone | Specialization | Pricing & Duration | Status | Actions |
|------------|-----------|-------|----------------|-------------------|--------|---------|
| John | Smith | 01912345678 | Physical Therapy, Occupational Therapy | **Physical Therapy:** $60.00 / 60min<br>**Occupational Therapy:** $50.00 / 45min | Active | 👁️ 📅 |
| Sarah | Williams | 01913345678 | Speech Therapy, Physical Therapy | **Speech Therapy:** $45.00 / 30min<br>**Physical Therapy:** $55.00 / 60min | Active | 👁️ 📅 |
| Michael | Brown | 01914345678 | Occupational Therapy, Speech Therapy | **Occupational Therapy:** $48.00 / 45min<br>**Speech Therapy:** $42.00 / 30min | Active | 👁️ 📅 |

## Visual Format

Each pricing entry is displayed as:
```
Therapy Type: $XX.XX / XXmin
```

Multiple entries are stacked vertically with proper spacing for easy reading.

## Features

1. **Complete Information**: Shows all pricing details at a glance
2. **Formatted Currency**: Displays costs with 2 decimal places
3. **Clear Duration**: Shows session length in minutes
4. **Multiple Entries**: Handles therapists with multiple therapy types
5. **Empty State**: Shows "-" for therapists without pricing configured
6. **Compact Display**: Uses small text to fit more information

## Data Flow

```
Database Query
    ↓
Fetch User + TherapistPricing + TherapyType (with joins)
    ↓
Extract: therapyType.name, sessionDuration, sessionCost
    ↓
Transform to pricingDetails array
    ↓
Frontend displays in table cell
```

## Benefits

1. **Quick Overview**: See all pricing without clicking into details
2. **Easy Comparison**: Compare rates between therapists at a glance
3. **Complete Context**: Specialization + pricing in one view
4. **Professional Display**: Clean, organized formatting
5. **Scalable**: Handles any number of therapy types per therapist

## Edge Cases Handled

1. **No Pricing**: Shows "-" for therapists without pricing
2. **Single Therapy Type**: Displays one line
3. **Multiple Therapy Types**: Stacks entries vertically
4. **Decimal Costs**: Properly formats with 2 decimal places
5. **Long Names**: Text wraps appropriately

## Testing

### Test Display
1. Navigate to `/therapists`
2. **Verify:** New "Pricing & Duration" column appears
3. **Verify:** John Smith shows 2 pricing entries
4. **Verify:** Costs are formatted as $XX.XX
5. **Verify:** Durations show in minutes

### Test Different Therapists
1. **John Smith**: Should show Physical Therapy ($60/60min) and Occupational Therapy ($50/45min)
2. **Sarah Williams**: Should show Speech Therapy ($45/30min) and Physical Therapy ($55/60min)
3. **Michael Brown**: Should show Occupational Therapy ($48/45min) and Speech Therapy ($42/30min)

### Test New Therapist
1. Create a therapist without pricing
2. **Verify:** Shows "-" in pricing column
3. Add pricing to the therapist
4. **Verify:** Pricing appears in table

## Technical Details

### Backend Response Structure
```json
{
  "id": "123",
  "firstName": "John",
  "lastName": "Smith",
  "specialization": "Physical Therapy, Occupational Therapy",
  "pricingDetails": [
    {
      "therapyType": "Physical Therapy",
      "duration": 60,
      "cost": 60.00
    },
    {
      "therapyType": "Occupational Therapy",
      "duration": 45,
      "cost": 50.00
    }
  ]
}
```

### Frontend Rendering
- Uses `map()` to iterate through pricing details
- Formats cost with `Number(p.cost).toFixed(2)`
- Displays each entry on a new line with `space-y-1`
- Uses semantic HTML with proper text sizing

## Performance

- **Single Query**: All data fetched in one database query
- **Efficient Join**: Uses Prisma's nested select
- **No N+1 Problem**: Pricing loaded with users, not separately
- **Minimal Overhead**: Only adds ~100 bytes per therapist

## Future Enhancements

Could add:
1. Tooltips with more details on hover
2. Color coding by price range
3. Sorting by average price
4. Filtering by price range
5. Icons for each therapy type
6. Expandable rows for more details

## Files Modified

### Backend
- `backend/src/modules/users/users.service.ts`
  - Updated `getUsers()` to fetch and transform pricing data

### Frontend
- `frontend/hooks/use-therapists.ts`
  - Added `TherapistPricingDetail` interface
  - Added `pricingDetails` to `Therapist` interface
- `frontend/app/therapists/page.tsx`
  - Added "Pricing & Duration" column to table
  - Implemented pricing display logic

## Summary

The therapists table now displays complete pricing information including therapy types, costs, and session durations. This provides administrators with a comprehensive view of each therapist's services and rates without needing to click into detail pages.
