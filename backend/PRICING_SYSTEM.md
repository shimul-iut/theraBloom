# Therapist Pricing System

## Overview

The platform supports **flexible, therapist-specific pricing** for therapy sessions. Each therapist can have custom rates for different therapy types, with automatic fallback to default pricing.

## How It Works

### 1. Therapy Type Defaults

Each `TherapyType` has default pricing that applies to all therapists:

```typescript
TherapyType {
  name: "Physical Therapy"
  defaultCost: 50.00      // Default rate
  defaultDuration: 60     // Default duration in minutes
}
```

### 2. Therapist-Specific Pricing (Optional)

Admins can set custom pricing for specific therapist-therapy type combinations:

```typescript
TherapistPricing {
  therapistId: "therapist-a-id"
  therapyTypeId: "physical-therapy-id"
  sessionCost: 500.00     // Custom rate for this therapist
  sessionDuration: 60
}
```

### 3. Pricing Resolution Logic

When creating a session, the system:

1. **First** checks if therapist has custom pricing for that therapy type
2. **If found**: Uses the custom `sessionCost` and `sessionDuration`
3. **If not found**: Falls back to therapy type's `defaultCost` and `defaultDuration`

## Example Scenario

**Setup:**
- Physical Therapy: default cost = ₹50
- Speech Therapy: default cost = ₹40
- Therapist A: custom pricing for Physical Therapy = ₹500
- Therapist B: no custom pricing

**Results:**
- Therapist A + Physical Therapy = ₹500 (custom)
- Therapist A + Speech Therapy = ₹40 (default)
- Therapist B + Physical Therapy = ₹50 (default)
- Therapist B + Speech Therapy = ₹40 (default)

## Database Schema

```prisma
model TherapyType {
  id              String
  name            String
  defaultCost     Decimal  // Fallback pricing
  defaultDuration Int      // Fallback duration
  // ...
}

model TherapistPricing {
  id              String
  therapistId     String
  therapyTypeId   String
  sessionCost     Decimal  // Custom pricing
  sessionDuration Int      // Custom duration
  // ...
  
  @@unique([tenantId, therapistId, therapyTypeId])
}
```

## API Usage

### Get Session Pricing

```typescript
import { getSessionPricing } from './utils/pricing';

const pricing = await getSessionPricing(
  tenantId,
  therapistId,
  therapyTypeId
);

console.log(pricing);
// {
//   cost: 500,
//   duration: 60,
//   isCustomPricing: true
// }
```

### Get All Therapist Pricing

```typescript
import { getTherapistPricingList } from './utils/pricing';

const pricingList = await getTherapistPricingList(tenantId, therapistId);

console.log(pricingList);
// [
//   {
//     therapyTypeId: "...",
//     therapyTypeName: "Physical Therapy",
//     cost: 500,
//     duration: 60,
//     isCustomPricing: true
//   },
//   {
//     therapyTypeId: "...",
//     therapyTypeName: "Speech Therapy",
//     cost: 40,
//     duration: 30,
//     isCustomPricing: false  // Using default
//   }
// ]
```

## Admin Operations

### Set Custom Pricing

```typescript
await prisma.therapistPricing.create({
  data: {
    tenantId,
    therapistId,
    therapyTypeId,
    sessionCost: 500.00,
    sessionDuration: 60,
    active: true,
  },
});
```

### Update Custom Pricing

```typescript
await prisma.therapistPricing.update({
  where: {
    tenantId_therapistId_therapyTypeId: {
      tenantId,
      therapistId,
      therapyTypeId,
    },
  },
  data: {
    sessionCost: 600.00,
    sessionDuration: 75,
  },
});
```

### Remove Custom Pricing (Revert to Default)

```typescript
await prisma.therapistPricing.delete({
  where: {
    tenantId_therapistId_therapyTypeId: {
      tenantId,
      therapistId,
      therapyTypeId,
    },
  },
});
```

## Benefits

✅ **Flexible Pricing** - Different therapists can charge different rates
✅ **Easy Management** - Admins control pricing per therapist
✅ **Automatic Fallback** - No custom pricing needed for every combination
✅ **Transparent** - System clearly indicates custom vs default pricing
✅ **Scalable** - Works for any number of therapists and therapy types

## Future Enhancements

- Time-based pricing (peak hours, weekends)
- Package deals (bulk session discounts)
- Insurance rate integration
- Dynamic pricing based on demand
