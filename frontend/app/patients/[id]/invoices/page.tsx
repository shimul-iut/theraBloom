'use client';

import { useRouter } from 'next/navigation';
import { usePatient } from '@/hooks/use-patients';
import { Button } from '@/components/ui/button';
import { LoadingPage } from '@/components/shared/loading-spinner';
import { ErrorMessage } from '@/components/shared/error-boundary';
import { ArrowLeft } from 'lucide-react';
import { PatientInvoiceHistory } from '@/components/invoices/patient-invoice-history';

export default function PatientInvoicesPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: patient, isLoading, error } = usePatient(params.id);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            Invoice History
          </h1>
          <p className="text-muted-foreground">
            {patient.firstName} {patient.lastName}
          </p>
        </div>
      </div>

      <PatientInvoiceHistory patientId={params.id} />
    </div>
  );
}
