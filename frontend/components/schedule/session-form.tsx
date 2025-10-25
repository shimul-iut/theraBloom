'use client';

import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePatients } from '@/hooks/use-patients';
import { useTherapists } from '@/hooks/use-therapists';
import { useTherapyTypes } from '@/hooks/use-therapy-types';
import { AvailabilityChecker } from './availability-checker';

import { CreateSessionInput } from '@/hooks/use-sessions';

interface SessionFormProps {
  defaultValues?: Partial<CreateSessionInput>;
  onSubmit: (data: CreateSessionInput) => void;
  isLoading?: boolean;
}

export function SessionForm({ defaultValues, onSubmit, isLoading }: SessionFormProps) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<CreateSessionInput>({
    defaultValues,
  });

  const { data: patients } = usePatients();
  const { data: therapists } = useTherapists();
  const { data: therapyTypes } = useTherapyTypes();

  const selectedPatient = watch('patientId');
  const selectedTherapist = watch('therapistId');
  const selectedTherapyType = watch('therapyTypeId');
  const startTime = watch('startTime');
  const endTime = watch('endTime');
  const scheduledDate = watch('scheduledDate');

  // Auto-select therapy type and calculate end time when therapist is selected
  useEffect(() => {
    if (selectedTherapist && therapists) {
      const therapist = therapists.find(t => t.id === selectedTherapist);
      if (therapist) {
        // Auto-select therapy type based on therapist's specialization
        if (therapist.specializationId) {
          setValue('therapyTypeId', therapist.specializationId);
        }

        // Auto-fill cost
        if (therapist.sessionCost) {
          const cost = Number(therapist.sessionCost) || 0;
          setValue('cost', cost);
        }

        // Auto-calculate end time based on sessionDuration
        if (therapist.sessionDuration && startTime) {
          const duration = therapist.sessionDuration;
          const [hours, minutes] = startTime.split(':').map(Number);
          const startMinutes = hours * 60 + minutes;
          const endMinutes = startMinutes + duration;
          const endHours = Math.floor(endMinutes / 60);
          const endMins = endMinutes % 60;
          const endTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
          setValue('endTime', endTime);
        }
      }
    }
  }, [selectedTherapist, therapists, startTime, setValue]);

  // Recalculate end time when start time changes
  useEffect(() => {
    if (selectedTherapist && therapists && startTime) {
      const therapist = therapists.find(t => t.id === selectedTherapist);
      if (therapist && therapist.sessionDuration) {
        const duration = therapist.sessionDuration;
        const [hours, minutes] = startTime.split(':').map(Number);
        const startMinutes = hours * 60 + minutes;
        const endMinutes = startMinutes + duration;
        const endHours = Math.floor(endMinutes / 60);
        const endMins = endMinutes % 60;
        const endTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
        setValue('endTime', endTime);
      }
    }
  }, [startTime, selectedTherapist, therapists, setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Session Details</CardTitle>
          <CardDescription>Schedule a new therapy session</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="patientId">
              Patient <span className="text-red-500">*</span>
            </Label>
            <Select
              value={selectedPatient}
              onValueChange={(value) => setValue('patientId', value)}
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

          <div className="space-y-2">
            <Label htmlFor="therapistId">
              Therapist <span className="text-red-500">*</span>
            </Label>
            <Select
              value={selectedTherapist}
              onValueChange={(value) => setValue('therapistId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select therapist" />
              </SelectTrigger>
              <SelectContent>
                {therapists?.map((therapist) => (
                  <SelectItem key={therapist.id} value={therapist.id}>
                    {therapist.firstName} {therapist.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.therapistId && (
              <p className="text-sm text-red-500">Therapist is required</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="therapyTypeId">
              Therapy Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={selectedTherapyType}
              onValueChange={(value) => setValue('therapyTypeId', value)}
              disabled={!!selectedTherapist}
            >
              <SelectTrigger className={selectedTherapist ? 'bg-muted cursor-not-allowed' : ''}>
                <SelectValue placeholder="Select therapist first" />
              </SelectTrigger>
              <SelectContent>
                {therapyTypes?.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name} ({type.duration} min)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTherapist && (
              <p className="text-sm text-muted-foreground">
                Auto-selected based on therapist's specialization
              </p>
            )}
            {errors.therapyTypeId && (
              <p className="text-sm text-red-500">Therapy type is required</p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="scheduledDate">
                Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="scheduledDate"
                type="date"
                {...register('scheduledDate', { required: 'Date is required' })}
              />
              {errors.scheduledDate && (
                <p className="text-sm text-red-500">{errors.scheduledDate.message}</p>
              )}
            </div>

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
                  min: { value: 0, message: 'Cost must be positive' }
                })}
                placeholder="50.00"
              />
              {errors.cost && (
                <p className="text-sm text-red-500">{errors.cost.message}</p>
              )}
            </div>
          </div>

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
                End Time (Auto-calculated)
              </Label>
              <Input
                id="endTime"
                type="time"
                {...register('endTime')}
                disabled
                className="bg-muted cursor-not-allowed"
              />
              <p className="text-sm text-muted-foreground">
                Calculated based on session duration
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              {...register('notes')}
              placeholder="Add any notes about this session"
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </CardContent>
      </Card>

      {/* Availability Checker */}
      {selectedTherapist && scheduledDate && startTime && endTime && (
        <AvailabilityChecker
          therapistId={selectedTherapist}
          date={scheduledDate}
          startTime={startTime}
          endTime={endTime}
        />
      )}

      <div className="flex justify-end gap-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Session'}
        </Button>
      </div>
    </form>
  );
}
