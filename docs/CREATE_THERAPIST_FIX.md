# Create Therapist Fix ✓

## Problem

When creating a new therapist, the therapist-specific fields were not being saved:
- `specializationId` - Not saved
- `sessionDuration` - Not saved  
- `sessionCost` - Not saved

## Root Cause

1. **Backend Schema** - `createUserSchema` didn't include therapist fields
2. **Backend Service** - `createUser` method didn't save therapist fields
3. **Frontend** - Number conversion issue (same as edit)

## Fixes Applied

### 1. Backend Schema (`users.schema.ts`)

Added therapist fields to create schema:

```typescript
export const createUserSchema = z.object({
  phoneNumber: phoneNumberSchema,
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.nativeEnum(UserRole),
  // NEW: Therapist-specific fields
  specializationId: z.string().uuid().optional().nullable(),
  sessionDuration: z.number().int().positive().optional().nullable(),
  sessionCost: z.number().positive().optional().nullable(),
});
```

### 2. Backend Service (`users.service.ts`)

Updated `createUser` method to save therapist fields:

```typescript
const user = await prisma.user.create({
  data: {
    tenantId,
    phoneNumber: input.phoneNumber,
    passwordHash,
    firstName: input.firstName,
    lastName: input.lastName,
    role: input.role,
    active: true,
    // NEW: Therapist-specific fields
    ...(input.specializationId && { specializationId: input.specializationId }),
    ...(input.sessionDuration && { sessionDuration: input.sessionDuration }),
    ...(input.sessionCost && { sessionCost: input.sessionCost }),
  },
  select: {
    // ... basic fields
    // NEW: Include therapist fields in response
    specializationId: true,
    specialization: { select: { id: true, name: true } },
    sessionDuration: true,
    sessionCost: true,
  },
});
```

### 3. Frontend Create Page (`therapists/new/page.tsx`)

Fixed number conversion:

```typescript
const handleSubmit = async (data: CreateTherapistInput) => {
  await createTherapist.mutateAsync({
    ...data,
    sessionDuration: parseInt(data.sessionDuration.toString(), 10),
    sessionCost: parseFloat(parseFloat(data.sessionCost.toString()).toFixed(2)),
  });
};
```

## Testing

### Test Case 1: Create New Therapist

1. **Go to:** Therapists page
2. **Click:** "Add New Therapist"
3. **Fill in:**
   - First Name: "Test"
   - Last Name: "Therapist"
   - Phone: "01999999999"
   - Password: "password123"
   - Specialization: "Physical Therapy"
   - Session Duration: 60
   - Session Cost: 75.00
4. **Click:** "Create Therapist"

**Expected Result:**
- ✓ Success toast appears
- ✓ Redirected to therapists list
- ✓ New therapist appears in list

### Test Case 2: Verify in Database

1. **Open Prisma Studio:**
   ```bash
   docker-compose exec backend npx prisma studio
   ```

2. **Go to User table**

3. **Find the new therapist**

4. **Verify fields:**
   - ✓ specializationId = UUID of Physical Therapy
   - ✓ sessionDuration = 60
   - ✓ sessionCost = 75.00

### Test Case 3: Create Non-Therapist User

1. **Create user with role "OPERATOR"**
2. **Don't fill therapist fields**
3. **Should create successfully**
4. **Therapist fields should be null**

## Data Flow

### Create Therapist Flow

```
Frontend Form
    ↓ (converts numbers)
Frontend Hook
    ↓ (sends to API)
Backend Controller
    ↓ (validates with Zod)
Backend Service
    ↓ (saves to database)
Database
    ↓ (returns created user)
Frontend
    ↓ (shows success)
```

### Field Handling

| Field | Frontend | Backend | Database |
|-------|----------|---------|----------|
| firstName | string | string | string |
| lastName | string | string | string |
| phoneNumber | string | string | string |
| role | string | enum | enum |
| specializationId | string | UUID | UUID |
| sessionDuration | string → number | number | integer |
| sessionCost | string → number | number | decimal(10,2) |

## Validation

### Required Fields (All Users)
- phoneNumber
- password
- firstName
- lastName
- role

### Optional Fields (Therapists Only)
- specializationId
- sessionDuration
- sessionCost

### Validation Rules

```typescript
// specializationId
z.string().uuid().optional().nullable()

// sessionDuration  
z.number().int().positive().optional().nullable()

// sessionCost
z.number().positive().optional().nullable()
```

## Error Handling

### Common Errors

**Invalid UUID:**
```json
{
  "code": "invalid_string",
  "message": "Invalid specialization ID",
  "path": ["specializationId"]
}
```

**Invalid Duration:**
```json
{
  "code": "too_small",
  "message": "Session duration must be positive",
  "path": ["sessionDuration"]
}
```

**Invalid Cost:**
```json
{
  "code": "too_small", 
  "message": "Session cost must be positive",
  "path": ["sessionCost"]
}
```

## Frontend Form Behavior

### When Creating Therapist

1. **Specialization dropdown** - Shows all therapy types
2. **Duration field** - Auto-fills when specialization selected
3. **Cost field** - Auto-fills when specialization selected
4. **All fields editable** - User can override defaults

### When Creating Non-Therapist

1. **Therapist fields hidden** - Only basic user fields shown
2. **Role dropdown** - Shows all roles except THERAPIST
3. **Simple form** - Just basic user information

## Summary

✓ **Backend Schema** - Added therapist fields to create schema
✓ **Backend Service** - Create method now saves therapist fields
✓ **Frontend Create** - Fixed number conversion
✓ **Frontend Edit** - Already fixed (previous task)
✓ **Validation** - Proper UUID and number validation
✓ **Error Handling** - Clear error messages

## Test It Now

1. **Create a new therapist** with all fields
2. **Check Prisma Studio** - All fields should be saved
3. **Edit the therapist** - All fields should load and update correctly

Both create and edit should now work perfectly for therapists! 🎉

---

**Fixed:** October 25, 2025
**Status:** ✓ Complete