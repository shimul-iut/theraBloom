'use client';

import { useForm } from 'react-hook-form';
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
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import {
  useCreateAvailability,
  useUpdateAvailability,
  useAvailabilitySlot,
  DayOfWeek,
  CreateAvailabilityInput,
  UpdateAvailabilityInput,
} from '@/hooks/use-therapist-availability';
import { useEffect } from 'react';

interface AvailabilitySlotFormProps {
  therapistId: string;
  therapistSpecializationId?: string;
  slotId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DAYS: { value: DayOfWeek; label: string }[] = [
  { value: 'MONDAY', label: 'Monday' },
  { value: 'TUESDAY', label: 'Tuesday' },
  { value: 'WEDNESDAY', label: 'Wednesday' },
  { value: 'THURSDAY', label: 'Thursday' },
  { value: 'FRIDAY', label: 'Friday' },
  { value: 'SATURDAY', label: 'Saturday' },
  { value: 'SUNDAY', label: 'Sunday' },
];

export function AvailabilitySlotForm({
  therapistId,
  therapistSpecializationId,
  slotId,
  open,
  onOpenChange,
}: AvailabilitySlotFormProps) {
  const isEditing = !!slotId;
  const { data: slot } = useAvailabilitySlot(therapistId, slotId || '');
  const createMutation = useCreateAvailability(therapistId);
  const updateMutation = useUpdateAvailability(therapistId, slotId || '');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateAvailabilityInput>({
    defaultValues: {
      slotType: 'AVAILABLE',
      therapyTypeId: therapistSpecializationId || '',
    },
  });

  const selectedDay = watch('dayOfWeek');
  const selectedSlotType = watch('slotType');

  // Set therapyTypeId from therapist's specialization
  useEffect(() => {
    if (therapistSpecializationId && !isEditing) {
      setValue('therapyTypeId', therapistSpecializationId, { shouldValidate: true, shouldDirty: true });
    }
  }, [therapistSpecializationId, isEditing, setValue]);

  // Check if therapist has specialization
  const hasSpecialization = !!therapistSpecializationId;

  // Load existing slot data when editing
  useEffect(() => {
    if (slot && isEditing) {
      setValue('dayOfWeek', slot.dayOfWeek);
      setValue('therapyTypeId', slot.therapyTypeId);
      setValue('startTime', slot.startTime);
      setValue('endTime', slot.endTime);
      setValue('slotType', slot.slotType || 'AVAILABLE');
    }
  }, [slot, isEditing, setValue]);

  // Reset form when dialog closes, set therapyTypeId when it opens
  useEffect(() => {
    if (!open) {
      reset();
    } else if (open && !isEditing && therapistSpecializationId) {
      // Set therapyTypeId when dialog opens for new slots
      setValue('therapyTypeId', therapistSpecializationId);
    }
  }, [open, reset, isEditing, therapistSpecializationId, setValue]);

  const onSubmit = async (data: CreateAvailabilityInput) => {
    try {
      if (isEditing) {
        const updateData: UpdateAvailabilityInput = {
          dayOfWeek: data.dayOfWeek,
          startTime: data.startTime,
          endTime: data.endTime,
          slotType: data.slotType,
        };
        await updateMutation.mutateAsync(updateData);
      } else {
        // Ensure therapyTypeId is present before submitting
        if (!data.therapyTypeId) {
          console.error('Form submission blocked - therapyTypeId missing. Form data:', data);
          console.error('therapistSpecializationId prop:', therapistSpecializationId);
          toast.error('Cannot create availability: Therapist specialization is required');
          return;
        }
        console.log('Submitting availability with data:', data);
        await createMutation.mutateAsync(data);
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
            <DialogTitle>{isEditing ? 'Edit' : 'Add'} Availability Slot</DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Update the availability slot details.'
                : 'Add a new availability slot for this therapist.'}
            </DialogDescription>
          </DialogHeader>

          {!hasSpecialization && !isEditing && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This therapist doesn't have a specialization set. Please set their specialization first before adding availability slots.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4 py-4">
            {/* Hidden field for therapyTypeId */}
            <input type="hidden" {...register('therapyTypeId')} />
            
            {/* Day of Week */}
            <div className="space-y-2">
              <Label htmlFor="dayOfWeek">
                Day of Week <span className="text-red-500">*</span>
              </Label>
              <Select
                value={selectedDay}
                onValueChange={(value) => setValue('dayOfWeek', value as DayOfWeek)}
                disabled={isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((day) => (
                    <SelectItem key={day.value} value={day.value}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.dayOfWeek && (
                <p className="text-sm text-red-500">Day of week is required</p>
              )}
            </div>

            {/* Slot Type */}
            <div className="space-y-2">
              <Label htmlFor="slotType">
                Slot Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={selectedSlotType || 'AVAILABLE'}
                onValueChange={(value) => setValue('slotType', value as 'AVAILABLE' | 'BREAK')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select slot type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AVAILABLE">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-green-500" />
                      <span>Available for Sessions</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="BREAK">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-orange-500" />
                      <span>Break Time (No Sessions)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {selectedSlotType === 'BREAK'
                  ? 'Break slots prevent session booking during this time'
                  : 'Available slots can be booked for therapy sessions'}
              </p>
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

            {isEditing && (
              <p className="text-sm text-muted-foreground">
                Note: Day cannot be changed. Delete and create a new slot if needed.
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
            <Button type="submit" disabled={isLoading || (!hasSpecialization && !isEditing)}>
              {isLoading ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
