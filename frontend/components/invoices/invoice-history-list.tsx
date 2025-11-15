'use client';

import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { PatientInvoice } from '@/hooks/use-invoices';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, TrendingUp, TrendingDown, DollarSign, CreditCard } from 'lucide-react';

interface InvoiceHistoryListProps {
  invoices: PatientInvoice[];
  summary: {
    totalInvoiced: number;
    totalPaid: number;
    totalCreditUsed: number;
    totalOutstanding: number;
  };
}

export function InvoiceHistoryList({ invoices, summary }: InvoiceHistoryListProps) {
  const router = useRouter();

  const handleRowClick = (invoiceId: string) => {
    router.push(`/payments/invoices/${invoiceId}`);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoiced</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳{summary.totalInvoiced.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {invoices.length} invoice{invoices.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">৳{summary.totalPaid.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Cash & card payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credit Used</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">৳{summary.totalCreditUsed.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Applied from balance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">৳{summary.totalOutstanding.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Unpaid amount
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Invoice Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice History</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
              <p className="mt-4 text-lg font-medium text-muted-foreground">No invoices found</p>
              <p className="text-sm text-muted-foreground">
                Invoices will appear here once created
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice Number</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Sessions</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Credit Used</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => {
                  const isFullyPaid = invoice.outstandingAmount === 0;
                  
                  return (
                    <TableRow
                      key={invoice.id}
                      onClick={() => handleRowClick(invoice.id)}
                      className="cursor-pointer hover:bg-muted/50"
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          {invoice.invoiceNumber}
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(invoice.invoiceDate), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">
                          {invoice.lineItemCount} session{invoice.lineItemCount !== 1 ? 's' : ''}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ৳{invoice.totalAmount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        ৳{invoice.paidAmount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-blue-600">
                        {invoice.creditUsed > 0 ? `৳${invoice.creditUsed.toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {invoice.outstandingAmount > 0 ? (
                          <span className="text-orange-600 font-medium">
                            ৳{invoice.outstandingAmount.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isFullyPaid ? (
                          <Badge variant="default" className="bg-green-600">
                            Paid
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            Outstanding
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
