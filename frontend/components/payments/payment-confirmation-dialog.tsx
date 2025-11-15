'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { UnpaidPatient, useConfirmPayment } from '@/hooks/use-payments';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, CreditCard, DollarSign } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PaymentConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientData: UnpaidPatient;
}

export function PaymentConfirmationDialog({
  open,
  onOpenChange,
  patientData,
}: PaymentConfirmationDialogProps) {
  const { patient, sessions, totalDue, creditBalance, netPayable } = patientData;
  const confirmPayment = useConfirmPayment();

  const [selectedSessions, setSelectedSessions] = useState<string[]>(
    sessions.map((s) => s.id)
  );
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [useCreditAmount, setUseCreditAmount] = useState<string>('0');
  const [notes, setNotes] = useState<string>('');

  // Calculate totals based on selected sessions
  const calculations = useMemo(() => {
    const selectedSessionsData = sessions.filter((s) =>
      selectedSessions.includes(s.id)
    );
    const selectedTotal = selectedSessionsData.reduce(
      (sum, session) => sum + Number(session.cost),
      0
    );
    const maxCreditUsable = Math.min(creditBalance, selectedTotal);
    const creditToUse = Math.min(Number(useCreditAmount) || 0, maxCreditUsable);
    const netAmount = selectedTotal - creditToUse;
    const paid = Number(paidAmount) || 0;
    const totalPayment = paid + creditToUse;
    const outstanding = Math.max(0, selectedTotal - totalPayment);
    const isPartialPayment = outstanding > 0;

    return {
      selectedTotal,
      maxCreditUsable,
      creditToUse,
      netAmount,
      paid,
      totalPayment,
      outstanding,
      isPartialPayment,
    };
  }, [sessions, selectedSessions, creditBalance, useCreditAmount, paidAmount]);

  const handleSubmit = async () => {
    if (selectedSessions.length === 0) {
      return;
    }

    await confirmPayment.mutateAsync({
      patientId: patient.id,
      sessionIds: selectedSessions,
      paidAmount: calculations.paid,
      paymentMethod: paymentMethod as 'CASH' | 'CARD' | 'PREPAID_CREDIT',
      useCreditAmount: calculations.creditToUse,
      notes: notes || undefined,
    });

    onOpenChange(false);
    // Reset form
    setSelectedSessions(sessions.map((s) => s.id));
    setPaidAmount('');
    setPaymentMethod('CASH');
    setUseCreditAmount('0');
    setNotes('');
  };

  const toggleSession = (sessionId: string) => {
    setSelectedSessions((prev) =>
      prev.includes(sessionId)
        ? prev.filter((id) => id !== sessionId)
        : [...prev, sessionId]
    );
  };

  const toggleAllSessions = () => {
    if (selectedSessions.length === sessions.length) {
      setSelectedSessions([]);
    } else {
      setSelectedSessions(sessions.map((s) => s.id));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Confirm Payment</DialogTitle>
          <DialogDescription>
            Payment confirmation for {patient.firstName} {patient.lastName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Session Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Select Sessions</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleAllSessions}
              >
                {selectedSessions.length === sessions.length
                  ? 'Deselect All'
                  : 'Select All'}
              </Button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto rounded-lg border p-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedSessions.includes(session.id)}
                      onCheckedChange={() => toggleSession(session.id)}
                    />
                    <div>
                      <div className="font-medium">{session.therapyType.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(session.scheduledDate), 'MMM dd, yyyy')} •{' '}
                        {session.startTime} - {session.endTime}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {session.therapist.name}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">৳{session.cost.toFixed(2)}</div>
                    <Badge
                      variant={
                        session.paymentStatus === 'UNPAID'
                          ? 'destructive'
                          : 'outline'
                      }
                      className="mt-1"
                    >
                      {session.paymentStatus}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Payment Calculation */}
          <div className="space-y-3 rounded-lg bg-muted/50 p-4">
            <div className="flex justify-between text-sm">
              <span>Total Due ({selectedSessions.length} sessions):</span>
              <span className="font-medium">৳{calculations.selectedTotal.toFixed(2)}</span>
            </div>
            {creditBalance > 0 && (
              <>
                <div className="flex justify-between text-sm text-green-600">
                  <span className="flex items-center gap-1">
                    <CreditCard className="h-3 w-3" />
                    Available Credit:
                  </span>
                  <span className="font-medium">৳{creditBalance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Credit to Use:</span>
                  <span className="font-medium">
                    -৳{calculations.creditToUse.toFixed(2)}
                  </span>
                </div>
              </>
            )}
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Net Payable:</span>
              <span>৳{calculations.netAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Input */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="paid-amount">Paid Amount *</Label>
              <Input
                id="paid-amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-method">Payment Method *</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="payment-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="CARD">Card</SelectItem>
                  <SelectItem value="PREPAID_CREDIT">Prepaid Credit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {creditBalance > 0 && calculations.maxCreditUsable > 0 && (
              <div className="space-y-2">
                <Label htmlFor="credit-amount">
                  Use Credit (Max: ৳{calculations.maxCreditUsable.toFixed(2)})
                </Label>
                <Input
                  id="credit-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  max={calculations.maxCreditUsable}
                  placeholder="0.00"
                  value={useCreditAmount}
                  onChange={(e) => setUseCreditAmount(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                placeholder="Add any notes about this payment..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Payment Summary */}
          {calculations.paid > 0 && (
            <div className="space-y-3 rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
              <div className="flex justify-between text-sm">
                <span>Cash/Card Payment:</span>
                <span className="font-medium">৳{calculations.paid.toFixed(2)}</span>
              </div>
              {calculations.creditToUse > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Credit Applied:</span>
                  <span className="font-medium">
                    ৳{calculations.creditToUse.toFixed(2)}
                  </span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total Payment:</span>
                <span>৳{calculations.totalPayment.toFixed(2)}</span>
              </div>
              {calculations.outstanding > 0 && (
                <div className="flex justify-between text-sm text-orange-600">
                  <span>Outstanding Dues:</span>
                  <span className="font-medium">
                    ৳{calculations.outstanding.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Partial Payment Warning */}
          {calculations.isPartialPayment && calculations.paid > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This is a partial payment. Outstanding dues of ৳
                {calculations.outstanding.toFixed(2)} will be added to the patient's
                account.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              selectedSessions.length === 0 ||
              !paidAmount ||
              calculations.paid < 0 ||
              confirmPayment.isPending
            }
          >
            <DollarSign className="mr-2 h-4 w-4" />
            {confirmPayment.isPending ? 'Processing...' : 'Confirm Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
