'use client';

import { useRouter } from 'next/navigation';
import { usePatient } from '@/hooks/use-patients';
import { usePatientInvoices, usePatientBalance } from '@/hooks/use-invoices';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingPage } from '@/components/shared/loading-spinner';
import { ErrorMessage } from '@/components/shared/error-boundary';
import { ArrowLeft, Edit, Calendar, DollarSign, FileText, Receipt, ExternalLink } from 'lucide-react';
import { AuditLogButton } from '@/components/audit/audit-log-button';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function PatientDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: patient, isLoading, error } = usePatient(params.id);
  const { data: balanceData } = usePatientBalance(params.id);
  const { data: invoicesData } = usePatientInvoices(params.id, { page: 1, limit: 5 });

  if (isLoading) return <LoadingPage />;
  
  if (error || !patient) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <ErrorMessage message="Failed to load patient details" />
      </div>
    );
  }

  const age = Math.floor(
    (new Date().getTime() - new Date(patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );

  const creditBalance = Number(patient.creditBalance) || 0;
  const outstandingDues = Number(patient.totalOutstandingDues) || 0;
  const hasUninvoicedSessions = balanceData && balanceData.uninvoiced.count > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {patient.firstName} {patient.lastName}
            </h1>
            <p className="text-muted-foreground">Patient Details</p>
          </div>
        </div>
        <div className="flex gap-2">
          <AuditLogButton
            resourceType="Patient"
            resourceId={patient.id}
            variant="outline"
          />
          <Button onClick={() => router.push(`/patients/${patient.id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Patient
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Basic patient details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Full Name</p>
              <p className="text-lg">
                {patient.firstName} {patient.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
              <p className="text-lg">
                {format(new Date(patient.dateOfBirth), 'MMMM dd, yyyy')} ({age} years old)
              </p>
            </div>
            {patient.address && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Address</p>
                <p className="text-lg">{patient.address}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Guardian Information</CardTitle>
            <CardDescription>Primary contact details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Guardian Name</p>
              <p className="text-lg">{patient.guardianName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Phone Number</p>
              <p className="text-lg">{patient.guardianPhone}</p>
            </div>
            {patient.guardianEmail && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-lg">{patient.guardianEmail}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financial Summary</CardTitle>
            <CardDescription>Credit balance and outstanding dues</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Credit Balance</p>
              <p className="text-2xl font-bold text-green-600">
                ৳{creditBalance.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Outstanding Dues</p>
              <p className={`text-2xl font-bold ${outstandingDues > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                ৳{outstandingDues.toFixed(2)}
              </p>
            </div>
            {balanceData && balanceData.uninvoiced.count > 0 && (
              <>
                <div className="pt-2 border-t">
                  <p className="text-sm font-medium text-muted-foreground">Uninvoiced Sessions</p>
                  <p className="text-lg font-semibold text-orange-600">
                    {balanceData.uninvoiced.count} session{balanceData.uninvoiced.count !== 1 ? 's' : ''} (৳{balanceData.uninvoiced.total.toFixed(2)})
                  </p>
                </div>
                <Button
                  className="w-full"
                  onClick={() => router.push('/payments')}
                >
                  <Receipt className="mr-2 h-4 w-4" />
                  Create Invoice
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {patient.medicalNotes && (
          <Card>
            <CardHeader>
              <CardTitle>Medical Notes</CardTitle>
              <CardDescription>Important medical information</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-lg whitespace-pre-wrap">{patient.medicalNotes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push(`/patients/${patient.id}/sessions`)}
        >
          <Calendar className="mr-2 h-4 w-4" />
          View Sessions
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push(`/patients/${patient.id}/invoices`)}
        >
          <Receipt className="mr-2 h-4 w-4" />
          Invoice History
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push(`/patients/${patient.id}/payments`)}
        >
          <DollarSign className="mr-2 h-4 w-4" />
          View Payments
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push(`/patients/${patient.id}/reports`)}
        >
          <FileText className="mr-2 h-4 w-4" />
          Progress Reports
        </Button>
      </div>

      {/* Invoice History Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Recent Invoices
              </CardTitle>
              <CardDescription>Latest payment invoices for this patient</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/patients/${patient.id}/invoices`)}
            >
              View All
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!invoicesData || invoicesData.invoices.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
              <p className="mt-4 text-sm text-muted-foreground">No invoices yet</p>
              {hasUninvoicedSessions && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => router.push('/payments')}
                >
                  Create Invoice
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoicesData.invoices.map((invoice) => (
                    <TableRow
                      key={invoice.id}
                      onClick={() => router.push(`/payments/invoices/${invoice.id}`)}
                      className="cursor-pointer hover:bg-muted/50"
                    >
                      <TableCell className="font-medium">
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell>
                        {format(new Date(invoice.invoiceDate), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        ৳{invoice.totalAmount.toFixed(2)}
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
                        {invoice.outstandingAmount === 0 ? (
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
                  ))}
                </TableBody>
              </Table>
              {invoicesData.pagination.total > 5 && (
                <div className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/patients/${patient.id}/invoices`)}
                  >
                    View all {invoicesData.pagination.total} invoices
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
