'use client';

import { useState } from 'react';
import { usePatientInvoices } from '@/hooks/use-invoices';
import { InvoiceHistoryList } from './invoice-history-list';
import { InvoicePagination } from './invoice-pagination';
import { InvoiceDateFilter } from './invoice-date-filter';
import { LoadingPage } from '@/components/shared/loading-spinner';
import { ErrorMessage } from '@/components/shared/error-boundary';

interface PatientInvoiceHistoryProps {
  patientId: string;
}

export function PatientInvoiceHistory({ patientId }: PatientInvoiceHistoryProps) {
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState<string | undefined>();
  const [endDate, setEndDate] = useState<string | undefined>();

  const { data, isLoading, error } = usePatientInvoices(patientId, {
    page,
    limit: 20,
    startDate,
    endDate,
  });

  const handleFilterChange = (newStartDate?: string, newEndDate?: string) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
    setPage(1); // Reset to first page when filters change
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  if (isLoading) {
    return <LoadingPage />;
  }

  if (error || !data) {
    return <ErrorMessage message="Failed to load invoice history" />;
  }

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <InvoiceDateFilter
        startDate={startDate}
        endDate={endDate}
        onFilterChange={handleFilterChange}
      />

      {/* Invoice List with Summary */}
      <InvoiceHistoryList
        invoices={data.invoices}
        summary={data.summary}
      />

      {/* Pagination */}
      {data.pagination.totalPages > 1 && (
        <InvoicePagination
          currentPage={data.pagination.page}
          totalPages={data.pagination.totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
