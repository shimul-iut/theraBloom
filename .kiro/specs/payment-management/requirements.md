# Payment Management System - Requirements

## Introduction

This document outlines the requirements for implementing an invoice-based payment management system for therapy sessions. The system uses invoices to track payments rather than per-session payment status, maintaining patient-level financial balances (credit and outstanding dues) that adjust with each payment and cancellation.

## Glossary

- **System**: The therapy center management application
- **Session**: A scheduled therapy appointment
- **Invoice**: A payment record that groups one or more sessions with payment details
- **Invoice Line Item**: A single session entry within an invoice
- **Uninvoiced Session**: A session that has not yet been included in any invoice
- **Credit Balance**: Money available to the patient for future bookings (from overpayments or cancelled paid sessions)
- **Outstanding Dues**: Total unpaid amount across all invoices for a patient
- **Net Payable**: Calculated amount for new bookings considering credit and dues: `sessionsCost - creditBalance + outstandingDues`
- **Invoice Number**: Unique identifier for each invoice (e.g., INV-2024-001)

## Requirements

### Requirement 1: Uninvoiced Sessions Tracking

**User Story:** As an admin, I want to see all sessions that haven't been invoiced yet so that I can track which sessions need payment.

#### Acceptance Criteria

1. WHEN a session is created, THE System SHALL NOT assign any payment status to the session
2. THE System SHALL identify uninvoiced sessions as those without an associated InvoiceLineItem
3. THE System SHALL display uninvoiced sessions in the payments dashboard
4. THE System SHALL group uninvoiced sessions by patient
5. THE System SHALL calculate total cost for each patient's uninvoiced sessions

### Requirement 2: Payment Dashboard with Financial Summary

**User Story:** As an admin, I want to see patients with uninvoiced sessions and their complete financial picture so that I can manage payments effectively.

#### Acceptance Criteria

1. THE System SHALL display a payments dashboard showing all patients with uninvoiced sessions
2. THE System SHALL show for each patient the total cost of uninvoiced sessions
3. THE System SHALL display the patient's current credit balance
4. THE System SHALL display the patient's current outstanding dues
5. THE System SHALL calculate and display net payable as: `uninvoicedTotal - creditBalance + outstandingDues`
6. THE System SHALL allow filtering by date range, patient name, and therapist
7. THE System SHALL allow searching patients by name

### Requirement 3: Invoice Creation

**User Story:** As an admin, I want to create invoices for selected sessions so that I can record payments properly.

#### Acceptance Criteria

1. THE System SHALL provide a "Create Invoice" action for patients with uninvoiced sessions
2. WHEN creating an invoice, THE System SHALL allow selection of which sessions to include
3. THE System SHALL validate that selected sessions belong to the specified patient
4. THE System SHALL validate that selected sessions are not already in another invoice
5. THE System SHALL validate that selected sessions are not cancelled
6. THE System SHALL generate a unique invoice number in format "INV-YYYY-NNN"
7. THE System SHALL calculate total amount as sum of selected session costs
8. THE System SHALL allow input of paid amount (cash/card payment)
9. THE System SHALL allow selection of payment method (CASH, CARD, BANK_TRANSFER)
10. THE System SHALL allow optional notes field

### Requirement 4: Credit Application in Invoices

**User Story:** As an admin, I want to apply patient credit to invoices so that payment calculations are accurate.

#### Acceptance Criteria

1. WHEN creating an invoice, THE System SHALL display patient's available credit balance
2. THE System SHALL auto-calculate credit to apply as minimum of (creditBalance, invoiceTotal)
3. THE System SHALL allow manual adjustment of credit amount up to available credit
4. THE System SHALL validate that credit used does not exceed available credit balance
5. THE System SHALL validate that credit used does not exceed invoice total amount
6. WHEN invoice is created, THE System SHALL deduct used credit from patient's creditBalance
7. THE System SHALL display credit applied amount in invoice

### Requirement 5: Outstanding Dues Calculation

**User Story:** As an admin, I want the system to automatically calculate and track outstanding dues so that I know what patients still owe.

#### Acceptance Criteria

1. THE System SHALL calculate outstanding amount as: `totalAmount - paidAmount - creditUsed`
2. WHEN outstanding amount is greater than zero, THE System SHALL add it to patient's totalOutstandingDues
3. THE System SHALL store outstanding amount in the invoice record
4. THE System SHALL display outstanding dues in patient details
5. THE System SHALL include outstanding dues in net payable calculations for future invoices

### Requirement 6: Session Cancellation Financial Adjustments

**User Story:** As an admin, I want session cancellations to automatically adjust financial records so that credits and dues are accurate.

#### Acceptance Criteria

1. WHEN a session is cancelled, THE System SHALL check if session is in any invoice
2. IF session is not in any invoice, THE System SHALL make no financial adjustments
3. IF session is in an invoice with zero outstanding (fully paid), THE System SHALL add session cost to patient's creditBalance
4. IF session is in an invoice with outstanding amount, THE System SHALL subtract session cost from invoice's outstandingAmount
5. IF session is in an invoice with outstanding amount, THE System SHALL subtract session cost from patient's totalOutstandingDues
6. THE System SHALL remove the InvoiceLineItem for the cancelled session
7. THE System SHALL update the invoice's totalAmount
8. THE System SHALL display notification showing credit added or dues reduced

### Requirement 7: Invoice View and Printing

**User Story:** As an admin, I want to view and print invoices so that I can provide payment records to patients.

#### Acceptance Criteria

1. THE System SHALL provide an invoice view page accessible by invoice ID
2. THE System SHALL display invoice number, date, and patient information
3. THE System SHALL display a table of line items with session details and amounts
4. THE System SHALL display financial summary showing total, credit used, paid amount, and outstanding
5. THE System SHALL display patient's balance snapshot after this invoice
6. THE System SHALL display payment method and any notes
7. THE System SHALL provide a print button that formats invoice for printing
8. THE System SHALL format printed invoice suitable for PDF conversion
9. THE System SHALL include therapy center branding in printed invoice

### Requirement 8: Invoice History

**User Story:** As an admin, I want to see all invoices for a patient so that I can track their complete payment history.

#### Acceptance Criteria

1. THE System SHALL provide an invoice history view for each patient
2. THE System SHALL display all invoices in reverse chronological order
3. THE System SHALL show for each invoice the invoice number, date, total amount, paid amount, and outstanding amount
4. THE System SHALL allow clicking an invoice to view full details
5. THE System SHALL display summary totals for total invoiced, total paid, total credit used, and total outstanding
6. THE System SHALL allow filtering invoices by date range
7. THE System SHALL paginate invoice list when count exceeds 20 records

### Requirement 9: Net Payable Calculation for New Bookings

**User Story:** As an admin, I want the system to show accurate net payable amounts considering credit and dues so that I know what to collect.

#### Acceptance Criteria

1. WHEN displaying uninvoiced sessions, THE System SHALL calculate net payable as: `sessionsCost - creditBalance + outstandingDues`
2. THE System SHALL display this calculation breakdown in the payment form
3. THE System SHALL update net payable in real-time as sessions are selected/deselected
4. THE System SHALL show warning when net payable is negative (credit exceeds cost)
5. THE System SHALL show warning when outstanding dues exist
