# Audit Logging System - Key Features

## ✅ Confirmed Features

### 1. Date/Date Range Filtering

**Preset Date Ranges:**
- Today
- Yesterday
- Last 7 days
- Last 30 days
- Custom range (with calendar picker)

**Implementation:**
- Visual date range picker with calendar UI
- Quick preset buttons for common ranges
- From/To date inputs
- Clear date filter option

**UI Location:**
- Main filter panel on audit logs page
- Prominent placement at top of filters

---

### 2. Contextual Audit Log Links

**Integration Points:**

#### Patient Detail Page
```
┌─────────────────────────────────────┐
│ Patient: John Doe                   │
│ ┌─────────────────────────────────┐ │
│ │ 📋 View Audit History (12)      │ │ ← Button with count
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```
- Shows count of audit log entries
- Pre-filters by Patient + patient ID
- Opens audit logs page with context

#### Therapist Detail Page
```
┌─────────────────────────────────────┐
│ Therapist: Dr. Smith                │
│ ┌─────────────────────────────────┐ │
│ │ 📋 View Audit History (8)       │ │ ← Button with count
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```
- Shows count of audit log entries
- Pre-filters by Therapist + therapist ID
- Includes pricing changes, availability changes

#### Session List/Detail
```
┌─────────────────────────────────────┐
│ Session #123                        │
│ Actions: [Edit] [Cancel] [⋮]       │
│          └─ View History            │ ← Dropdown menu item
└─────────────────────────────────────┘
```
- Dropdown menu item or icon button
- Pre-filters by Session + session ID
- Shows creation, updates, cancellation

#### Invoice Detail Page
```
┌─────────────────────────────────────┐
│ Invoice INV-2024-001    [Audit Trail]│ ← Button in header
└─────────────────────────────────────┘
```
- Button in invoice header
- Pre-filters by Invoice + invoice ID
- Shows creation, line item changes, voiding

#### Payment Detail
```
┌─────────────────────────────────────┐
│ Payment #456            [View History]│ ← Button
└─────────────────────────────────────┘
```
- Button or link
- Pre-filters by Payment + payment ID
- Shows payment recording

---

### 3. Pre-filtered Context Display

When accessing audit logs via contextual links:

```
┌─────────────────────────────────────────────────────────┐
│ Audit Logs                                              │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ℹ️ Showing logs for: Patient "John Doe"  [Clear ✕] │ │ ← Context banner
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ Filters:                                                │
│ [Date Range] [Action] [Resource: Patient (locked)] ... │
│                                                         │
│ Results: 12 entries                                     │
└─────────────────────────────────────────────────────────┘
```

**Features:**
- Clear banner showing filtered context
- Resource type filter locked (but can be cleared)
- Resource ID automatically applied
- "Clear Filter" button to remove context
- Breadcrumb or label showing what's filtered

---

### 4. URL-based Filtering

**Supported URL Parameters:**

```
/audit-logs?resourceType=Patient&resourceId=123
/audit-logs?startDate=2024-01-01&endDate=2024-01-31
/audit-logs?action=CREATE&resourceType=Session
/audit-logs?userId=456&startDate=2024-01-01
```

**Benefits:**
- Shareable filtered views
- Bookmarkable searches
- Deep linking from other pages
- Browser back/forward support

---

### 5. Audit Log Count API

**New Endpoint:**
```
GET /audit-logs/count?resourceType=Patient&resourceId=123
Response: { count: 12 }
```

**Usage:**
- Display count badges on contextual links
- Show "View History (12)" instead of just "View History"
- Helps users know if there's activity to review
- Cached for performance

---

## Implementation Checklist

### Date Range Filtering
- [ ] Date range picker component with calendar
- [ ] Preset buttons (Today, Yesterday, Last 7 days, Last 30 days)
- [ ] Custom date range selection
- [ ] Clear date filter button
- [ ] URL parameter support for dates
- [ ] Date validation and error handling

### Contextual Links
- [ ] Patient detail page link
- [ ] Therapist detail page link
- [ ] Session list/detail link
- [ ] Invoice detail page link
- [ ] Payment detail link
- [ ] Audit log count API endpoint
- [ ] Reusable AuditLogButton component
- [ ] Context banner component
- [ ] URL parameter handling
- [ ] Clear context filter functionality

### Testing
- [ ] Date range filtering works correctly
- [ ] Preset date ranges calculate correctly
- [ ] Contextual links navigate with correct filters
- [ ] Audit log counts display accurately
- [ ] Context banner shows and clears properly
- [ ] URL parameters persist and restore filters
- [ ] All resource types have contextual links

---

## User Flows

### Flow 1: View Patient Audit History
1. User navigates to patient detail page
2. User sees "View Audit History (12)" button
3. User clicks button
4. Audit logs page opens with:
   - Patient filter pre-applied
   - Context banner showing "Showing logs for: Patient 'John Doe'"
   - 12 audit log entries displayed
5. User can clear filter or add more filters

### Flow 2: Filter by Date Range
1. User navigates to audit logs page
2. User clicks "Last 7 days" preset button
3. Date range automatically set to last 7 days
4. Results update to show only logs from last 7 days
5. User can switch to "Custom" and pick specific dates

### Flow 3: Investigate Session Changes
1. User viewing session list
2. User clicks "⋮" menu on a session
3. User selects "View History"
4. Audit logs page opens filtered to that session
5. User sees all changes: creation, updates, cancellation
6. User can expand entries to see detailed changes

---

## Visual Design

### Date Range Picker
```
┌─────────────────────────────────────────────────────┐
│ Date Range                                          │
│ [Today] [Yesterday] [Last 7 days] [Last 30 days]   │ ← Preset buttons
│                                                     │
│ From: [📅 2024-01-01] To: [📅 2024-01-31]          │ ← Date inputs
│                                                     │
│ [Clear Dates]                                       │
└─────────────────────────────────────────────────────┘
```

### Contextual Link Button
```
┌──────────────────────────────┐
│ 📋 View Audit History (12)   │ ← Icon + Label + Count badge
└──────────────────────────────┘
```

### Context Banner
```
┌─────────────────────────────────────────────────────┐
│ ℹ️ Showing logs for: Patient "John Doe"  [Clear ✕] │
└─────────────────────────────────────────────────────┘
```

---

## Technical Notes

### Performance
- Audit log counts cached for 5 minutes
- Date range queries use indexed `createdAt` field
- Pagination limits results to 50 per page

### Security
- Contextual links respect user permissions
- Tenant isolation enforced on all queries
- Only ADMIN and ACCOUNTANT can access audit logs

### Accessibility
- Date picker keyboard navigable
- Context banner screen reader friendly
- Clear filter button has aria-label
