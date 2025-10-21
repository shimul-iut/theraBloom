'use client';

import { useRouter } from 'next/navigation';
import { TherapistForm, CreateTherapistInput } from '@/components/therapists/therapist-form';
import { useCreateTherapist } from '@/hooks/use-therapists-mutations';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function NewTherapistPage() {
  const router = useRouter();
  const createTherapist = useCreateTherapist();

  const handleSubmit = async (data: CreateTherapistInput) => {
    await createTherapist.mutateAsync(data);
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
          <h1 className="text-3xl font-bold">Add New Therapist</h1>
          <p className="text-muted-foreground">Create a new therapist account</p>
        </div>
      </div>

      <TherapistForm
        onSubmit={handleSubmit}
        isLoading={createTherapist.isPending}
      />
    </div>
  );
}
