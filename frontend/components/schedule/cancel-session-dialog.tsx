'use client';

import { useState } from 'react';
import { Session, useCancelSession } from '@/hooks/use-sessions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface CancelSessionDialogProps {
  session: Session | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CancelSessionDialog({
  session,
  open,
  onOpenChange,
}: CancelSessionDialogProps) {
  const [cancelReason, setCancelReason] = useState('');
  const cancelMutation = useCancelSession(session?.id || '');

  const handleCancel = async () => {
    if (!session) return;

    await cancelMutation.mutateAsync(
      cancelReason ? { cancelReason } : undefined
    );
    
    // Close dialog and reset form
    onOpenChange(false);
    setCancelReason('');
  };

  if (!session) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Cancel Session
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel this session? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Session Details */}
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Patient:</span>
              <span className="text-sm">
                {session.Patient.firstName} {session.Patient.lastName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Therapy Type:</span>
              <span className="text-sm">{session.TherapyType.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Date:</span>
              <span className="text-sm">
                {format(new Date(session.scheduledDate), 'MMM dd, yyyy')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Time:</span>
              <span className="text-sm">
                {session.startTime} - {session.endTime}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Cost:</span>
              <span className="text-sm">৳{Number(session.cost).toFixed(2)}</span>
            </div>
          </div>

          {/* Financial Impact Notice */}
          {session.InvoiceLineItem && (
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4 space-y-2">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Financial Adjustment
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                This session is part of invoice{' '}
                <span className="font-medium">
                  {session.InvoiceLineItem.Invoice.invoiceNumber}
                </span>
                . Cancelling will automatically adjust the patient's credit balance or
                outstanding dues.
              </p>
            </div>
          )}

          {/* Cancel Reason */}
          <div className="space-y-2">
            <Label htmlFor="cancelReason">
              Cancellation Reason <span className="text-muted-foreground">(Optional)</span>
            </Label>
            <Textarea
              id="cancelReason"
              placeholder="Enter reason for cancellation..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={cancelMutation.isPending}
          >
            Keep Session
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={cancelMutation.isPending}
          >
            {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Session'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
