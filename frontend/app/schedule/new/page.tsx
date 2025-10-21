'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { SessionForm } from '@/components/schedule/session-form';
import { useCreateSession } from '@/hooks/use-sessions';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function NewSessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const createSession = useCreateSession();

  // Get default date from query params if provided
  const defaultDate = searchParams.get('date');

  const handleSubmit = async (data: any) => {
    // Convert date to ISO string for the API
    const sessionData = {
      ...data,
      scheduledDate: new Date(data.scheduledDate).toISOString(),
      cost: parseFloat(data.cost),
    };

    await createSession.mutateAsync(sessionData);
    router.push('/schedule');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Schedule New Session</h1>
          <p className="text-muted-foreground">Create a new therapy session</p>
        </div>
      </div>

      <SessionForm
        defaultValues={defaultDate ? { scheduledDate: defaultDate } : undefined}
        onSubmit={handleSubmit}
        isLoading={createSession.isPending}
      />
    </div>
  );
}
