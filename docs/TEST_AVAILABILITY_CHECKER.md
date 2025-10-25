# Testing the Therapist Availability Checker

## Quick Start Testing

### Prerequisites
1. ✅ Backend server running
2. ✅ Frontend server running
3. ✅ At least one therapist in the database
4. ✅ At least one patient in the database
5. ✅ Therapist has availability schedule set up

### Test Location
Navigate to: `http://localhost:3001/schedule/new`

## Test Scenarios

### Test 1: Basic Availability Check ✅

**Steps:**
1. Open `/schedule/new`
2. Select a patient
3. Select a therapist
4. Select today's date or a future date
5. Enter start time: `14:00`
6. Wait for end time to auto-calculate

**Expected Result:**
- Availability checker appears below the form
- Shows loading spinner briefly
- Displays availability status (green or red)
- Shows "Schedule Availability" and "Scheduling Conflicts" badges

**Pass Criteria:**
- ✅ Checker appears automatically
- ✅ Shows correct therapist name and time
- ✅ Displays availability status
- ✅ No console errors

---

### Test 2: Available Time Slot ✅

**Setup:**
- Therapist has availability schedule for the selected day
- No existing sessions at the selected time

**Steps:**
1. Select therapist with availability
2. Select a date when therapist works
3. Enter a time within their working hours
4. Ensure no conflicts exist

**Expected Result:**
```
✅ Available
This time slot is available for booking.

Schedule Availability: ✅ Within Schedule
Scheduling Conflicts: ✅ No Conflicts

No other sessions scheduled for this date
```

**Pass Criteria:**
- ✅ Green "Available" status
- ✅ Both badges show green checkmarks
- ✅ Message says "available for booking"
- ✅ Can submit form successfully

---

### Test 3: Outside Working Hours ⚠️

**Setup:**
- Therapist works 9:00 AM - 5:00 PM
- Try to book at 8:00 PM

**Steps:**
1. Select therapist
2. Select a date
3. Enter start time: `20:00` (8:00 PM)
4. Wait for checker to update

**Expected Result:**
```
❌ Not Available
This time slot cannot be booked.

Schedule Availability: ❌ Outside Schedule
Scheduling Conflicts: ✅ No Conflicts

⚠️ The therapist is not scheduled to work during this time.
```

**Pass Criteria:**
- ✅ Red "Not Available" status
- ✅ "Outside Schedule" badge shows red X
- ✅ Warning message appears
- ✅ Helpful suggestion provided

---

### Test 4: Scheduling Conflict ⚠️

**Setup:**
- Create an existing session at 2:00 PM - 2:50 PM
- Try to book at 2:30 PM - 3:20 PM (overlapping)

**Steps:**
1. Select same therapist
2. Select same date
3. Enter start time: `14:30` (2:30 PM)
4. Wait for checker to update

**Expected Result:**
```
❌ Not Available
This time slot cannot be booked.

Schedule Availability: ✅ Within Schedule
Scheduling Conflicts: ⚠️ Conflict Detected

Existing Sessions on This Date:
- Patient Name (14:00 - 14:50) [Booked]

⚠️ This time slot overlaps with an existing session.
```

**Pass Criteria:**
- ✅ Red "Not Available" status
- ✅ "Conflict Detected" badge shows warning
- ✅ Existing session is listed
- ✅ Shows patient name and time
- ✅ Warning message explains the issue

---

### Test 5: Multiple Existing Sessions (No Conflict) ✅

**Setup:**
- Existing sessions at 10:00 AM and 2:00 PM
- Try to book at 12:00 PM (no overlap)

**Steps:**
1. Select therapist with multiple sessions
2. Select same date
3. Enter start time: `12:00` (noon)
4. Wait for checker to update

**Expected Result:**
```
✅ Available
This time slot is available for booking.

Schedule Availability: ✅ Within Schedule
Scheduling Conflicts: ✅ No Conflicts

Existing Sessions on This Date:
- Patient A (10:00 - 10:50) [Booked]
- Patient B (14:00 - 14:50) [Booked]
```

**Pass Criteria:**
- ✅ Green "Available" status
- ✅ Shows all existing sessions
- ✅ No conflict detected
- ✅ Can see full day schedule

---

### Test 6: Real-Time Updates 🔄

**Steps:**
1. Fill form with therapist A, date, and time
2. Wait for checker to load
3. Change therapist to therapist B
4. Observe checker updates
5. Change date
6. Observe checker updates again
7. Change start time
8. Observe checker updates again

**Expected Result:**
- Checker shows loading state on each change
- Updates with new availability data
- Shows correct therapist name
- Shows correct date and time
- No stale data displayed

**Pass Criteria:**
- ✅ Updates on therapist change
- ✅ Updates on date change
- ✅ Updates on time change
- ✅ Shows loading state during updates
- ✅ No flickering or UI glitches

---

### Test 7: Auto-Hide Behavior 👻

**Steps:**
1. Fill all form fields (checker appears)
2. Clear the therapist field
3. Observe checker disappears
4. Select therapist again
5. Observe checker reappears
6. Clear the date field
7. Observe checker disappears

**Expected Result:**
- Checker hides when required fields are empty
- Checker shows when all fields are filled
- Smooth transition (no jarring jumps)

**Pass Criteria:**
- ✅ Hides when therapist is cleared
- ✅ Hides when date is cleared
- ✅ Hides when time is cleared
- ✅ Shows when all fields are filled
- ✅ Smooth animations

---

### Test 8: Loading State ⏳

**Steps:**
1. Open browser DevTools → Network tab
2. Throttle network to "Slow 3G"
3. Fill form fields
4. Observe loading state

**Expected Result:**
```
Checking Availability...
⟳ Verifying therapist schedule...
```

**Pass Criteria:**
- ✅ Shows loading spinner
- ✅ Shows "Checking Availability" message
- ✅ Doesn't show stale data
- ✅ Transitions smoothly to result

---

### Test 9: Error Handling ❌

**Steps:**
1. Stop the backend server
2. Fill form fields
3. Observe error handling
4. Restart backend server
5. Change a field to retry

**Expected Result:**
- Checker handles error gracefully
- Shows error message or hides
- Doesn't crash the page
- Recovers when backend is back

**Pass Criteria:**
- ✅ No console errors crash the app
- ✅ Graceful error handling
- ✅ Can recover after backend restart
- ✅ User can still use the form

---

### Test 10: Form Submission 📝

**Scenario A: Available Slot**
1. Fill form with available time slot
2. Checker shows green "Available"
3. Click "Create Session"
4. Observe success

**Expected:** Session created successfully

**Scenario B: Unavailable Slot**
1. Fill form with conflicting time slot
2. Checker shows red "Not Available"
3. Click "Create Session"
4. Observe error from backend

**Expected:** Backend returns conflict error

**Pass Criteria:**
- ✅ Available slots can be submitted
- ✅ Unavailable slots show backend error
- ✅ Error messages are user-friendly
- ✅ Form validation works

---

## API Testing

### Test API Directly

```bash
# Test 1: Available slot
curl -X GET "http://localhost:3000/api/v1/sessions/check-availability?therapistId=THERAPIST_UUID&date=2025-10-25&startTime=14:00&endTime=14:50" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Expected Response:
{
  "success": true,
  "data": {
    "available": true,
    "hasAvailabilitySchedule": true,
    "hasConflict": false,
    "therapist": {
      "id": "uuid",
      "name": "Dr. Smith"
    },
    "date": "2025-10-25",
    "startTime": "14:00",
    "endTime": "14:50",
    "existingSessions": []
  }
}
```

```bash
# Test 2: Missing parameters
curl -X GET "http://localhost:3000/api/v1/sessions/check-availability?therapistId=THERAPIST_UUID" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected Response:
{
  "success": false,
  "error": {
    "code": "MISSING_PARAMETERS",
    "message": "therapistId, date, startTime, and endTime are required"
  }
}
```

```bash
# Test 3: Invalid therapist
curl -X GET "http://localhost:3000/api/v1/sessions/check-availability?therapistId=invalid-uuid&date=2025-10-25&startTime=14:00&endTime=14:50" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected Response:
{
  "success": false,
  "error": {
    "code": "CHECK_AVAILABILITY_FAILED",
    "message": "Failed to check availability"
  }
}
```

---

## Browser Testing

### Desktop Browsers
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)

### Mobile Browsers
- [ ] Chrome Mobile
- [ ] Safari iOS
- [ ] Samsung Internet

### Screen Sizes
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

---

## Accessibility Testing

### Keyboard Navigation
1. Tab through the form
2. Verify checker is reachable
3. Test with screen reader
4. Check focus indicators

**Pass Criteria:**
- ✅ All elements are keyboard accessible
- ✅ Focus indicators are visible
- ✅ Screen reader announces status
- ✅ Logical tab order

### Color Contrast
1. Check green "Available" status
2. Check red "Not Available" status
3. Check warning messages
4. Verify text readability

**Pass Criteria:**
- ✅ Meets WCAG AA standards
- ✅ Text is readable
- ✅ Icons supplement colors
- ✅ Works for color-blind users

---

## Performance Testing

### Load Time
1. Open DevTools → Performance
2. Fill form fields
3. Measure checker load time

**Target:** < 500ms for availability check

### Network Requests
1. Open DevTools → Network
2. Fill form fields
3. Count API requests

**Expected:** 1 request per field change (debounced)

### Memory Usage
1. Open DevTools → Memory
2. Change fields multiple times
3. Check for memory leaks

**Expected:** No significant memory increase

---

## Regression Testing

After any code changes, verify:

- [ ] Checker still appears automatically
- [ ] All status indicators work
- [ ] Existing sessions display correctly
- [ ] Real-time updates work
- [ ] Form submission works
- [ ] No console errors
- [ ] No visual glitches
- [ ] Mobile view works

---

## Bug Reporting Template

If you find a bug, report it with:

```markdown
**Bug Title:** [Brief description]

**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happened]

**Screenshots:**
[Attach screenshots]

**Environment:**
- Browser: [Chrome 120]
- OS: [Windows 11]
- Screen Size: [1920x1080]

**Console Errors:**
[Paste any console errors]
```

---

## Test Checklist Summary

### Must Pass ✅
- [ ] Checker appears when all fields filled
- [ ] Shows available status correctly
- [ ] Shows unavailable status correctly
- [ ] Detects scheduling conflicts
- [ ] Shows existing sessions
- [ ] Updates on field changes
- [ ] Hides when fields are empty
- [ ] No console errors
- [ ] Works on mobile
- [ ] Keyboard accessible

### Nice to Have 🎯
- [ ] Smooth animations
- [ ] Fast load times (< 500ms)
- [ ] Works offline gracefully
- [ ] Helpful error messages
- [ ] Print-friendly

---

## Success Criteria

The availability checker is considered **production-ready** when:

✅ All "Must Pass" tests pass  
✅ No critical bugs found  
✅ Works on all major browsers  
✅ Mobile responsive  
✅ Accessible (WCAG AA)  
✅ Performance targets met  
✅ API returns correct data  
✅ User feedback is positive  

---

**Happy Testing! 🎉**

If you encounter any issues, refer to:
- `THERAPIST_AVAILABILITY_CHECKER.md` - Technical documentation
- `AVAILABILITY_CHECKER_VISUAL_GUIDE.md` - Visual examples
- `AVAILABILITY_CHECKER_COMPLETE.md` - Implementation summary
