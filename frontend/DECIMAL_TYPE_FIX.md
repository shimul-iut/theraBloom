# Decimal Type Fix for DataTable

## Problem
The DataTable was throwing an error:
```
TypeError: row.original.creditBalance.toFixed is not a function
```

## Root Cause
Prisma's `Decimal` type gets serialized as a **string** in JSON responses, not as a number. When the frontend tried to call `.toFixed()` on a string, it failed.

**Example:**
```json
{
  "creditBalance": "0",  // String, not number!
  "totalOutstandingDues": "0"  // String, not number!
}
```

## Solution
Updated `frontend/app/patients/page.tsx` to convert strings to numbers before calling `.toFixed()`:

```typescript
{
  accessorKey: 'creditBalance',
  header: 'Credit Balance',
  cell: ({ row }) => {
    const balance = Number(row.original.creditBalance) || 0;
    return `$${balance.toFixed(2)}`;
  },
},
{
  accessorKey: 'totalOutstandingDues',
  header: 'Outstanding',
  cell: ({ row }) => {
    const amount = Number(row.original.totalOutstandingDues) || 0;
    return (
      <span className={amount > 0 ? 'text-red-600 font-medium' : ''}>
        ${amount.toFixed(2)}
      </span>
    );
  },
},
```

The fix:
1. ✅ Converts string/Decimal values to numbers using `Number()`
2. ✅ Falls back to `0` if the value is invalid
3. ✅ Then safely calls `.toFixed(2)` on the number
4. ✅ Adds `$` prefix for currency display

## Testing
1. Navigate to `/patients` page
2. The DataTable should now display correctly with:
   - Credit Balance column showing `$0.00`
   - Outstanding column showing `$0.00` (or red if > 0)
3. No more TypeError!

## Files Changed
- `frontend/app/patients/page.tsx` - Fixed Decimal type handling in table columns
