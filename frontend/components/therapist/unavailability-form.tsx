'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  useCreateUnavailability,
  useAffectedSessions,
  useAvailableRescheduleSlots,
  UnavailabilityReason,
  CreateUnavailabilityInput,
} from '@/hooks/use-therapist-unavailability';
import { useUpdateSession } from '@/hooks/use-sessions';
import { AlertTriangle, Calendar, Clock, User } from 'lucide-react';
import { LoadingPage } from '@/components/shared/loading-spinner';

interface UnavailabilityFormProps {
  therapistId: string;
  therapistName: string;
  sessionDuration: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type UnavailabilityType = 'slot' | 'day' | 'range';

const REASONS: { value: UnavailabilityReason; label: string }[] = [
  { value: 'SICK_LEAVE', label: 'Sick Leave' },
  { value: 'VACATION', label: 'Vacation' },
  { value: 'PERSONAL_LEAVE', label: 'Personal Leave' },
  { value: 'EMERGENCY', label: 'Emergency' },
  { value: 'TRAINING', label: 'Training/Conference' },
  { value: 'OTHER', label: 'Other' },
];

export function UnavailabilityForm({
  therapistId,
  therapistName,
  sessionDuration,
  open,
  onOpenChange,
}: UnavailabilityFormProps) {
  const [unavailabilityType, setUnavailabilityType] = useState<UnavailabilityType>('day');
  const [step, setStep] = useState<'details' | 'reschedule'>('details');
  const [rescheduleMappings, setRescheduleMappings] = useState<Record<string, string>>({});

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateUnavailabilityInput>();

  const startDate = watch('startDate');
  const endDate = watch('endDate');
  const startTime = watch('startTime');
  const endTime = watch('endTime');
  const selectedReason = watch('reason');

  const createMutation = useCreateUnavailability(therapistId);

  // Fetch affected sessions
  const { data: affectedSessions, isLoading: loadingAffected } = useAffectedSessions(
    therapistId,
    startDate,
    endDate,
    unavailabilityType === 'slot' ? startTime : undefined,
    unavailabilityType === 'slot' ? endTime : undefined
  );

  // Fetch available reschedule slots
  const { data: availableSlots, isLoading: loadingSlots } = useAvailableRescheduleSlots(
    therapistId,
    sessionDuration,
    endDate // Start looking from end date
  );

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      reset();
      setStep('details');
      setRescheduleMappings({});
      setUnavailabilityType('day');
    }
  }, [open, reset]);

  // Auto-set end date for single day
  useEffect(() => {
    if (unavailabilityType === 'day' && startDate) {
      setValue('endDate', startDate);
    }
  }, [unavailabilityType, startDate, setValue]);

  const handleContinue = () => {
    if (affectedSessions && affectedSessions.length > 0) {
      setStep('reschedule');
    } else {
      handleFinalSubmit();
    }
  };

  const handleFinalSubmit = async () => {
    const data = watch();
    
    const unavailabilityData: CreateUnavailabilityInput = {
      startDate: new Date(data.startDate).toISOString(),
      endDate: new Date(data.endDate).toISOString(),
      startTime: unavailabilityType === 'slot' ? data.startTime : undefined,
      endTime: unavailabilityType === 'slot' ? data.endTime : undefined,
      reason: data.reason,
      notes: data.notes,
      rescheduleSessionIds: Object.keys(rescheduleMappings),
    };

    try {
      await createMutation.mutateAsync(unavailabilityData);
      
      // Reschedule sessions
      for (const [sessionId, newSlot] of Object.entries(rescheduleMappings)) {
        if (newSlot && newSlot !== 'cancel') {
          const [date, time] = newSlot.split('T');
          const slot = availableSlots?.find(
            s => s.date === date && s.startTime === time
          );
          if (slot) {
            await useUpdateSession(sessionId).mutateAsync({
              scheduledDate: new Date(date).toISOString(),
              startTime: slot.startTime,
              endTime: slot.endTime,
            });
          }
        }
      }

      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const isLoading = createMutation.isPending || loadingAffected;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        {step === 'details' ? (
          <form onSubmit={handleSubmit(handleContinue)}>
            <DialogHeader>
              <DialogTitle>Mark {therapistName} Unavailable</DialogTitle>
              <DialogDescription>
                Set unavailability period for urgent leaves, vacations, or breaks
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Unavailability Type */}
              <div className="space-y-2">
                <Label>Unavailability Type</Label>
                <Select
                  value={unavailabilityType}
                  onValueChange={(value: string) => setUnavailabilityType(value as UnavailabilityType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="slot">Specific Time Slot</SelectItem>
                    <SelectItem value="day">Entire Day</SelectItem>
                    <SelectItem value="range">Date Range (Multiple Days)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Selection */}
              {unavailabilityType === 'slot' || unavailabilityType === 'day' ? (
                <div className="space-y-2">
                  <Label htmlFor="startDate">
                    Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    {...register('startDate', { required: 'Date is required' })}
                  />
                  {errors.startDate && (
                    <p className="text-sm text-red-500">{errors.startDate.message}</p>
                  )}
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">
                      Start Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      {...register('startDate', { required: 'Start date is required' })}
                    />
                    {errors.startDate && (
                      <p className="text-sm text-red-500">{errors.startDate.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">
                      End Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="endDate"
                      type="date"
                      {...register('endDate', { required: 'End date is required' })}
                    />
                    {errors.endDate && (
                      <p className="text-sm text-red-500">{errors.endDate.message}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Time Selection (only for slot type) */}
              {unavailabilityType === 'slot' && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">
                      Start Time <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="startTime"
                      type="time"
                      {...register('startTime', { required: 'Start time is required' })}
                    />
                    {errors.startTime && (
                      <p className="text-sm text-red-500">{errors.startTime.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">
                      End Time <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="endTime"
                      type="time"
                      {...register('endTime', { required: 'End time is required' })}
                    />
                    {errors.endTime && (
                      <p className="text-sm text-red-500">{errors.endTime.message}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Reason */}
              <div className="space-y-2">
                <Label htmlFor="reason">
                  Reason <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={selectedReason}
                  onValueChange={(value) => setValue('reason', value as UnavailabilityReason)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {REASONS.map((reason) => (
                      <SelectItem key={reason.value} value={reason.value}>
                        {reason.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.reason && (
                  <p className="text-sm text-red-500">Reason is required</p>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <textarea
                  id="notes"
                  {...register('notes')}
                  placeholder="Add any additional notes..."
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>

              {/* Affected Sessions Warning */}
              {loadingAffected && (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>Checking for affected sessions...</AlertDescription>
                </Alert>
              )}

              {affectedSessions && affectedSessions.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{affectedSessions.length} session(s)</strong> will be affected by this unavailability.
                    You'll need to reschedule them in the next step.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || !selectedReason}>
                {affectedSessions && affectedSessions.length > 0 ? 'Continue to Reschedule' : 'Mark Unavailable'}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          // Reschedule Step
          <div>
            <DialogHeader>
              <DialogTitle>Reschedule Affected Sessions</DialogTitle>
              <DialogDescription>
                Choose new time slots for the affected sessions or cancel them
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {loadingSlots ? (
                <LoadingPage />
              ) : (
                affectedSessions?.map((session) => (
                  <div key={session.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {session.patient.firstName} {session.patient.lastName}
                        </span>
                      </div>
                      <Badge variant="outline">
                        {format(new Date(session.scheduledDate), 'MMM d')} at {session.startTime}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`reschedule-${session.id}`} className="text-sm">
                        Reschedule to:
                      </Label>
                      <Select
                        value={rescheduleMappings[session.id] || ''}
                        onValueChange={(value) =>
                          setRescheduleMappings((prev) => ({
                            ...prev,
                            [session.id]: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select new slot or cancel" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cancel">
                            <span className="text-red-600">Cancel Session</span>
                          </SelectItem>
                          {availableSlots?.slice(0, 20).map((slot) => (
                            <SelectItem key={`${slot.date}T${slot.startTime}`} value={`${slot.date}T${slot.startTime}`}>
                              {format(new Date(slot.date), 'EEE, MMM d')} at {slot.startTime} - {slot.endTime}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))
              )}

              {availableSlots && availableSlots.length === 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    No available slots found in the next 30 days. You may need to cancel these sessions.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('details')}
                disabled={createMutation.isPending}
              >
                Back
              </Button>
              <Button
                onClick={handleFinalSubmit}
                disabled={
                  createMutation.isPending ||
                  (affectedSessions?.some((s) => !rescheduleMappings[s.id]) ?? false)
                }
              >
                {createMutation.isPending ? 'Processing...' : 'Confirm & Mark Unavailable'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
