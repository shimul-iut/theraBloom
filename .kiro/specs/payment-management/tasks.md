# Payment Management System - Implementation Tasks (Invoice-Based Architecture)

## Overview
This implementation uses an invoice-based payment model where payments are tracked as invoices rather than per-session. Patient financial balances (credit and outstanding dues) are maintained at the patient level and adjust with each invoice and cancellation.

---

- [x] 1. Update database schema for invoice-based model


  - Create Invoice table with all required fields
  - Create InvoiceLineItem table linking invoices to sessions
  - Remove SessionPayment table
  - Remove paymentStatus from Session model
  - Remove paidWithCredit from Session model
  - Add Invoice and InvoiceLineItem relations to Patient and Session models
  - Add indexes for invoice queries
  - _Requirements: 1.1, 3.1, 3.2_


- [x] 2. Create database migration


  - Generate migration for new Invoice and InvoiceLineItem tables
  - Generate migration to drop SessionPayment table
  - Generate migration to remove paymentStatus from Session
  - Create data migration script if existing SessionPayment data needs conversion
  - Test migration on development database
  - _Requirements: 1.1_

- [x] 3. Create backend invoice service



  - [x] 3.1 Implement invoice creation logic


    - Validate sessions belong to patient
    - Validate sessions not already invoiced
    - Validate sessions not cancelled
    - Generate unique invoice number
    - Calculate totals (total, paid, credit used, outstanding)
    - Create Invoice record
    - Create InvoiceLineItem records
    - Update patient creditBalance (deduct used credit)
    - Update patient totalOutstandingDues (add outstanding)
    - Use database transaction for atomicity
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 5.1, 5.2_
  

  - [x] 3.2 Implement get uninvoiced sessions logic

    - Query sessions without InvoiceLineItem
    - Exclude cancelled sessions
    - Group by patient
    - Include patient credit and dues balances
    - Calculate net payable per patient
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5_
  

  - [x] 3.3 Implement get invoice details logic

    - Fetch invoice with line items
    - Include patient information
    - Include confirmedBy user information
    - _Requirements: 7.1, 7.2, 7.3_
  

  - [x] 3.4 Implement get patient invoices logic




    - Fetch all invoices for patient
    - Support pagination
    - Support date range filtering
    - Calculate summary totals
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_
  
  - [x] 3.5 Implement invoice number generation


    - Format: INV-YYYY-NNN (e.g., INV-2024-001)
    - Ensure uniqueness
    - Handle concurrent creation
    - _Requirements: 3.6_

- [x] 4. Update session cancellation logic




  - [x] 4.1 Add invoice check on cancellation

    - Query if session has InvoiceLineItem
    - Get invoice details if exists
    - _Requirements: 6.1, 6.2_
  

  - [x] 4.2 Implement financial adjustment for fully paid invoices

    - Check if invoice.outstandingAmount = 0
    - Add session.cost to patient.creditBalance
    - Remove InvoiceLineItem
    - Update invoice.totalAmount
    - _Requirements: 6.3_

  

  - [x] 4.3 Implement financial adjustment for invoices with outstanding

    - Subtract session.cost from invoice.outstandingAmount
    - Subtract session.cost from patient.totalOutstandingDues
    - Remove InvoiceLineItem
    - Update invoice.totalAmount

    - _Requirements: 6.4, 6.5_

  

  - [x] 4.4 Handle empty invoice after cancellation





    - Check if invoice has no remaining line items

    - Mark invoice as void/cancelled if empty

    - _Requirements: 6.6, 6.7_

  
  - [x] 4.5 Return adjustment notification

    - Include credit added or dues reduced in response
    - _Requirements: 6.8_

- [x] 5. Create invoice API endpoints



  - [x] 5.1 GET /api/v1/invoices/unpaid-sessions endpoint


    - Fetch uninvoiced sessions grouped by patient
    - Include patient financial summary
    - Calculate net payable
    - Support filtering by date, patient, therapist
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_
  
  - [x] 5.2 POST /api/v1/invoices/create endpoint

    - Validate request data
    - Call invoice creation service
    - Return created invoice with updated patient balances
    - Handle validation errors
    - _Requirements: 3.1-3.10, 4.1-4.6, 5.1-5.5_
  
  - [x] 5.3 GET /api/v1/invoices/:invoiceId endpoint

    - Fetch invoice details
    - Include line items and patient info
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_
  
  - [x] 5.4 GET /api/v1/invoices/patient/:patientId endpoint

    - Fetch patient's invoice history
    - Support pagination and date filtering
    - Calculate summary totals
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_
  
  - [x] 5.5 GET /api/v1/invoices/patient/:patientId/balance endpoint

    - Get current patient financial balance
    - Include uninvoiced sessions count and total
    - Calculate net payable for uninvoiced sessions
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 9.1, 9.2_

- [x] 6. Create frontend invoice hooks



  - Implement useUninvoicedSessions hook
  - Implement useCreateInvoice mutation
  - Implement useInvoice hook for fetching single invoice
  - Implement usePatientInvoices hook with pagination
  - Implement usePatientBalance hook
  - Handle loading and error states
  - Invalidate queries after mutations
  - _Requirements: 2.1, 3.1, 7.1, 8.1, 9.1_

- [x] 7. Build payment dashboard page



  - [x] 7.1 Create uninvoiced sessions list view


    - Display patients with uninvoiced sessions
    - Show session details (date, time, therapist, therapy type, cost)
    - Show total cost per patient
    - Show patient credit balance
    - Show patient outstanding dues
    - Show net payable calculation
    - Add "Create Invoice" button per patient
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5_
  

  - [x] 7.2 Add filtering and search





    - Filter by date range
    - Search by patient name
    - Filter by therapist
    - _Requirements: 2.6, 2.7_

- [x] 8. Build invoice creation form



  - [x] 8.1 Create form component


    - Display patient information
    - Show session selection with checkboxes
    - Display selected sessions total
    - Show patient's current credit balance
    - Show patient's current outstanding dues
    - Calculate and display net payable
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 9.1, 9.2, 9.3_
  
  - [x] 8.2 Implement payment input fields

    - Paid amount input (editable)
    - Payment method selection (CASH/CARD/BANK_TRANSFER)
    - Credit to use input (auto-calculated, editable)
    - Notes field (optional)
    - _Requirements: 3.8, 3.9, 3.10, 4.2, 4.3_
  
  - [x] 8.3 Add real-time calculations

    - Update totals when sessions selected/deselected
    - Update credit applied when amount changes
    - Calculate outstanding dues
    - Show calculation breakdown
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.1, 5.2, 5.3, 9.2, 9.3_
  
  - [x] 8.4 Add validation and warnings

    - Validate paid amount >= 0
    - Validate credit used <= available credit
    - Validate credit used <= invoice total
    - Show warning when outstanding dues will be created
    - Show warning when credit exceeds cost (negative net payable)
    - _Requirements: 4.4, 4.5, 5.4, 9.4, 9.5_
  
  - [x] 8.5 Handle form submission

    - Call create invoice API
    - Show success message
    - Navigate to invoice view or close form
    - Handle errors gracefully
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 9. Build invoice view component





  - [x] 9.1 Create invoice display layout


    - Invoice header (number, date, patient info)
    - Line items table (session details and amounts)
    - Financial summary section
    - Patient balance snapshot
    - Payment method and notes
    - _Requirements: 7.2, 7.3, 7.4, 7.5, 7.6_
  
  - [x] 9.2 Add print functionality


    - Print button
    - Print-optimized CSS
    - Format for PDF conversion
    - Include therapy center branding
    - _Requirements: 7.7, 7.8, 7.9_
  
  - [x] 9.3 Create invoice page route


    - Create /payments/invoices/[invoiceId] page
    - Fetch and display invoice
    - Handle loading and error states
    - _Requirements: 7.1_

- [x] 10. Build invoice history view





  - [x] 10.1 Create invoice list component


    - Display invoices in table format
    - Show invoice number, date, total, paid, outstanding
    - Make rows clickable to view invoice
    - Show summary totals at top
    - _Requirements: 8.1, 8.2, 8.3_
  
  - [x] 10.2 Add pagination


    - Implement pagination controls
    - Show page numbers and navigation
    - Default to 20 invoices per page
    - _Requirements: 8.7_
  
  - [x] 10.3 Add date range filter


    - Date range picker
    - Filter invoices by date
    - _Requirements: 8.6_
  
  - [x] 10.4 Integrate into patient details page


    - Add invoice history section to patient page
    - Link to full invoice history view
    - _Requirements: 8.1_

- [x] 11. Update patient details page





  - Display credit balance prominently
  - Display outstanding dues prominently
  - Add link to invoice history
  - Show count of uninvoiced sessions
  - Add "Create Invoice" button if uninvoiced sessions exist
  - _Requirements: 2.2, 2.3, 2.4, 8.1_

- [x] 12. Update session list components













  - Remove payment status badges from sessions
  - Add indicator if session is invoiced (with invoice number link)
  - Show "Not Invoiced" badge for uninvoiced sessions
  - Link to invoice when session is invoiced
  - _Requirements: 1.1, 1.2_

- [x] 13. Add cancellation notifications





  - Show notification when session cancelled with credit added
  - Show notification when session cancelled with dues reduced
  - Display amount of credit/dues adjustment
  - _Requirements: 6.8_

- [ ] 14. Integration and testing
  - Test complete invoice creation flow
  - Test credit application scenarios
  - Test outstanding dues accumulation
  - Test session cancellation adjustments
  - Test invoice view and printing
  - Test invoice history pagination
  - Test concurrent invoice creation
  - Test balance consistency across operations
  - Test edge cases (zero payment, full credit payment, etc.)
  - _Requirements: All_

