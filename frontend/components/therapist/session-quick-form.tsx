'use client';

import { useEffect } from 'react';
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
import { usePatients } from '@/hooks/use-patients';
import { useCreateSession, useUpdateSession, useSession } from '@/hooks/use-sessions';

interface SessionQuickFormProps {
  therapistId: string;
  therapistName: string;
  therapyTypeId: string;
  sessionCost: number;
  date?: string;
  startTime?: string;
  endTime?: string;
  sessionId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormData {
  patientId: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  cost: number;
  notes?: string;
}

export function SessionQuickForm({
  therapistId,
  therapistName,
  therapyTypeId,
  sessionCost,
  date,
  startTime,
  endTime,
  sessionId,
  open,
  onOpenChange,
}: SessionQuickFormProps) {
  const isEditing = !!sessionId;
  const { data: session } = useSession(sessionId || '');
  const { data: patients } = usePatients();
  const createMutation = useCreateSession();
  const updateMutation = useUpdateSession(sessionId || '');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      scheduledDate: date,
      startTime,
      endTime,
      cost: sessionCost,
    },
  });

  const selectedPatient = watch('patientId');

  // Load existing session data when editing
  useEffect(() => {
    if (session && isEditing) {
      setValue('patientId', session.patientId);
      setValue('scheduledDate', format(new Date(session.scheduledDate), 'yyyy-MM-dd'));
      setValue('startTime', session.startTime);
      setValue('endTime', session.endTime);
      setValue('cost', Number(session.cost));
      setValue('notes', session.notes || '');
    }
  }, [session, isEditing, setValue]);

  // Set default values for create mode
  useEffect(() => {
    if (!isEditing && open) {
      setValue('scheduledDate', date || '');
      setValue('startTime', startTime || '');
      setValue('endTime', endTime || '');
      setValue('cost', sessionCost);
    }
  }, [date, startTime, endTime, sessionCost, isEditing, open, setValue]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      const sessionData = {
        ...data,
        therapistId,
        therapyTypeId,
        scheduledDate: new Date(data.scheduledDate).toISOString(),
        cost: Number(data.cost),
      };

      if (isEditing) {
        await updateMutation.mutateAsync({
          scheduledDate: sessionData.scheduledDate,
          startTime: data.startTime,
          endTime: data.endTime,
          notes: data.notes,
        });
      } else {
        await createMutation.mutateAsync(sessionData);
      }

      onOpenChange(false);
      reset();
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit' : 'Create'} Session</DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Update the session details.'
                : `Book a session with ${therapistName}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Patient Selection */}
            <div className="space-y-2">
              <Label htmlFor="patientId">
                Patient <span className="text-red-500">*</span>
              </Label>
              <Select
                value={selectedPatient}
                onValueChange={(value) => setValue('patientId', value)}
                disabled={isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients?.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.firstName} {patient.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.patientId && (
                <p className="text-sm text-red-500">Patient is required</p>
              )}
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="scheduledDate">
                Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="scheduledDate"
                type="date"
                {...register('scheduledDate', { required: 'Date is required' })}
                disabled={isEditing}
              />
              {errors.scheduledDate && (
                <p className="text-sm text-red-500">{errors.scheduledDate.message}</p>
              )}
            </div>

            {/* Time Range */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startTime">
                  Start Time <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="startTime"
                  type="time"
                  {...register('startTime', { required: 'Start time is required' })}
                  disabled={!isEditing}
                  className={!isEditing ? 'bg-muted' : ''}
                />
                {errors.startTime && (
                  <p className="text-sm text-red-500">{errors.startTime.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  {...register('endTime')}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>

            {/* Cost */}
            <div className="space-y-2">
              <Label htmlFor="cost">
                Cost ($) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                {...register('cost', {
                  required: 'Cost is required',
                  min: { value: 0, message: 'Cost must be positive' },
                })}
              />
              {errors.cost && <p className="text-sm text-red-500">{errors.cost.message}</p>}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                {...register('notes')}
                placeholder="Add any notes about this session"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {isEditing && (
              <p className="text-sm text-muted-foreground">
                Note: Patient, date, and time slot cannot be changed. Cancel and create a new session if needed.
              </p>
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
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : isEditing ? 'Update' : 'Create Session'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
