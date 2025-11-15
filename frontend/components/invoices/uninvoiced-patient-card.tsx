'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { UninvoicedPatient } from '@/hooks/use-invoices';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, FileText, CreditCard, AlertCircle } from 'lucide-react';
import { InvoiceCreationDialog } from './invoice-creation-dialog';

interface UninvoicedPatientCardProps {
  patientData: UninvoicedPatient;
}

export function UninvoicedPatientCard({ patientData }: UninvoicedPatientCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const { patient, sessions, totalCost, netPayable } = patientData;

  const hasCredit = patient.creditBalance > 0;
  const hasOutstanding = patient.totalOutstandingDues > 0;
  const willHaveOutstanding = netPayable > 0;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl">
                {patient.firstName} {patient.lastName}
              </CardTitle>
              <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                <span>{sessions.length} uninvoiced session{sessions.length !== 1 ? 's' : ''}</span>
                {hasCredit && (
                  <span className="flex items-center gap-1 text-green-600">
                    <CreditCard className="h-3 w-3" />
                    ৳{patient.creditBalance.toFixed(2)} credit
                  </span>
                )}
                {hasOutstanding && (
                  <span className="flex items-center gap-1 text-red-600">
                    <AlertCircle className="h-3 w-3" />
                    ৳{patient.totalOutstandingDues.toFixed(2)} outstanding
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Total Cost</div>
                <div className="text-2xl font-bold">৳{totalCost.toFixed(2)}</div>
                {(hasCredit || hasOutstanding) && (
                  <div className={`text-sm ${willHaveOutstanding ? 'text-red-600' : 'text-green-600'}`}>
                    Net: ৳{netPayable.toFixed(2)}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => setShowInvoiceDialog(true)}
                  size="sm"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Create Invoice
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="mr-2 h-4 w-4" />
                      Hide Details
                    </>
                  ) : (
                    <>
                      <ChevronDown className="mr-2 h-4 w-4" />
                      Show Details
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent>
            <div className="space-y-3">
              <div className="text-sm font-medium">Session Details:</div>
              <div className="space-y-2">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{session.therapyType.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(session.scheduledDate), 'MMM dd, yyyy')} •{' '}
                        {session.startTime} - {session.endTime}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Therapist: {session.therapist.name}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        Not Invoiced
                      </Badge>
                      <div className="text-right">
                        <div className="font-medium">৳{session.cost.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <InvoiceCreationDialog
        open={showInvoiceDialog}
        onOpenChange={setShowInvoiceDialog}
        patientData={patientData}
      />
    </>
  );
}
