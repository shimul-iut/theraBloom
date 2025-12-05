'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuditLogs } from '@/hooks/use-audit-logs';
import { AuditLogsFilters, AuditLogFilters } from '@/components/audit/audit-logs-filters';
import { AuditLogsTable } from '@/components/audit/audit-logs-table';
import { LoadingPage } from '@/components/shared/loading-spinner';
import { ErrorMessage } from '@/components/shared/error-boundary';
import { Button } from '@/components/ui/button';
import { History, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AuditLogsPage() {
  const searchParams = useSearchParams();
  
  // Initialize filters from URL parameters
  const [filters, setFilters] = useState<AuditLogFilters>({
    resourceType: searchParams.get('resourceType') || undefined,
    resourceId: searchParams.get('resourceId') || undefined,
    action: searchParams.get('action') || undefined,
    startDate: searchParams.get('startDate') || undefined,
    endDate: searchParams.get('endDate') || undefined,
    page: 1,
    limit: 50,
  });

  // Determine if we have a preset context from URL
  const presetContext = filters.resourceType && filters.resourceId
    ? {
        resourceType: filters.resourceType,
        resourceId: filters.resourceId,
        label: `${filters.resourceType} (${filters.resourceId.substring(0, 8)}...)`,
      }
    : undefined;

  const { data, isLoading, error } = useAuditLogs(filters);

  const handlePageChange = (newPage: number) => {
    setFilters({ ...filters, page: newPage });
  };

  if (isLoading) return <LoadingPage />;
  if (error) return <ErrorMessage message="Failed to load audit logs" />;

  const logs = data?.logs || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <History className="h-8 w-8" />
          Audit Logs
        </h1>
        <p className="text-muted-foreground">
          View and search system activity logs
        </p>
      </div>

      {/* Filters */}
      <AuditLogsFilters
        filters={filters}
        onFiltersChange={setFilters}
        presetContext={presetContext}
      />

      {/* Results Summary */}
      {pagination && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {logs.length} of {pagination.total} log entries
          </p>
          <div className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </div>
        </div>
      )}

      {/* Table */}
      <AuditLogsTable logs={logs} />

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <Button
                  key={pageNum}
                  variant={pagination.page === pageNum ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
            {pagination.totalPages > 5 && (
              <>
                <span className="px-2">...</span>
                <Button
                  variant={pagination.page === pagination.totalPages ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePageChange(pagination.totalPages)}
                >
                  {pagination.totalPages}
                </Button>
              </>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
