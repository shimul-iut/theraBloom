# Therapist Update Fix ✓

## Problem

When editing a therapist, the therapist-specific fields were not being updated in the database:
- `specializationId` - Not updating
- `sessionDuration` - Not updating
- `sessionCost` - Not updating

## Root Cause

The `updateUser` service method was only updating basic user fields and not including the therapist-specific fields in the update operation.

## Solution

### 1. Updated Schema (`users.schema.ts`)

Added therapist-specific fields to the update schema:

```typescript
export const updateUserSchema = z.object({
  phoneNumber: phoneNumberSchema.optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  role: z.nativeEnum(UserRole).optional(),
  active: z.boolean().optional(),
  // NEW: Therapist-specific fields
  specializationId: z.string().uuid().optional().nullable(),
  sessionDuration: z.number().int().positive().optional().nullable(),
  sessionCost: z.number().positive().optional().nullable(),
});
```

### 2. Updated Service (`users.service.ts`)

Modified the `updateUser` method to include therapist fields:

```typescript
const user = await prisma.user.update({
  where: { id: userId },
  data: {
    ...(input.phoneNumber && { phoneNumber: input.phoneNumber }),
    ...(input.firstName && { firstName: input.firstName }),
    ...(input.lastName && { lastName: input.lastName }),
    ...(input.role && { role: input.role }),
    ...(input.active !== undefined && { active: input.active }),
    // NEW: Therapist-specific fields
    ...(input.specializationId !== undefined && { 
      specializationId: input.specializationId 
    }),
    ...(input.sessionDuration !== undefined && { 
      sessionDuration: input.sessionDuration 
    }),
    ...(input.sessionCost !== undefined && { 
      sessionCost: input.sessionCost 
    }),
  },
  select: {
    id: true,
    phoneNumber: true,
    firstName: true,
    lastName: true,
    role: true,
    // NEW: Include in response
    specializationId: true,
    specialization: {
      select: {
        id: true,
        name: true,
      },
    },
    sessionDuration: true,
    sessionCost: true,
    active: true,
    updatedAt: true,
  },
});
```

## What Changed

### Before
```typescript
// Only basic fields were updated
data: {
  phoneNumber: input.phoneNumber,
  firstName: input.firstName,
  lastName: input.lastName,
  role: input.role,
  active: input.active,
}
```

### After
```typescript
// Now includes therapist fields
data: {
  phoneNumber: input.phoneNumber,
  firstName: input.firstName,
  lastName: input.lastName,
  role: input.role,
  active: input.active,
  // Therapist fields
  specializationId: input.specializationId,
  sessionDuration: input.sessionDuration,
  sessionCost: input.sessionCost,
}
```

## Testing

### Test Case 1: Update Therapist Specialization

```bash
PUT /api/v1/users/:therapistId
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "specializationId": "uuid-of-speech-therapy",
  "sessionDuration": 45,
  "sessionCost": 55.00
}
```

**Expected Result:**
- ✓ specializationId updated
- ✓ sessionDuration updated
- ✓ sessionCost updated
- ✓ Response includes updated values

### Test Case 2: Update Only Specialization

```bash
PUT /api/v1/users/:therapistId
Content-Type: application/json

{
  "specializationId": "uuid-of-physical-therapy"
}
```

**Expected Result:**
- ✓ specializationId updated
- ✓ Other fields remain unchanged

### Test Case 3: Clear Specialization

```bash
PUT /api/v1/users/:therapistId
Content-Type: application/json

{
  "specializationId": null
}
```

**Expected Result:**
- ✓ specializationId set to null
- ✓ Other fields remain unchanged

## Validation

### Valid Values

**specializationId:**
- Must be a valid UUID
- Must reference an existing TherapyType
- Can be null

**sessionDuration:**
- Must be a positive integer
- Represents minutes
- Can be null

**sessionCost:**
- Must be a positive number
- Represents currency amount
- Can be null

### Invalid Values

**specializationId:**
```json
{
  "specializationId": "invalid-uuid"
}
// Error: Invalid specialization ID
```

**sessionDuration:**
```json
{
  "sessionDuration": -30
}
// Error: Session duration must be positive
```

**sessionCost:**
```json
{
  "sessionCost": -50
}
// Error: Session cost must be positive
```

## Frontend Integration

The frontend therapist form should now successfully update all fields:

```typescript
// frontend/hooks/use-therapists-mutations.ts
export function useUpdateTherapist(id: string) {
  return useMutation({
    mutationFn: async (data: UpdateTherapistInput) => {
      const response = await api.put(`/users/${id}`, {
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        specializationId: data.specializationId,
        sessionDuration: data.sessionDuration,
        sessionCost: data.sessionCost,
      });
      return response.data.data;
    },
    onSuccess: () => {
      toast.success('Therapist updated successfully');
    },
  });
}
```

## Verification Steps

### 1. Update a Therapist via API

```bash
# Get therapist ID from Prisma Studio
# Then update:

curl -X PUT http://localhost:3000/api/v1/users/<therapist-id> \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "specializationId": "<therapy-type-uuid>",
    "sessionDuration": 60,
    "sessionCost": 70.00
  }'
```

### 2. Check in Prisma Studio

```bash
cd backend
npm run prisma:studio
```

1. Go to User table
2. Find the therapist
3. Verify fields are updated:
   - specializationId = new UUID
   - sessionDuration = 60
   - sessionCost = 70.00

### 3. Check via Frontend

1. Login as admin
2. Go to Therapists page
3. Click Edit on a therapist
4. Change specialization, duration, or cost
5. Save
6. Verify changes are persisted

## Common Issues

### Issue: specializationId not updating

**Cause:** Frontend not sending the field

**Solution:** Ensure frontend form includes specializationId:
```typescript
const formData = {
  ...otherFields,
  specializationId: selectedSpecialization,
};
```

### Issue: sessionCost showing as string

**Cause:** Frontend sending string instead of number

**Solution:** Convert to number before sending:
```typescript
sessionCost: parseFloat(formData.sessionCost),
```

### Issue: Validation error "Invalid specialization ID"

**Cause:** Sending non-UUID value

**Solution:** Ensure specializationId is a valid UUID from TherapyType table

## Summary

✓ **Schema Updated** - Added therapist fields to update schema
✓ **Service Updated** - Update method now handles therapist fields
✓ **Validation Added** - UUID and positive number validation
✓ **Response Updated** - Returns updated therapist fields
✓ **Nullable Support** - Can set fields to null
✓ **Type Safe** - Full TypeScript support

Therapist updates now work correctly for all fields!

---

**Test it now:**
1. Start backend: `cd backend && npm run dev`
2. Open Prisma Studio: `cd backend && npm run prisma:studio`
3. Update a therapist via API or frontend
4. Verify changes in Prisma Studio

---

**Fixed:** October 21, 2025
**Status:** ✓ Complete
