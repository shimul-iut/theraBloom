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
import { useTherapyTypes } from '@/hooks/use-therapy-types';
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
  slotId,
  open,
  onOpenChange,
}: AvailabilitySlotFormProps) {
  const isEditing = !!slotId;
  const { data: slot } = useAvailabilitySlot(therapistId, slotId || '');
  const { data: therapyTypes } = useTherapyTypes();
  const createMutation = useCreateAvailability(therapistId);
  const updateMutation = useUpdateAvailability(therapistId, slotId || '');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateAvailabilityInput>();

  const selectedDay = watch('dayOfWeek');
  const selectedTherapyType = watch('therapyTypeId');

  // Load existing slot data when editing
  useEffect(() => {
    if (slot && isEditing) {
      setValue('dayOfWeek', slot.dayOfWeek);
      setValue('therapyTypeId', slot.therapyTypeId);
      setValue('startTime', slot.startTime);
      setValue('endTime', slot.endTime);
    }
  }, [slot, isEditing, setValue]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  const onSubmit = async (data: CreateAvailabilityInput) => {
    try {
      if (isEditing) {
        const updateData: UpdateAvailabilityInput = {
          dayOfWeek: data.dayOfWeek,
          startTime: data.startTime,
          endTime: data.endTime,
        };
        await updateMutation.mutateAsync(updateData);
      } else {
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

          <div className="space-y-4 py-4">
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

            {/* Therapy Type */}
            <div className="space-y-2">
              <Label htmlFor="therapyTypeId">
                Therapy Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={selectedTherapyType}
                onValueChange={(value) => setValue('therapyTypeId', value)}
                disabled={isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select therapy type" />
                </SelectTrigger>
                <SelectContent>
                  {therapyTypes?.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.therapyTypeId && (
                <p className="text-sm text-red-500">Therapy type is required</p>
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
                Note: Day and therapy type cannot be changed. Delete and create a new slot if needed.
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
              {isLoading ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
