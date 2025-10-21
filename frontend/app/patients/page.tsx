'use client';

import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { usePatients, Patient } from '@/hooks/use-patients';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { LoadingPage } from '@/components/shared/loading-spinner';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorMessage } from '@/components/shared/error-boundary';
import { Users, Plus, Eye, Edit } from 'lucide-react';
import { format } from 'date-fns';

export default function PatientsPage() {
  const router = useRouter();
  const { data: patients, isLoading, error } = usePatients();

  const columns: ColumnDef<Patient>[] = [
    {
      accessorKey: 'firstName',
      header: 'First Name',
    },
    {
      accessorKey: 'lastName',
      header: 'Last Name',
    },
    {
      accessorKey: 'dateOfBirth',
      header: 'Date of Birth',
      cell: ({ row }) => format(new Date(row.original.dateOfBirth), 'MMM dd, yyyy'),
    },
    {
      accessorKey: 'guardianName',
      header: 'Guardian',
    },
    {
      accessorKey: 'guardianPhone',
      header: 'Phone',
    },
    {
      accessorKey: 'creditBalance',
      header: 'Credit Balance',
      cell: ({ row }) => {
        const balance = Number(row.original.creditBalance) || 0;
        return `$${balance.toFixed(2)}`;
      },
    },
    {
      accessorKey: 'totalOutstandingDues',
      header: 'Outstanding',
      cell: ({ row }) => {
        const amount = Number(row.original.totalOutstandingDues) || 0;
        return (
          <span className={amount > 0 ? 'text-red-600 font-medium' : ''}>
            ${amount.toFixed(2)}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/patients/${row.original.id}`)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/patients/${row.original.id}/edit`)}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) return <LoadingPage />;
  
  if (error) {
    return <ErrorMessage message="Failed to load patients" />;
  }

  if (!patients || patients.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Patients</h1>
            <p className="text-muted-foreground">Manage your therapy center patients</p>
          </div>
        </div>
        <EmptyState
          icon={Users}
          title="No patients yet"
          description="Get started by adding your first patient"
          action={{
            label: 'Add Patient',
            onClick: () => router.push('/patients/new'),
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Patients</h1>
          <p className="text-muted-foreground">
            Manage your therapy center patients ({patients.length} total)
          </p>
        </div>
        <Button onClick={() => router.push('/patients/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Add Patient
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={patients}
        searchKey="firstName"
        searchPlaceholder="Search patients by name..."
      />
    </div>
  );
}
