# Task 20: Schedule and Calendar - TODO

## Status: IN PROGRESS 🚧

## What's Been Created
- ✅ `frontend/app/schedule/page.tsx` - Main schedule page with filters
- ✅ `frontend/components/ui/select.tsx` - Select dropdown component
- ✅ `frontend/components/ui/badge.tsx` - Badge component

## What Still Needs to Be Created

### 1. React Query Hooks
- [ ] `frontend/hooks/use-sessions.ts` - Session management hooks
- [ ] `frontend/hooks/use-therapists.ts` - Therapist data hooks
- [ ] `frontend/hooks/use-therapy-types.ts` - Therapy type hooks

### 2. Schedule Components
- [ ] `frontend/components/schedule/calendar.tsx` - Calendar grid component
- [ ] `frontend/components/schedule/session-list.tsx` - Session list for selected date

### 3. Additional Features (Optional)
- [ ] Session creation modal/form
- [ ] Session edit modal/form
- [ ] Session details modal
- [ ] Cancel session confirmation

## Implementation Notes

### Calendar Component Requirements
- Display month view with days grid
- Show sessions on each day
- Color-code by status (scheduled/completed/cancelled)
- Click day to view sessions
- Click session to view details
- Add session button on each day

### Session List Component Requirements
- Display sessions for selected date
- Sort by time
- Show patient, therapist, therapy type
- Action buttons (edit, cancel)
- Empty state when no sessions

### Hooks Requirements
All hooks should:
- Use React Query for caching
- Handle loading and error states
- Show toast notifications
- Invalidate cache on mutations
- Convert Decimal types to numbers

## Next Session Tasks
1. Create `use-sessions.ts` hook
2. Create `use-therapists.ts` hook
3. Create `use-therapy-types.ts` hook
4. Create `calendar.tsx` component
5. Create `session-list.tsx` component
6. Test the schedule page
7. Fix any Decimal type issues
8. Add to sidebar navigation

## Dependencies
- Backend sessions API (already exists)
- Backend therapists API (users with THERAPIST role)
- Backend therapy-types API (already exists)
- date-fns library (already installed)
- React Query (already configured)

## Testing Checklist
- [ ] Calendar displays current month
- [ ] Sessions show on correct dates
- [ ] Filters work (therapist, status)
- [ ] View modes switch (calendar/list)
- [ ] Click date shows sessions
- [ ] Stats display correctly
- [ ] No console errors
