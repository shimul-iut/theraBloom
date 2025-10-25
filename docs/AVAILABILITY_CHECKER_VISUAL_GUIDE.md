# Therapist Availability Checker - Visual Guide

## Where to Find It

The availability checker appears automatically in the **Schedule New Session** page when you fill in the required fields.

**Location:** `/schedule/new`

## How It Appears

### Initial State (Hidden)
When you first open the form, the availability checker is hidden until you provide the necessary information.

```
┌─────────────────────────────────────────┐
│ Session Details                         │
├─────────────────────────────────────────┤
│ Patient: [Select patient ▼]            │
│ Therapist: [Select therapist ▼]        │
│ Therapy Type: [Auto-selected]          │
│ Date: [Select date]                    │
│ Start Time: [--:--]                    │
│ End Time: [Auto-calculated]            │
│ Notes: [Optional]                      │
└─────────────────────────────────────────┘

[Create Session]
```

### Loading State
When all fields are filled, the checker appears and shows a loading state:

```
┌─────────────────────────────────────────┐
│ Session Details                         │
├─────────────────────────────────────────┤
│ Patient: John Doe                      │
│ Therapist: Dr. Sarah Smith             │
│ Therapy Type: Speech Therapy           │
│ Date: 2025-10-25                       │
│ Start Time: 14:00                      │
│ End Time: 14:50                        │
│ Notes: [Optional]                      │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 🕐 Checking Availability...             │
├─────────────────────────────────────────┤
│ ⟳ Verifying therapist schedule...      │
└─────────────────────────────────────────┘

[Create Session]
```

## Visual States

### 1. ✅ Available (Green - Good to Go!)

```
┌─────────────────────────────────────────────────────────┐
│ 🕐 Availability Check                                   │
│ Dr. Sarah Smith on 10/25/2025 at 14:00 - 14:50        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ ✅ Available                                     │   │
│ │ This time slot is available for booking.        │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ Schedule Availability        ✅ Within Schedule        │
│ ─────────────────────────────────────────────────────  │
│ Scheduling Conflicts         ✅ No Conflicts           │
│ ─────────────────────────────────────────────────────  │
│                                                         │
│ No other sessions scheduled for this date              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 2. ❌ Not Available - Outside Schedule

```
┌─────────────────────────────────────────────────────────┐
│ 🕐 Availability Check                                   │
│ Dr. Sarah Smith on 10/25/2025 at 20:00 - 20:50        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ ❌ Not Available                                 │   │
│ │ This time slot cannot be booked due to          │   │
│ │ conflicts or schedule restrictions.             │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ Schedule Availability        ❌ Outside Schedule       │
│ ─────────────────────────────────────────────────────  │
│ Scheduling Conflicts         ✅ No Conflicts           │
│ ─────────────────────────────────────────────────────  │
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ ⚠️ The therapist is not scheduled to work       │   │
│ │    during this time. Please check their         │   │
│ │    availability schedule or choose a            │   │
│ │    different time.                              │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 3. ❌ Not Available - Scheduling Conflict

```
┌─────────────────────────────────────────────────────────┐
│ 🕐 Availability Check                                   │
│ Dr. Sarah Smith on 10/25/2025 at 14:00 - 14:50        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ ❌ Not Available                                 │   │
│ │ This time slot cannot be booked due to          │   │
│ │ conflicts or schedule restrictions.             │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ Schedule Availability        ✅ Within Schedule        │
│ ─────────────────────────────────────────────────────  │
│ Scheduling Conflicts         ⚠️ Conflict Detected      │
│ ─────────────────────────────────────────────────────  │
│                                                         │
│ 🕐 Existing Sessions on This Date                      │
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ John Doe                              [Booked]  │   │
│ │ 14:00 - 14:50                                   │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Jane Smith                            [Booked]  │   │
│ │ 15:00 - 15:50                                   │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ ⚠️ This time slot overlaps with an existing     │   │
│ │    session. Please select a different time.     │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 4. ✅ Available with Other Sessions (No Conflict)

```
┌─────────────────────────────────────────────────────────┐
│ 🕐 Availability Check                                   │
│ Dr. Sarah Smith on 10/25/2025 at 16:00 - 16:50        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ ✅ Available                                     │   │
│ │ This time slot is available for booking.        │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ Schedule Availability        ✅ Within Schedule        │
│ ─────────────────────────────────────────────────────  │
│ Scheduling Conflicts         ✅ No Conflicts           │
│ ─────────────────────────────────────────────────────  │
│                                                         │
│ 🕐 Existing Sessions on This Date                      │
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ John Doe                              [Booked]  │   │
│ │ 10:00 - 10:50                                   │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Jane Smith                            [Booked]  │   │
│ │ 14:00 - 14:50                                   │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Color Coding

### Status Badges

**Available (Green)**
```
✅ Within Schedule    ✅ No Conflicts
```

**Warning (Yellow/Orange)**
```
⚠️ Conflict Detected
```

**Error (Red)**
```
❌ Outside Schedule
```

### Alert Boxes

**Success (Green background)**
```
┌─────────────────────────────────────┐
│ ✅ Available                         │
│ This time slot is available.        │
└─────────────────────────────────────┘
```

**Error (Red background)**
```
┌─────────────────────────────────────┐
│ ❌ Not Available                     │
│ Cannot book this time slot.         │
└─────────────────────────────────────┘
```

**Warning (Yellow background)**
```
┌─────────────────────────────────────┐
│ ⚠️ The therapist is not scheduled   │
│    to work during this time.        │
└─────────────────────────────────────┘
```

## Interactive Behavior

### Real-Time Updates

The availability checker updates automatically when you change:

1. **Therapist Selection**
   ```
   Change: Dr. Smith → Dr. Johnson
   Result: Checker updates with Dr. Johnson's availability
   ```

2. **Date Selection**
   ```
   Change: Oct 25 → Oct 26
   Result: Shows availability for Oct 26
   ```

3. **Time Selection**
   ```
   Change: 14:00 → 15:00
   Result: Checks new time slot availability
   ```

### Auto-Hide Behavior

The checker automatically hides when:
- Therapist is not selected
- Date is not selected
- Start time is not entered
- End time is not calculated

This keeps the form clean and only shows relevant information.

## Mobile View

On mobile devices, the checker adapts to smaller screens:

```
┌─────────────────────────┐
│ 🕐 Availability Check   │
│ Dr. Smith               │
│ 10/25/2025              │
│ 14:00 - 14:50          │
├─────────────────────────┤
│                         │
│ ✅ Available            │
│ This time slot is       │
│ available for booking.  │
│                         │
│ Schedule: ✅ Within     │
│ Conflicts: ✅ None      │
│                         │
│ No other sessions       │
│                         │
└─────────────────────────┘
```

## Tips for Admins

### ✅ Best Practices

1. **Fill fields in order**
   - Patient → Therapist → Date → Time
   - This ensures smooth auto-calculations

2. **Watch the checker**
   - Green = Good to go
   - Red = Need to adjust

3. **Check existing sessions**
   - See what else is scheduled
   - Plan around busy times

4. **Use the feedback**
   - Read the messages
   - Follow the suggestions

### ⚠️ Common Issues

**"Outside Schedule" message?**
- Check therapist's working hours
- Select a time within their schedule
- Contact admin if schedule needs updating

**"Conflict Detected" message?**
- Look at existing sessions list
- Choose a different time slot
- Consider another therapist if urgent

**Checker not appearing?**
- Make sure all fields are filled
- Check that date is selected
- Verify start time is entered

## Keyboard Navigation

The checker is fully keyboard accessible:

- `Tab` - Navigate through elements
- `Enter` - Interact with buttons
- `Esc` - Close modals (if any)
- Screen reader compatible

## Print View

When printing the page, the availability checker shows:
- Current status
- Therapist and time details
- Any warnings or conflicts
- List of existing sessions

---

**Pro Tip:** The availability checker saves you time by showing conflicts before you submit the form. Always check the status before clicking "Create Session"!
