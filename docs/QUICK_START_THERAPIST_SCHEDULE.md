# Quick Start: Therapist Schedule Management

## 🚀 What Is It?
A visual weekly calendar system for managing therapist availability and viewing booked sessions.

## 📍 Where to Find It
Navigate to: **`/therapists/[id]`** (Any therapist detail page)

## 👀 What You'll See

### Weekly Calendar
- **7 columns** for Monday through Sunday
- **Green boxes** = Available time slots
- **Blue boxes** = Booked sessions
- **Navigation buttons** to move between weeks
- **"Add Slot" button** to create new availability

## ⚡ Quick Actions

### View Schedule
1. Go to therapists list
2. Click any therapist
3. Scroll to "Weekly Schedule"
4. See available slots and booked sessions

### Add Availability Slot
1. Click **"Add Slot"** button
2. Select **day of week** (e.g., Monday)
3. Select **therapy type** (e.g., Speech Therapy)
4. Enter **start time** (e.g., 09:00)
5. Enter **end time** (e.g., 10:00)
6. Click **"Create"**
7. ✅ Slot appears on calendar

### Edit Availability Slot
1. Find slot on calendar
2. Click **pencil icon** (edit)
3. Change start/end times
4. Click **"Update"**
5. ✅ Changes saved

### Delete Availability Slot
1. Find slot on calendar
2. Click **trash icon** (delete)
3. Confirm deletion
4. ✅ Slot removed

## 🎨 Color Guide

### Green Boxes (Available)
```
🕐 09:00 - 10:00
Speech Therapy
[Edit] [Delete]
```
= Therapist is available for booking

### Blue Boxes (Booked)
```
🕐 14:00 - 14:50
John Doe
```
= Session already booked with patient

## 📅 Setup New Therapist

When you create a new therapist, set up their weekly schedule:

1. **Monday slots**
   - Add morning availability (e.g., 9:00-12:00)
   - Add afternoon availability (e.g., 14:00-17:00)

2. **Tuesday slots**
   - Repeat for each day they work

3. **Continue for all working days**

4. **Skip non-working days**
   - Leave Saturday/Sunday empty if they don't work

**Example Weekly Schedule:**
```
Monday:    09:00-12:00, 14:00-17:00
Tuesday:   09:00-12:00, 14:00-17:00
Wednesday: 09:00-12:00, 14:00-17:00
Thursday:  09:00-12:00, 14:00-17:00
Friday:    09:00-12:00, 14:00-17:00
Saturday:  (no slots)
Sunday:    (no slots)
```

## 🔄 Week Navigation

- **Previous** button = Go back one week
- **Today** button = Jump to current week
- **Next** button = Go forward one week

## ⚠️ Important Notes

### Time Slots
- Must be in HH:MM format (e.g., 09:00, 14:30)
- End time must be after start time
- Cannot overlap with existing slots

### Editing Restrictions
- Can change: Start time, end time
- Cannot change: Day of week, therapy type
- To change day/type: Delete and create new slot

### Permissions
- Only **admins** and **operators** can add/edit/delete
- Other users can view only

## 💡 Tips

### Best Practices
1. **Set up full week** at once for new therapists
2. **Use consistent time blocks** (e.g., hourly slots)
3. **Review booked sessions** before deleting slots
4. **Update schedule** when therapist availability changes

### Common Patterns
- **Full day**: 09:00-17:00 (one long slot)
- **Morning/Afternoon**: 09:00-12:00, 14:00-17:00 (two slots)
- **Hourly blocks**: 09:00-10:00, 10:00-11:00, etc. (multiple slots)

## 🐛 Troubleshooting

**Slot not appearing?**
- Check if you clicked "Create"
- Verify all fields are filled
- Check for error messages

**Can't edit slot?**
- Verify you're an admin/operator
- Check if slot still exists
- Try refreshing the page

**Overlapping error?**
- Check existing slots for same day
- Adjust time range to avoid overlap
- Delete conflicting slot if needed

## 📚 Full Documentation

For detailed information, see:
- `THERAPIST_SCHEDULE_MANAGEMENT_COMPLETE.md` - Complete documentation

## 🎉 That's It!

The therapist schedule management system is ready to use. Just navigate to any therapist's detail page and start managing their availability!

**Happy Scheduling!** 🗓️
