# 📍 Where to Find Break & Unavailability Features

## Current Status

✅ **Break Slots** - IMPLEMENTED & VISIBLE IN UI  
⏳ **Unavailability Management** - Backend ready, Frontend UI pending

## Where to Access Break Slots

### Location: Therapist Detail Page
**URL**: `/therapists/[id]`

### Steps to Use:

1. **Navigate to Therapists**
   - Go to `/therapists` in your app
   - Click on any therapist

2. **Find the Availability Section**
   - Scroll down to "Availability Setup" card
   - Click "Add Availability Slot" button

3. **Add a Break Slot**
   - Select day of week (e.g., Monday)
   - Select therapy type
   - **NEW**: Select "Slot Type"
     - Choose "Break Time (No Sessions)" for breaks
     - Choose "Available for Sessions" for regular availability
   - Set start and end time
   - Click "Create"

4. **View Break Slots on Calendar**
   - Break slots appear in **ORANGE** color
   - Regular availability appears in **GREEN** color
   - Booked sessions appear in **BLUE** color
   - Shows "☕ Break Time" label

## Visual Guide

### Add Availability Slot Dialog

```
┌─────────────────────────────────────┐
│ Add Availability Slot          [X]  │
├─────────────────────────────────────┤
│                                     │
│ Day of Week *                       │
│ [Monday ▼]                          │
│                                     │
│ Therapy Type *                      │
│ [Speech Therapy ▼]                  │
│                                     │
│ Slot Type *                         │
│ ○ Available for Sessions            │
│ ● Break Time (No Sessions)          │  ← NEW!
│                                     │
│ Start Time *      End Time *        │
│ [12:00]           [13:00]           │
│                                     │
│           [Cancel]  [Create]        │
└─────────────────────────────────────┘
```

### Calendar View

```
Monday
┌─────────────────┐
│ 🕐 09:00        │  ← Green (Available)
│ Speech Therapy  │
└─────────────────┘

┌─────────────────┐
│ 🕐 12:00        │  ← Orange (Break)
│ ☕ Break Time   │  ← NEW!
└─────────────────┘

┌─────────────────┐
│ 🕐 14:00    [X] │  ← Blue (Booked)
│ 👤 John Doe     │
└─────────────────┘
```

### Legend (Bottom of Calendar)

```
[Green Box] Available Slots
[Orange Box] Break Time        ← NEW!
[Blue Box] Booked Sessions
```

## What Works Now

✅ **Add Break Slots**
- Select "Break Time" when creating availability
- Break slots shown in orange color
- Labeled as "☕ Break Time"

✅ **Edit Break Slots**
- Click edit icon on any slot
- Change slot type between Available/Break
- Update times

✅ **Delete Break Slots**
- Click delete icon (X) on any slot
- Confirmation required

✅ **Visual Distinction**
- Green = Available for booking
- Orange = Break time (no booking)
- Blue = Already booked

✅ **Prevents Booking**
- Backend prevents session booking during break slots
- Break slots don't show as available in time-slot calendar

## What's Coming Next (Unavailability Management)

The following features are **backend-ready** but need frontend UI:

### 1. Mark Slot/Day Unavailable
- Button: "Mark Unavailable"
- Select date range
- Select reason (sick leave, vacation, etc.)
- See affected sessions
- Reschedule options

### 2. Manage Leaves
- View all unavailability periods
- Edit/delete leaves
- See affected sessions

### 3. Bulk Reschedule
- When marking unavailable
- See all affected sessions
- Choose new slots from dropdown
- Reschedule all at once

## Quick Test

### Test Break Slot Feature:

1. Go to: `http://localhost:3001/therapists/[any-therapist-id]`
2. Click "Add Availability Slot"
3. Fill in:
   - Day: Monday
   - Therapy Type: Any
   - **Slot Type: Break Time (No Sessions)**
   - Time: 12:00 - 13:00
4. Click "Create"
5. See orange break slot on calendar!

### Expected Result:
- Orange colored slot appears
- Shows "☕ Break Time" label
- Cannot book sessions during this time
- Edit/delete buttons work

## Files Modified

### Frontend
1. `frontend/hooks/use-therapist-availability.ts`
   - Added `SlotType` type
   - Added `slotType` field to interfaces

2. `frontend/components/therapist/availability-slot-form.tsx`
   - Added slot type selector
   - Visual indicators for each type
   - Help text explaining each option

3. `frontend/components/therapist/weekly-availability-calendar.tsx`
   - Orange color for break slots
   - "☕ Break Time" label
   - Updated legend

### Backend (Already Complete)
- Database schema with `slotType` field
- API endpoints support break slots
- Validation and business logic

## Summary

**You can use break slots RIGHT NOW!**

Just go to any therapist's detail page and add an availability slot with "Break Time" selected. It will appear in orange on the calendar and prevent session bookings during that time.

The unavailability management features (marking days off, rescheduling, etc.) are coming next and will be added to the same page.

---

**Ready to test?** Navigate to `/therapists/[id]` and click "Add Availability Slot"!
