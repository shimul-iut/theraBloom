# Patient Pages Decimal Type Fix

## Problem
The patient details page was displaying Decimal values (creditBalance and totalOutstandingDues) without proper formatting, which could cause errors when trying to use number methods.

## Solution
Updated `frontend/app/patients/[id]/page.tsx` to convert Decimal strings to numbers before displaying:

### Before:
```typescript
<p className="text-2xl font-bold text-green-600">
  ${patient.creditBalance}
</p>
<p className={`text-2xl font-bold ${patient.totalOutstandingDues > 0 ? 'text-red-600' : 'text-gray-600'}`}>
  ${patient.totalOutstandingDues}
</p>
```

### After:
```typescript
const creditBalance = Number(patient.creditBalance) || 0;
const outstandingDues = Number(patient.totalOutstandingDues) || 0;

<p className="text-2xl font-bold text-green-600">
  ${creditBalance.toFixed(2)}
</p>
<p className={`text-2xl font-bold ${outstandingDues > 0 ? 'text-red-600' : 'text-gray-600'}`}>
  ${outstandingDues.toFixed(2)}
</p>
```

## Files Changed
- `frontend/app/patients/[id]/page.tsx` - Fixed Decimal type handling in financial summary
- `frontend/app/patients/[id]/edit/page.tsx` - No changes needed (doesn't display Decimal fields)

## Testing
1. Navigate to `/patients` page
2. Click the eye icon to view a patient's details
3. The Financial Summary card should display:
   - Credit Balance: `$0.00` (in green)
   - Outstanding Dues: `$0.00` (in gray/red)
4. No TypeError should occur!

## Result
✅ Patient details page now displays currency values correctly with proper formatting
✅ Edit patient page works without issues
