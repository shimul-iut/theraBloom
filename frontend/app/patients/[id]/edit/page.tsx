'use client';

import { useRouter } from 'next/navigation';
import { usePatient, useUpdatePatient } from '@/hooks/use-patients';
import { PatientForm } from '@/components/patients/patient-form';
import { Button } from '@/components/ui/button';
import { LoadingPage } from '@/components/shared/loading-spinner';
import { ErrorMessage } from '@/components/shared/error-boundary';
import { ArrowLeft } from 'lucide-react';

export default function EditPatientPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: patient, isLoading, error } = usePatient(params.id);
  const updatePatient = useUpdatePatient(params.id);

  if (isLoading) return <LoadingPage />;
  
  if (error || !patient) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <ErrorMessage message="Failed to load patient details" />
      </div>
    );
  }

  const handleSubmit = async (data: any) => {
    await updatePatient.mutateAsync(data);
    router.push(`/patients/${params.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Patient</h1>
          <p className="text-muted-foreground">
            Update {patient.firstName} {patient.lastName}'s information
          </p>
        </div>
      </div>

      <PatientForm
        defaultValues={{
          firstName: patient.firstName,
          lastName: patient.lastName,
          dateOfBirth: patient.dateOfBirth.split('T')[0],
          guardianName: patient.guardianName,
          guardianPhone: patient.guardianPhone,
          guardianEmail: patient.guardianEmail || '',
          address: patient.address || '',
          medicalNotes: patient.medicalNotes || '',
        }}
        onSubmit={handleSubmit}
        isLoading={updatePatient.isPending}
      />
    </div>
  );
}
