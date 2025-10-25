# Quick Start: Therapist Availability Checker

## 🚀 What Is It?
A real-time UI component that shows therapist availability, conflicts, and existing sessions when creating therapy sessions.

## 📍 Where to Find It
Navigate to: **`/schedule/new`** (Schedule New Session page)

## ⚡ How It Works

### Automatic Display
The checker appears automatically when you fill in:
1. ✅ Patient
2. ✅ Therapist  
3. ✅ Date
4. ✅ Start Time (End time auto-calculates)

### What It Shows
- **Availability Status**: ✅ Available or ❌ Not Available
- **Schedule Check**: Is therapist working at this time?
- **Conflict Check**: Any overlapping sessions?
- **Existing Sessions**: All sessions for that date

## 🎨 Visual Guide

### ✅ Available (Green)
```
✅ Available
This time slot is available for booking.

Schedule: ✅ Within Schedule
Conflicts: ✅ No Conflicts
```
**Action:** Proceed with booking

### ❌ Not Available (Red)
```
❌ Not Available
Cannot book this time slot.

Schedule: ❌ Outside Schedule
Conflicts: ✅ No Conflicts

⚠️ Therapist not scheduled to work at this time.
```
**Action:** Choose different time or therapist

### ⚠️ Conflict (Red)
```
❌ Not Available
Cannot book this time slot.

Schedule: ✅ Within Schedule
Conflicts: ⚠️ Conflict Detected

Existing Sessions:
- John Doe (14:00 - 14:50) [Booked]

⚠️ Time slot overlaps with existing session.
```
**Action:** Choose different time

## 🔄 Real-Time Updates
Changes automatically when you modify:
- Therapist selection
- Date selection
- Time selection

## 📱 Works Everywhere
- ✅ Desktop
- ✅ Tablet
- ✅ Mobile
- ✅ All browsers

## 🎯 Quick Tips

### For Best Results
1. Fill fields in order: Patient → Therapist → Date → Time
2. Watch the checker status (green = good, red = adjust)
3. Review existing sessions to plan around busy times
4. Read the messages for helpful suggestions

### Common Issues

**Checker not appearing?**
- Make sure all fields are filled
- Check that date is selected
- Verify start time is entered

**Shows "Outside Schedule"?**
- Check therapist's working hours
- Select time within their schedule

**Shows "Conflict Detected"?**
- Look at existing sessions list
- Choose different time slot

## 📚 Full Documentation

For detailed information, see:
- `AVAILABILITY_CHECKER_SUMMARY.md` - Overview
- `THERAPIST_AVAILABILITY_CHECKER.md` - Technical docs
- `AVAILABILITY_CHECKER_VISUAL_GUIDE.md` - Visual examples
- `TEST_AVAILABILITY_CHECKER.md` - Testing guide

## 🎉 That's It!

The availability checker is ready to use. Just open `/schedule/new` and start creating sessions. The checker will guide you through the process automatically.

**Happy Scheduling!** 🗓️
