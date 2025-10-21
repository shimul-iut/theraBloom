'use client';

import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreatePatientInput } from '@/hooks/use-patients';

interface PatientFormProps {
  defaultValues?: Partial<CreatePatientInput>;
  onSubmit: (data: CreatePatientInput) => void;
  isLoading?: boolean;
}

export function PatientForm({ defaultValues, onSubmit, isLoading }: PatientFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<CreatePatientInput>({
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Basic patient details</CardDescription>
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
            <Label htmlFor="dateOfBirth">
              Date of Birth <span className="text-red-500">*</span>
            </Label>
            <Input
              id="dateOfBirth"
              type="date"
              {...register('dateOfBirth', { required: 'Date of birth is required' })}
            />
            {errors.dateOfBirth && (
              <p className="text-sm text-red-500">{errors.dateOfBirth.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              {...register('address')}
              placeholder="Enter address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="medicalNotes">Medical Notes</Label>
            <textarea
              id="medicalNotes"
              {...register('medicalNotes')}
              placeholder="Enter any relevant medical information"
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Guardian Information</CardTitle>
          <CardDescription>Primary contact details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="guardianName">
              Guardian Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="guardianName"
              {...register('guardianName', { required: 'Guardian name is required' })}
              placeholder="Enter guardian name"
            />
            {errors.guardianName && (
              <p className="text-sm text-red-500">{errors.guardianName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="guardianPhone">
              Guardian Phone <span className="text-red-500">*</span>
            </Label>
            <Input
              id="guardianPhone"
              type="tel"
              {...register('guardianPhone', { required: 'Guardian phone is required' })}
              placeholder="+1234567890"
            />
            {errors.guardianPhone && (
              <p className="text-sm text-red-500">{errors.guardianPhone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="guardianEmail">Guardian Email</Label>
            <Input
              id="guardianEmail"
              type="email"
              {...register('guardianEmail')}
              placeholder="guardian@example.com"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Patient'}
        </Button>
      </div>
    </form>
  );
}
