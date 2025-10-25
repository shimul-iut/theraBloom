# Session Validation Fix - UUID Migration

## Problem
The create session API was throwing validation errors because:
- The validation schema was still expecting CUID format IDs
- But the database and other parts of the system were migrated to UUID format
- Mixed ID formats in the payload caused validation failures

## Error Details
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "validation": "regex",
        "code": "invalid_string", 
        "message": "Invalid ID format",
        "path": ["patientId"]
      },
      {
        "validation": "regex",
        "code": "invalid_string",
        "message": "Invalid ID format", 
        "path": ["therapyTypeId"]
      }
    ]
  }
}
```

## Payload Analysis
```json
{
  "patientId": "32d01998-25d3-4ae1-a810-fcb6034fdf68",    // UUID ✓
  "therapistId": "cmh5xvymo00018exgrebst9sj",              // CUID ✗
  "therapyTypeId": "48a9ab25-36b7-4163-96c4-867c7b4a740e" // UUID ✓
}
```

## Solution Applied
Updated `backend/src/modules/sessions/sessions.schema.ts`:

1. **Replaced CUID validation with UUID validation:**
```typescript
// Before
const cuidSchema = z
  .string()
  .min(1, 'ID is required')
  .regex(/^c[a-z0-9]{24,}$/, 'Invalid ID format');

// After  
const uuidSchema = z
  .string()
  .min(1, 'ID is required')
  .uuid('Invalid ID format');
```

2. **Updated all schema references:**
- `createSessionSchema` now uses `uuidSchema` for all ID fields
- `sessionIdParamSchema` now uses `uuidSchema`

## Next Steps Required

### Check for CUID Format IDs in Database
You need to ensure all IDs in your database are in UUID format. Run this query to check:

```sql
-- Check for CUID format therapist IDs
SELECT id, firstName, lastName FROM User 
WHERE role = 'THERAPIST' AND id LIKE 'c%';

-- Check for CUID format patient IDs  
SELECT id, firstName, lastName FROM User
WHERE role = 'PATIENT' AND id LIKE 'c%';

-- Check for CUID format therapy type IDs
SELECT id, name FROM TherapyType WHERE id LIKE 'c%';
```

### If CUID IDs Found
If you find any CUID format IDs, you'll need to:

1. **Generate new UUID IDs** for those records
2. **Update all foreign key references** to use the new UUIDs
3. **Update the records** with the new IDs

### Alternative Quick Fix
If you want to test immediately, make sure you're using UUID format IDs in your API calls:
- Get a valid therapist ID from your database that's in UUID format
- Use that instead of the CUID format ID in your payload

## Files Modified
- `backend/src/modules/sessions/sessions.schema.ts` - Updated validation from CUID to UUID format

## Status
✅ Schema validation fixed - now properly validates UUID format IDs
⚠️  Database may still contain CUID format IDs that need migration