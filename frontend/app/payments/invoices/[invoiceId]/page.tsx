'use client';

import { useParams, useRouter } from 'next/navigation';
import { useInvoice } from '@/hooks/use-invoices';
import { LoadingPage } from '@/components/shared/loading-spinner';
import { ErrorMessage } from '@/components/shared/error-boundary';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { InvoiceView } from '@/components/invoices/invoice-view';
import { AuditLogButton } from '@/components/audit/audit-log-button';

export default function InvoicePage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.invoiceId as string;

  const { data: invoiceData, isLoading, error } = useInvoice(invoiceId);

  if (isLoading) {
    return <LoadingPage />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <ErrorMessage message="Failed to load invoice details" />
      </div>
    );
  }

  if (!invoiceData) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <ErrorMessage message="Invoice not found" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <AuditLogButton resourceType="Invoice" resourceId={invoiceId} />
      </div>

      <InvoiceView invoiceData={invoiceData} />
    </div>
  );
}
