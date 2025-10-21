'use client';

import { useRouter } from 'next/navigation';
import { useTherapist } from '@/hooks/use-therapists';
import { useUpdateTherapist } from '@/hooks/use-therapists-mutations';
import { TherapistForm, CreateTherapistInput } from '@/components/therapists/therapist-form';
import { Button } from '@/components/ui/button';
import { LoadingPage } from '@/components/shared/loading-spinner';
import { ErrorMessage } from '@/components/shared/error-boundary';
import { ArrowLeft } from 'lucide-react';

export default function EditTherapistPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: therapist, isLoading, error } = useTherapist(params.id);
  const updateTherapist = useUpdateTherapist(params.id);

  if (isLoading) return <LoadingPage />;

  if (error || !therapist) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <ErrorMessage message="Failed to load therapist details" />
      </div>
    );
  }

  const handleSubmit = async (data: CreateTherapistInput) => {
    await updateTherapist.mutateAsync({
      firstName: data.firstName,
      lastName: data.lastName,
      specializationId: data.specializationId,
      sessionDuration: data.sessionDuration,
      sessionCost: data.sessionCost,
    });
    router.push('/therapists');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Therapist</h1>
          <p className="text-muted-foreground">
            Update {therapist.firstName} {therapist.lastName}'s information
          </p>
        </div>
      </div>

      <TherapistForm
        defaultValues={{
          phoneNumber: therapist.phoneNumber,
          firstName: therapist.firstName,
          lastName: therapist.lastName,
          specializationId: therapist.specializationId || '',
          sessionDuration: therapist.sessionDuration || 60,
          sessionCost: therapist.sessionCost ? Number(therapist.sessionCost) : 50,
        }}
        onSubmit={handleSubmit}
        isLoading={updateTherapist.isPending}
        isEdit
      />
    </div>
  );
}
