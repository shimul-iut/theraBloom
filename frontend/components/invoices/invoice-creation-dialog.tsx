'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { UninvoicedPatient, useCreateInvoice } from '@/hooks/use-invoices';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, CreditCard, FileText, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';

interface InvoiceCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientData: UninvoicedPatient;
}

export function InvoiceCreationDialog({
  open,
  onOpenChange,
  patientData,
}: InvoiceCreationDialogProps) {
  const router = useRouter();
  const { patient, sessions } = patientData;
  const createInvoice = useCreateInvoice();

  const [selectedSessions, setSelectedSessions] = useState<string[]>(
    sessions.map((s) => s.id)
  );
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [creditUsed, setCreditUsed] = useState<string>('0');
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
    
    const creditBalance = patient.creditBalance;
    const outstandingDues = patient.totalOutstandingDues;
    
    // Max credit that can be used is the minimum of available credit and invoice total
    const maxCreditUsable = Math.min(creditBalance, selectedTotal);
    const creditToUse = Math.min(Number(creditUsed) || 0, maxCreditUsable);
    
    const paid = Number(paidAmount) || 0;
    const totalPayment = paid + creditToUse;
    const outstanding = Math.max(0, selectedTotal - totalPayment);
    
    // Net payable calculation: total - credit + existing outstanding
    const netPayable = selectedTotal - creditBalance + outstandingDues;
    
    const hasOutstanding = outstanding > 0;
    const creditExceedsTotal = creditToUse > selectedTotal;
    const creditExceedsAvailable = creditToUse > creditBalance;

    return {
      selectedTotal,
      creditBalance,
      outstandingDues,
      maxCreditUsable,
      creditToUse,
      paid,
      totalPayment,
      outstanding,
      netPayable: Math.max(0, netPayable),
      hasOutstanding,
      creditExceedsTotal,
      creditExceedsAvailable,
    };
  }, [sessions, selectedSessions, patient, creditUsed, paidAmount]);

  const handleSubmit = async () => {
    if (selectedSessions.length === 0) {
      return;
    }

    // Validation
    if (calculations.paid < 0) {
      return;
    }

    if (calculations.creditExceedsAvailable) {
      return;
    }

    if (calculations.creditExceedsTotal) {
      return;
    }

    const result = await createInvoice.mutateAsync({
      patientId: patient.id,
      sessionIds: selectedSessions,
      paidAmount: calculations.paid,
      paymentMethod: paymentMethod as 'CASH' | 'CREDIT_CARD' | 'BANK_TRANSFER' | 'PREPAID_CREDIT',
      creditUsed: calculations.creditToUse,
      notes: notes || undefined,
    });

    onOpenChange(false);
    // Reset form
    setSelectedSessions(sessions.map((s) => s.id));
    setPaidAmount('');
    setPaymentMethod('CASH');
    setCreditUsed('0');
    setNotes('');

    // Navigate to the created invoice
    router.push(`/payments/invoices/${result.invoice.id}`);
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

  // Auto-calculate credit to use when paid amount changes
  const handlePaidAmountChange = (value: string) => {
    setPaidAmount(value);
    
    const paid = Number(value) || 0;
    const selectedTotal = sessions
      .filter((s) => selectedSessions.includes(s.id))
      .reduce((sum, session) => sum + Number(session.cost), 0);
    
    const remaining = selectedTotal - paid;
    const maxCredit = Math.min(patient.creditBalance, selectedTotal);
    const autoCredit = Math.max(0, Math.min(remaining, maxCredit));
    
    setCreditUsed(autoCredit.toFixed(2));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Invoice</DialogTitle>
          <DialogDescription>
            Create invoice for {patient.firstName} {patient.lastName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Patient Information */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <div className="text-sm text-muted-foreground">Patient</div>
                  <div className="font-medium">
                    {patient.firstName} {patient.lastName}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Credit Balance</div>
                  <div className="font-medium text-green-600">
                    ৳{calculations.creditBalance.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Outstanding Dues</div>
                  <div className="font-medium text-red-600">
                    ৳{calculations.outstandingDues.toFixed(2)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Session Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Select Sessions</Label>
              <Button variant="ghost" size="sm" onClick={toggleAllSessions}>
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
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Invoice Calculation */}
          <div className="space-y-3 rounded-lg bg-muted/50 p-4">
            <div className="flex justify-between text-sm">
              <span>Invoice Total ({selectedSessions.length} sessions):</span>
              <span className="font-medium">৳{calculations.selectedTotal.toFixed(2)}</span>
            </div>
            {calculations.creditBalance > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span className="flex items-center gap-1">
                  <CreditCard className="h-3 w-3" />
                  Available Credit:
                </span>
                <span className="font-medium">৳{calculations.creditBalance.toFixed(2)}</span>
              </div>
            )}
            {calculations.outstandingDues > 0 && (
              <div className="flex justify-between text-sm text-red-600">
                <span className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Existing Outstanding:
                </span>
                <span className="font-medium">৳{calculations.outstandingDues.toFixed(2)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Net Payable:</span>
              <span className={calculations.netPayable > 0 ? 'text-red-600' : 'text-green-600'}>
                ৳{calculations.netPayable.toFixed(2)}
              </span>
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
                onChange={(e) => handlePaidAmountChange(e.target.value)}
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
                  <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="PREPAID_CREDIT">Prepaid Credit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {calculations.creditBalance > 0 && calculations.maxCreditUsable > 0 && (
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
                  value={creditUsed}
                  onChange={(e) => setCreditUsed(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this invoice..."
                value={notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          {/* Payment Breakdown */}
          {(calculations.paid > 0 || calculations.creditToUse > 0) && (
            <div className="space-y-3 rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
              <div className="text-sm font-semibold">Payment Breakdown</div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span>Invoice Total:</span>
                <span className="font-medium">৳{calculations.selectedTotal.toFixed(2)}</span>
              </div>
              {calculations.paid > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Cash/Card Payment:</span>
                  <span className="font-medium">৳{calculations.paid.toFixed(2)}</span>
                </div>
              )}
              {calculations.creditToUse > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Credit Applied:</span>
                  <span className="font-medium">-৳{calculations.creditToUse.toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total Payment:</span>
                <span>৳{calculations.totalPayment.toFixed(2)}</span>
              </div>
              {calculations.outstanding > 0 && (
                <div className="flex justify-between text-sm text-orange-600">
                  <span>Outstanding Amount:</span>
                  <span className="font-medium">৳{calculations.outstanding.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          {/* Validation Warnings */}
          {calculations.creditExceedsAvailable && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Invalid Credit Amount</AlertTitle>
              <AlertDescription>
                Credit used (৳{calculations.creditToUse.toFixed(2)}) exceeds available credit (৳
                {calculations.creditBalance.toFixed(2)}).
              </AlertDescription>
            </Alert>
          )}

          {calculations.creditExceedsTotal && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Invalid Credit Amount</AlertTitle>
              <AlertDescription>
                Credit used (৳{calculations.creditToUse.toFixed(2)}) cannot exceed invoice total (৳
                {calculations.selectedTotal.toFixed(2)}).
              </AlertDescription>
            </Alert>
          )}

          {calculations.hasOutstanding && calculations.paid >= 0 && !calculations.creditExceedsTotal && !calculations.creditExceedsAvailable && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Outstanding Balance</AlertTitle>
              <AlertDescription>
                This invoice will have an outstanding balance of ৳
                {calculations.outstanding.toFixed(2)}. This will be added to the patient's
                outstanding dues.
              </AlertDescription>
            </Alert>
          )}

          {calculations.netPayable < 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Credit Exceeds Cost</AlertTitle>
              <AlertDescription>
                The patient's credit balance exceeds the invoice total. The remaining credit
                will stay in their account.
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
              calculations.paid < 0 ||
              calculations.creditExceedsAvailable ||
              calculations.creditExceedsTotal ||
              createInvoice.isPending
            }
          >
            <FileText className="mr-2 h-4 w-4" />
            {createInvoice.isPending ? 'Creating...' : 'Create Invoice'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
