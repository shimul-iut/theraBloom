'use client';

import { format } from 'date-fns';
import { InvoiceDetails } from '@/hooks/use-invoices';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, CreditCard, AlertCircle, User, Calendar, Clock, Printer } from 'lucide-react';
import { PrintableInvoice } from './printable-invoice';

interface InvoiceViewProps {
  invoiceData: InvoiceDetails;
  onPrint?: () => void;
}

export function InvoiceView({ invoiceData, onPrint }: InvoiceViewProps) {
  const { invoice, lineItems, patient, confirmedBy } = invoiceData;

  const hasOutstanding = invoice.outstandingAmount > 0;
  const hasCredit = invoice.creditUsed > 0;

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <>
      {/* Hidden printable version */}
      <div className="hidden print:block">
        <PrintableInvoice invoiceData={invoiceData} />
      </div>

      {/* Screen version */}
      <div className="space-y-6 print:hidden">
      {/* Invoice Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle className="text-2xl">Invoice {invoice.invoiceNumber}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {format(new Date(invoice.invoiceDate), 'MMMM dd, yyyy')}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={handlePrint} variant="outline" size="sm">
                <Printer className="mr-2 h-4 w-4" />
                Print Invoice
              </Button>
              {hasOutstanding ? (
                <Badge variant="destructive" className="text-sm">
                  Outstanding: ৳{invoice.outstandingAmount.toFixed(2)}
                </Badge>
              ) : (
                <Badge variant="default" className="bg-green-600 text-sm">
                  Fully Paid
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Patient Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Patient Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-sm text-muted-foreground">Patient Name</div>
              <div className="font-medium">{patient.name}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Guardian Name</div>
              <div className="font-medium">{patient.guardianName || 'N/A'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Contact Number</div>
              <div className="font-medium">{patient.guardianPhone || 'N/A'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Confirmed By</div>
              <div className="font-medium">{confirmedBy.name}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Items Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Session Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {lineItems.map((item, index) => (
              <div key={item.id}>
                {index > 0 && <Separator className="my-3" />}
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="font-medium">{item.session.therapyType}</div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(item.session.scheduledDate), 'MMM dd, yyyy')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {item.session.startTime} - {item.session.endTime}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <User className="h-3 w-3" />
                      Therapist: {item.session.therapist}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-lg">৳{item.amount.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Financial Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Subtotal ({lineItems.length} session{lineItems.length !== 1 ? 's' : ''}):</span>
              <span className="font-medium">৳{invoice.totalAmount.toFixed(2)}</span>
            </div>

            {hasCredit && (
              <div className="flex justify-between text-sm text-green-600">
                <span className="flex items-center gap-1">
                  <CreditCard className="h-3 w-3" />
                  Credit Applied:
                </span>
                <span className="font-medium">-৳{invoice.creditUsed.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-sm">
              <span>Amount Paid ({invoice.paymentMethod.replace('_', ' ')}):</span>
              <span className="font-medium">৳{invoice.paidAmount.toFixed(2)}</span>
            </div>

            <Separator />

            <div className="flex justify-between font-semibold text-base">
              <span>Total Payment:</span>
              <span>৳{(invoice.paidAmount + invoice.creditUsed).toFixed(2)}</span>
            </div>

            {hasOutstanding && (
              <div className="flex justify-between text-sm text-orange-600">
                <span className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Outstanding Amount:
                </span>
                <span className="font-medium">৳{invoice.outstandingAmount.toFixed(2)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Patient Balance Snapshot */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Patient Balance After Invoice</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground mb-1">Credit Balance</div>
              <div className="text-2xl font-bold text-green-600">
                ৳{patient.creditBalance.toFixed(2)}
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground mb-1">Outstanding Dues</div>
              <div className="text-2xl font-bold text-red-600">
                ৳{patient.totalOutstandingDues.toFixed(2)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method and Notes */}
      {invoice.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {invoice.notes}
            </p>
          </CardContent>
        </Card>
      )}
      </div>
    </>
  );
}
