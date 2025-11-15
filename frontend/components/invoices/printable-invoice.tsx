'use client';

import { format } from 'date-fns';
import { InvoiceDetails } from '@/hooks/use-invoices';

interface PrintableInvoiceProps {
  invoiceData: InvoiceDetails;
}

export function PrintableInvoice({ invoiceData }: PrintableInvoiceProps) {
  const { invoice, lineItems, patient, confirmedBy } = invoiceData;

  const hasOutstanding = invoice.outstandingAmount > 0;
  const hasCredit = invoice.creditUsed > 0;

  return (
    <div className="print-invoice">
      {/* Print-specific styles */}
      <style jsx>{`
        @media print {
          .print-invoice {
            padding: 20mm;
            font-family: Arial, sans-serif;
            color: #000;
            background: #fff;
          }
          
          .print-header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #000;
            padding-bottom: 20px;
          }
          
          .print-title {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          
          .print-subtitle {
            font-size: 14px;
            color: #666;
          }
          
          .print-section {
            margin-bottom: 25px;
          }
          
          .print-section-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 10px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
          }
          
          .print-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-bottom: 15px;
          }
          
          .print-field {
            margin-bottom: 10px;
          }
          
          .print-field-label {
            font-size: 11px;
            color: #666;
            text-transform: uppercase;
            margin-bottom: 3px;
          }
          
          .print-field-value {
            font-size: 13px;
            font-weight: 500;
          }
          
          .print-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          
          .print-table th {
            background: #f5f5f5;
            padding: 10px;
            text-align: left;
            font-size: 12px;
            font-weight: bold;
            border: 1px solid #ddd;
          }
          
          .print-table td {
            padding: 10px;
            font-size: 12px;
            border: 1px solid #ddd;
          }
          
          .print-table tr:nth-child(even) {
            background: #fafafa;
          }
          
          .print-summary {
            margin-top: 20px;
            border-top: 2px solid #000;
            padding-top: 15px;
          }
          
          .print-summary-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 13px;
          }
          
          .print-summary-row.total {
            font-size: 16px;
            font-weight: bold;
            border-top: 1px solid #ddd;
            margin-top: 10px;
            padding-top: 15px;
          }
          
          .print-balance {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-top: 20px;
            padding: 15px;
            border: 1px solid #ddd;
            background: #f9f9f9;
          }
          
          .print-balance-item {
            text-align: center;
          }
          
          .print-balance-label {
            font-size: 11px;
            color: #666;
            text-transform: uppercase;
            margin-bottom: 5px;
          }
          
          .print-balance-value {
            font-size: 20px;
            font-weight: bold;
          }
          
          .print-footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 11px;
            color: #666;
          }
          
          .print-notes {
            margin-top: 20px;
            padding: 15px;
            background: #f9f9f9;
            border-left: 3px solid #000;
          }
          
          .print-notes-title {
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 8px;
          }
          
          .print-notes-content {
            font-size: 11px;
            line-height: 1.5;
            white-space: pre-wrap;
          }
          
          .text-green {
            color: #16a34a;
          }
          
          .text-red {
            color: #dc2626;
          }
          
          .text-orange {
            color: #ea580c;
          }
        }
        
        @page {
          size: A4;
          margin: 0;
        }
      `}</style>

      {/* Header with Branding */}
      <div className="print-header">
        <div className="print-title">Therapy Center</div>
        <div className="print-subtitle">Invoice Receipt</div>
      </div>

      {/* Invoice Info */}
      <div className="print-section">
        <div className="print-grid">
          <div className="print-field">
            <div className="print-field-label">Invoice Number</div>
            <div className="print-field-value">{invoice.invoiceNumber}</div>
          </div>
          <div className="print-field">
            <div className="print-field-label">Invoice Date</div>
            <div className="print-field-value">
              {format(new Date(invoice.invoiceDate), 'MMMM dd, yyyy')}
            </div>
          </div>
          <div className="print-field">
            <div className="print-field-label">Payment Status</div>
            <div className="print-field-value">
              {hasOutstanding ? 'Partially Paid' : 'Fully Paid'}
            </div>
          </div>
          <div className="print-field">
            <div className="print-field-label">Payment Method</div>
            <div className="print-field-value">
              {invoice.paymentMethod.replace('_', ' ')}
            </div>
          </div>
        </div>
      </div>

      {/* Patient Information */}
      <div className="print-section">
        <div className="print-section-title">Patient Information</div>
        <div className="print-grid">
          <div className="print-field">
            <div className="print-field-label">Patient Name</div>
            <div className="print-field-value">{patient.name}</div>
          </div>
          <div className="print-field">
            <div className="print-field-label">Guardian Name</div>
            <div className="print-field-value">{patient.guardianName || 'N/A'}</div>
          </div>
          <div className="print-field">
            <div className="print-field-label">Contact Number</div>
            <div className="print-field-value">{patient.guardianPhone || 'N/A'}</div>
          </div>
          <div className="print-field">
            <div className="print-field-label">Confirmed By</div>
            <div className="print-field-value">{confirmedBy.name}</div>
          </div>
        </div>
      </div>

      {/* Session Details Table */}
      <div className="print-section">
        <div className="print-section-title">Session Details</div>
        <table className="print-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Therapy Type</th>
              <th>Therapist</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item) => (
              <tr key={item.id}>
                <td>{format(new Date(item.session.scheduledDate), 'MMM dd, yyyy')}</td>
                <td>{item.session.startTime} - {item.session.endTime}</td>
                <td>{item.session.therapyType}</td>
                <td>{item.session.therapist}</td>
                <td style={{ textAlign: 'right' }}>৳{item.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Financial Summary */}
      <div className="print-summary">
        <div className="print-summary-row">
          <span>Subtotal ({lineItems.length} session{lineItems.length !== 1 ? 's' : ''}):</span>
          <span>৳{invoice.totalAmount.toFixed(2)}</span>
        </div>

        {hasCredit && (
          <div className="print-summary-row text-green">
            <span>Credit Applied:</span>
            <span>-৳{invoice.creditUsed.toFixed(2)}</span>
          </div>
        )}

        <div className="print-summary-row">
          <span>Amount Paid ({invoice.paymentMethod.replace('_', ' ')}):</span>
          <span>৳{invoice.paidAmount.toFixed(2)}</span>
        </div>

        <div className="print-summary-row total">
          <span>Total Payment:</span>
          <span>৳{(invoice.paidAmount + invoice.creditUsed).toFixed(2)}</span>
        </div>

        {hasOutstanding && (
          <div className="print-summary-row text-orange">
            <span>Outstanding Amount:</span>
            <span>৳{invoice.outstandingAmount.toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Patient Balance */}
      <div className="print-balance">
        <div className="print-balance-item">
          <div className="print-balance-label">Credit Balance</div>
          <div className="print-balance-value text-green">
            ৳{patient.creditBalance.toFixed(2)}
          </div>
        </div>
        <div className="print-balance-item">
          <div className="print-balance-label">Outstanding Dues</div>
          <div className="print-balance-value text-red">
            ৳{patient.totalOutstandingDues.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div className="print-notes">
          <div className="print-notes-title">Notes</div>
          <div className="print-notes-content">{invoice.notes}</div>
        </div>
      )}

      {/* Footer */}
      <div className="print-footer">
        <p>Thank you for choosing our therapy center.</p>
        <p>For any queries, please contact our administration.</p>
      </div>
    </div>
  );
}
