# Payment Management Architecture Change

## Date: November 15, 2024

## Summary

The payment management system has been redesigned from a **session-based payment model** to an **invoice-based payment model**. This document explains the rationale and key changes.

## Previous Architecture (Session-Based)

### Problems with Session-Based Model
1. **Complex payment status tracking** - Each session had UNPAID/PARTIALLY_PAID/PAID status
2. **Unclear partial payments** - Hard to understand which sessions were partially paid
3. **No clear payment record** - SessionPayment records were scattered across sessions
4. **Difficult audit trail** - No single document showing what was paid when
5. **Confusing for users** - "Partially paid session" concept was unclear

### Old Data Model
```
Session
├── paymentStatus: UNPAID | PARTIALLY_PAID | PAID
├── paidWithCredit: boolean
└── SessionPayment[] (multiple payment records per session)

Patient
├── creditBalance
└── totalOutstandingDues
```

## New Architecture (Invoice-Based)

### Benefits of Invoice-Based Model
1. **Clear payment records** - Each payment creates one invoice document
2. **Simple session model** - Sessions don't track payment status
3. **Patient-level balances** - All financial tracking at patient level
4. **Easy audit trail** - Invoices provide complete payment history
5. **Intuitive for users** - Matches real-world invoicing practices
6. **Flexible payments** - Any amount can be paid, dues tracked at patient level

### New Data Model
```
Invoice
├── invoiceNumber: "INV-2024-001"
├── totalAmount: sum of line items
├── paidAmount: actual payment received
├── creditUsed: credit applied
├── outstandingAmount: total - paid - credit
├── paymentMethod: CASH | CARD | BANK_TRANSFER
└── InvoiceLineItem[]
    └── sessionId (unique - each session in max one invoice)

Patient
├── creditBalance: money available for future bookings
└── totalOutstandingDues: sum of all invoice outstanding amounts

Session
└── InvoiceLineItem? (optional - null if not yet invoiced)
```

## Key Concepts

### 1. Uninvoiced Sessions
- Sessions that haven't been included in any invoice yet
- Identified by absence of InvoiceLineItem relation
- Shown in payment dashboard for invoice creation

### 2. Invoice Creation
- Admin selects which sessions to include
- System calculates total from selected sessions
- Admin enters payment amount and method
- System auto-applies available credit (can be adjusted)
- Outstanding amount = total - paid - credit
- Outstanding added to patient's totalOutstandingDues

### 3. Net Payable Calculation
For any new booking or invoice:
```
netPayable = sessionsCost - creditBalance + outstandingDues
```

**Example:**
- 3 new sessions @ ৳1000 = ৳3000
- Patient has ৳500 credit
- Patient has ৳1000 outstanding dues
- Net payable = ৳3000 - ৳500 + ৳1000 = ৳3500

### 4. Session Cancellation
When a session is cancelled:

**If session not invoiced:**
- No financial adjustment needed

**If session in fully paid invoice** (outstanding = 0):
- Add session cost to patient's creditBalance
- Remove line item from invoice
- Update invoice totalAmount

**If session in invoice with outstanding:**
- Subtract session cost from invoice outstandingAmount
- Subtract session cost from patient totalOutstandingDues
- Remove line item from invoice
- Update invoice totalAmount

## Example Scenario

### Scenario: Patient books 5 sessions, pays partially, then cancels one

1. **Initial Booking**
   - Patient books 5 sessions @ ৳1000 each
   - Total: ৳5000
   - Sessions are uninvoiced
   - Patient balances: credit = ৳0, dues = ৳0

2. **Create Invoice with Partial Payment**
   - Admin creates invoice for all 5 sessions
   - Total: ৳5000
   - Patient pays: ৳3000
   - Credit used: ৳0
   - Outstanding: ৳2000
   - Patient balances: credit = ৳0, dues = ৳2000

3. **Cancel One Session**
   - Patient cancels 1 session (৳1000)
   - Session is in invoice with outstanding
   - System subtracts ৳1000 from invoice outstanding (now ৳1000)
   - System subtracts ৳1000 from patient dues (now ৳1000)
   - Invoice now covers 4 sessions for ৳4000 total
   - Patient balances: credit = ৳0, dues = ৳1000

4. **Book 3 More Sessions**
   - Patient books 3 new sessions @ ৳1000 = ৳3000
   - Net payable = ৳3000 - ৳0 (credit) + ৳1000 (dues) = ৳4000

5. **Create Second Invoice with Full Payment**
   - Admin creates invoice for 3 new sessions
   - Total: ৳3000
   - Patient pays: ৳4000 (paying off dues too)
   - Credit used: ৳0
   - Outstanding: -৳1000 (overpayment becomes credit)
   - Patient balances: credit = ৳1000, dues = ৳0

## Migration Path

### Phase 1: Update Documentation ✅
- Update design document
- Update requirements document
- Update tasks document
- Create this architecture change document

### Phase 2: Database Changes (Task 1-2)
- Create Invoice and InvoiceLineItem tables
- Remove SessionPayment table
- Remove paymentStatus from Session
- Migrate any existing data

### Phase 3: Backend Implementation (Task 3-5)
- Implement invoice service
- Update session cancellation logic
- Create invoice API endpoints

### Phase 4: Frontend Implementation (Task 6-13)
- Create invoice hooks
- Build payment dashboard
- Build invoice creation form
- Build invoice view and history
- Update patient details page
- Update session displays

### Phase 5: Testing (Task 14)
- Integration testing
- Edge case testing
- Balance consistency verification

## Breaking Changes

### Removed
- `Session.paymentStatus` field
- `Session.paidWithCredit` field
- `SessionPayment` table
- `PaymentStatus` enum values: PARTIALLY_PAID

### Added
- `Invoice` table
- `InvoiceLineItem` table
- Invoice-related API endpoints
- Invoice UI components

### Changed
- Payment workflow: now creates invoices instead of updating session status
- Cancellation workflow: now adjusts invoice and patient balances
- Payment dashboard: now shows uninvoiced sessions instead of unpaid sessions

## Next Steps

1. Review and approve this architecture change
2. Begin implementation with Task 1 (database schema updates)
3. Create migration scripts
4. Implement backend services
5. Build frontend components
6. Test thoroughly before deployment

## Questions or Concerns?

If you have any questions about this architecture change or need clarification on any aspect, please discuss before proceeding with implementation.

