'use client';

import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTherapyTypes } from '@/hooks/use-therapy-types';

export interface CreateTherapistInput {
  phoneNumber: string;
  firstName: string;
  lastName: string;
  specializationId: string;
  sessionDuration: number;
  sessionCost: number;
  password?: string;
}

interface TherapistFormProps {
  defaultValues?: Partial<CreateTherapistInput>;
  onSubmit: (data: CreateTherapistInput) => void;
  isLoading?: boolean;
  isEdit?: boolean;
}

export function TherapistForm({ defaultValues, onSubmit, isLoading, isEdit }: TherapistFormProps) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<CreateTherapistInput>({
    defaultValues,
  });

  const { data: therapyTypes } = useTherapyTypes();
  const selectedSpecializationId = watch('specializationId');

  // Auto-fill duration and cost when specialization changes
  useEffect(() => {
    if (selectedSpecializationId && therapyTypes) {
      const therapyType = therapyTypes.find(t => t.id === selectedSpecializationId);
      if (therapyType && !defaultValues?.sessionDuration) {
        setValue('sessionDuration', therapyType.duration);
        setValue('sessionCost', therapyType.cost);
      }
    }
  }, [selectedSpecializationId, therapyTypes, setValue, defaultValues]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Basic therapist details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">
                First Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="firstName"
                {...register('firstName', { required: 'First name is required' })}
                placeholder="Enter first name"
              />
              {errors.firstName && (
                <p className="text-sm text-red-500">{errors.firstName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">
                Last Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lastName"
                {...register('lastName', { required: 'Last name is required' })}
                placeholder="Enter last name"
              />
              {errors.lastName && (
                <p className="text-sm text-red-500">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">
              Phone Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="phoneNumber"
              {...register('phoneNumber', {
                required: 'Phone number is required',
                pattern: {
                  value: /^[0-9+\-\s()]+$/,
                  message: 'Invalid phone number format'
                }
              })}
              placeholder="e.g., 01912345678"
              disabled={isEdit}
            />
            {errors.phoneNumber && (
              <p className="text-sm text-red-500">{errors.phoneNumber.message}</p>
            )}
            {isEdit && (
              <p className="text-sm text-muted-foreground">Phone number cannot be changed</p>
            )}
          </div>

          {!isEdit && (
            <div className="space-y-2">
              <Label htmlFor="password">
                Password <span className="text-red-500">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters'
                  }
                })}
                placeholder="Enter password"
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Specialization & Pricing</CardTitle>
          <CardDescription>Select the therapy type this therapist specializes in</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="specializationId">
              Specialization <span className="text-red-500">*</span>
            </Label>
            <Select
              value={selectedSpecializationId}
              onValueChange={(value) => setValue('specializationId', value)}
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
            {errors.specializationId && (
              <p className="text-sm text-red-500">Specialization is required</p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sessionDuration">
                Session Duration (minutes) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="sessionDuration"
                type="number"
                {...register('sessionDuration', {
                  required: 'Session duration is required',
                  min: { value: 1, message: 'Duration must be at least 1 minute' }
                })}
                placeholder="60"
                min="1"
              />
              {errors.sessionDuration && (
                <p className="text-sm text-red-500">{errors.sessionDuration.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sessionCost">
                Session Cost ($) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="sessionCost"
                type="number"
                step="0.01"
                {...register('sessionCost', {
                  required: 'Session cost is required',
                  min: { value: 0, message: 'Cost must be positive' }
                })}
                placeholder="50.00"
                min="0"
              />
              {errors.sessionCost && (
                <p className="text-sm text-red-500">{errors.sessionCost.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : isEdit ? 'Update Therapist' : 'Create Therapist'}
        </Button>
      </div>
    </form>
  );
}
