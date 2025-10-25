# Therapist Specialization with Database Joins

## Solution Overview
Instead of removing the specialization column, I've implemented a computed field that uses database joins to populate the specialization based on the therapist's pricing configuration.

## How It Works

### Backend Changes

**File:** `backend/src/modules/users/users.service.ts`

#### 1. `getUsers()` Method
When fetching users with `role=THERAPIST`, the service now:
1. Includes `therapistPricing` relation with nested `therapyType` data
2. Extracts therapy type names from the pricing records
3. Joins them into a comma-separated string
4. Returns as computed `specialization` field

```typescript
// Includes therapist pricing when fetching therapists
therapistPricing: role === 'THERAPIST' ? {
  select: {
    therapyType: {
      select: {
        name: true,
      },
    },
  },
} : false,

// Computes specialization from therapy types
const therapyTypes = user.therapistPricing.map(p => p.therapyType.name);
specialization: therapyTypes.join(', ')
```

#### 2. `getUserById()` Method
Similarly updated to include pricing data and compute specialization for individual therapist lookups.

### Frontend - No Changes Needed
The frontend already had the `specialization` field in the interface and was displaying it in the table. Now it will receive actual data from the backend.

## Data Flow

```
Database Query
    ↓
User table JOIN TherapistPricing table JOIN TherapyType table
    ↓
Extract therapy type names: ["Physical Therapy", "Speech Therapy"]
    ↓
Join with comma: "Physical Therapy, Speech Therapy"
    ↓
Return as specialization field
    ↓
Frontend displays in table
```

## Example Output

### John Smith (Therapist)
- **Pricing Records:**
  - Physical Therapy ($60/60min)
  - Occupational Therapy ($50/45min)
- **Computed Specialization:** "Physical Therapy, Occupational Therapy"

### Sarah Williams (Therapist)
- **Pricing Records:**
  - Speech Therapy ($45/30min)
  - Physical Therapy ($55/60min)
- **Computed Specialization:** "Speech Therapy, Physical Therapy"

### Michael Brown (Therapist)
- **Pricing Records:**
  - Occupational Therapy ($48/45min)
  - Speech Therapy ($42/30min)
- **Computed Specialization:** "Occupational Therapy, Speech Therapy"

## Benefits

1. **No Schema Changes**: Uses existing relationships without adding new fields
2. **Always Accurate**: Specialization automatically reflects current pricing configuration
3. **Single Source of Truth**: Pricing data drives specialization display
4. **Efficient**: Uses Prisma's select to only fetch needed data
5. **Flexible**: Easy to change format (comma-separated, bullets, etc.)

## Technical Details

### Database Relations Used
```
User (therapist)
  ↓ (one-to-many)
TherapistPricing
  ↓ (many-to-one)
TherapyType
```

### Prisma Query Structure
```typescript
prisma.user.findMany({
  select: {
    // ... other fields
    therapistPricing: {
      select: {
        therapyType: {
          select: {
            name: true
          }
        }
      }
    }
  }
})
```

### Response Transformation
```typescript
// Before transformation
{
  id: "123",
  firstName: "John",
  therapistPricing: [
    { therapyType: { name: "Physical Therapy" } },
    { therapyType: { name: "Speech Therapy" } }
  ]
}

// After transformation
{
  id: "123",
  firstName: "John",
  specialization: "Physical Therapy, Speech Therapy"
}
```

## Edge Cases Handled

1. **No Pricing Configured**: Returns `null` for specialization
2. **Single Therapy Type**: Returns just that type name
3. **Multiple Therapy Types**: Returns comma-separated list
4. **Non-Therapist Users**: Doesn't include pricing data or specialization

## Testing

### Test Therapist List
1. Navigate to `/therapists`
2. **Verify:** Specialization column shows therapy types for each therapist
3. **Verify:** John Smith shows "Physical Therapy, Occupational Therapy"
4. **Verify:** Sarah Williams shows "Speech Therapy, Physical Therapy"
5. **Verify:** Michael Brown shows "Occupational Therapy, Speech Therapy"

### Test Individual Therapist
1. Click eye icon on any therapist
2. **Verify:** Detail page loads successfully
3. **Verify:** Pricing section shows the same therapy types

### Test After Editing Pricing
1. Edit a therapist and change their therapy types
2. Save changes
3. Return to therapist list
4. **Verify:** Specialization updates to reflect new pricing

## Performance Considerations

- **Efficient Query**: Only fetches therapy type names, not full pricing details
- **Conditional Loading**: Only includes pricing data when fetching therapists
- **Single Query**: Uses Prisma's nested select instead of multiple queries
- **Computed at Query Time**: No need for database triggers or stored procedures

## Future Enhancements

If needed, we could:
1. Add icons for each therapy type
2. Show specialization as badges instead of text
3. Add filtering by specialization
4. Sort by specialization
5. Show primary specialization (most sessions/highest rate)

## Files Modified

### Backend
- `backend/src/modules/users/users.service.ts`
  - Updated `getUsers()` to include pricing and compute specialization
  - Updated `getUserById()` to include pricing and compute specialization

### Frontend
- `frontend/hooks/use-therapists.ts` - Restored `specialization` field
- `frontend/app/therapists/page.tsx` - Restored specialization column

## Summary

The specialization field is now dynamically computed from the therapist's pricing configuration using database joins. This provides accurate, real-time specialization data without requiring a separate field in the database schema.
