'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUninvoicedSessions } from '@/hooks/use-invoices';
import { LoadingPage } from '@/components/shared/loading-spinner';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorMessage } from '@/components/shared/error-boundary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Search, Filter, X } from 'lucide-react';
import { UninvoicedPatientCard } from '@/components/invoices/uninvoiced-patient-card';
import { InvoiceFilters } from '@/components/invoices/invoice-filters';

export default function PaymentsPage() {
  const router = useRouter();
  const { data, isLoading, error } = useUninvoicedSessions();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>({});
  const [selectedTherapist, setSelectedTherapist] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // Extract unique therapists from all sessions
  const uniqueTherapists = useMemo(() => {
    if (!data?.patients) return [];
    const therapistMap = new Map();
    data.patients.forEach((patientData) => {
      patientData.sessions.forEach((session) => {
        if (!therapistMap.has(session.therapist.id)) {
          therapistMap.set(session.therapist.id, session.therapist);
        }
      });
    });
    return Array.from(therapistMap.values());
  }, [data]);

  // Filter patients based on search query and filters
  const filteredPatients = useMemo(() => {
    if (!data?.patients) return [];
    return data.patients.filter((patientData) => {
      const fullName = `${patientData.patient.firstName} ${patientData.patient.lastName}`.toLowerCase();
      const matchesSearch = fullName.includes(searchQuery.toLowerCase());

      // Filter by therapist if selected
      const matchesTherapist = !selectedTherapist || 
        patientData.sessions.some(session => session.therapist.id === selectedTherapist);

      // Filter by date range if set
      let matchesDateRange = true;
      if (dateRange.from || dateRange.to) {
        matchesDateRange = patientData.sessions.some(session => {
          const sessionDate = new Date(session.scheduledDate);
          const afterFrom = !dateRange.from || sessionDate >= new Date(dateRange.from);
          const beforeTo = !dateRange.to || sessionDate <= new Date(dateRange.to);
          return afterFrom && beforeTo;
        });
      }

      return matchesSearch && matchesTherapist && matchesDateRange;
    });
  }, [data, searchQuery, selectedTherapist, dateRange]);

  // Check if any filters are active
  const hasActiveFilters = searchQuery || selectedTherapist || dateRange.from || dateRange.to;

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTherapist('');
    setDateRange({});
  };

  if (isLoading) return <LoadingPage />;

  if (error) {
    return <ErrorMessage message="Failed to load payment information" />;
  }

  if (!data || data.patients.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Payments & Invoices</h1>
            <p className="text-muted-foreground">Create invoices for uninvoiced sessions</p>
          </div>
        </div>
        <EmptyState
          icon={FileText}
          title="No uninvoiced sessions"
          description="All sessions have been invoiced"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payments & Invoices</h1>
          <p className="text-muted-foreground">
            {data.summary.totalPatients} patients with {data.summary.totalSessions} uninvoiced sessions
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Total Cost</div>
          <div className="text-2xl font-bold">৳{data.summary.totalCost.toFixed(2)}</div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search patients by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant={showFilters ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
            {hasActiveFilters && !showFilters && (
              <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary-foreground text-xs text-primary">
                {[selectedTherapist, dateRange.from, dateRange.to].filter(Boolean).length}
              </span>
            )}
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="mr-2 h-4 w-4" />
              Clear
            </Button>
          )}
        </div>

        {showFilters && (
          <InvoiceFilters
            therapists={uniqueTherapists}
            selectedTherapist={selectedTherapist}
            onTherapistChange={setSelectedTherapist}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
        )}
      </div>

      {/* Patients List */}
      <div className="space-y-4">
        {filteredPatients.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No matching patients"
            description="Try adjusting your search or filters"
          />
        ) : (
          filteredPatients.map((patientData) => (
            <UninvoicedPatientCard
              key={patientData.patient.id}
              patientData={patientData}
            />
          ))
        )}
      </div>
    </div>
  );
}
