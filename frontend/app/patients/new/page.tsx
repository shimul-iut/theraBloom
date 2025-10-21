'use client';

import { useRouter } from 'next/navigation';
import { useCreatePatient } from '@/hooks/use-patients';
import { PatientForm } from '@/components/patients/patient-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function NewPatientPage() {
  const router = useRouter();
  const createPatient = useCreatePatient();

  const handleSubmit = async (data: any) => {
    await createPatient.mutateAsync(data);
    router.push('/patients');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Add New Patient</h1>
          <p className="text-muted-foreground">Create a new patient record</p>
        </div>
      </div>

      <PatientForm onSubmit={handleSubmit} isLoading={createPatient.isPending} />
    </div>
  );
}
