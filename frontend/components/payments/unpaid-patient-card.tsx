'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { UnpaidPatient } from '@/hooks/use-payments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, DollarSign, CreditCard } from 'lucide-react';
import { PaymentConfirmationDialog } from './payment-confirmation-dialog';

interface UnpaidPatientCardProps {
  patientData: UnpaidPatient;
}

export function UnpaidPatientCard({ patientData }: UnpaidPatientCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const { patient, sessions, totalDue, creditBalance, netPayable } = patientData;

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'UNPAID':
        return <Badge variant="destructive">Unpaid</Badge>;
      case 'PARTIALLY_PAID':
        return <Badge className="bg-orange-500">Partially Paid</Badge>;
      case 'PAID':
        return <Badge className="bg-green-500">Paid</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

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
                <span>{sessions.length} unpaid session{sessions.length !== 1 ? 's' : ''}</span>
                {creditBalance > 0 && (
                  <span className="flex items-center gap-1 text-green-600">
                    <CreditCard className="h-3 w-3" />
                    ৳{creditBalance.toFixed(2)} credit
                  </span>
                )}
                {patient.totalOutstandingDues > 0 && (
                  <span className="text-red-600">
                    ৳{patient.totalOutstandingDues.toFixed(2)} outstanding
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Total Due</div>
                <div className="text-2xl font-bold">৳{totalDue.toFixed(2)}</div>
                {creditBalance > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Net: ৳{netPayable.toFixed(2)}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => setShowPaymentDialog(true)}
                  size="sm"
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  Confirm Payment
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
                      {getPaymentStatusBadge(session.paymentStatus)}
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

      <PaymentConfirmationDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        patientData={patientData}
      />
    </>
  );
}
