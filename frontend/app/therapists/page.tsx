'use client';

import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { useTherapists, Therapist } from '@/hooks/use-therapists';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { LoadingPage } from '@/components/shared/loading-spinner';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorMessage } from '@/components/shared/error-boundary';
import { Users, Plus, Eye, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function TherapistsPage() {
  const router = useRouter();
  const { data: therapists, isLoading, error } = useTherapists();

  const columns: ColumnDef<Therapist>[] = [
    {
      accessorKey: 'firstName',
      header: 'First Name',
    },
    {
      accessorKey: 'lastName',
      header: 'Last Name',
    },
    {
      accessorKey: 'phoneNumber',
      header: 'Phone Number',
    },
    {
      accessorKey: 'specialization',
      header: 'Specialization',
      cell: ({ row }) => row.original.specialization?.name || '-',
    },
    {
      id: 'pricing',
      header: 'Pricing & Duration',
      cell: ({ row }) => {
        const { sessionCost, sessionDuration } = row.original;
        if (!sessionCost || !sessionDuration) {
          return <span className="text-muted-foreground">-</span>;
        }
        return (
          <div className="text-sm">
            <span className="font-medium"> ৳{Number(sessionCost).toFixed(2)}</span>
            <span className="text-muted-foreground"> / {sessionDuration}min</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'active',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.active ? 'default' : 'destructive'}>
          {row.original.active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/therapists/${row.original.id}`)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/schedule?therapist=${row.original.id}`)}
          >
            <Calendar className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) return <LoadingPage />;
  
  if (error) {
    return <ErrorMessage message="Failed to load therapists" />;
  }

  if (!therapists || therapists.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Therapists</h1>
            <p className="text-muted-foreground">Manage your therapy center therapists</p>
          </div>
        </div>
        <EmptyState
          icon={Users}
          title="No therapists yet"
          description="Get started by adding your first therapist"
          action={{
            label: 'Add Therapist',
            onClick: () => router.push('/therapists/new'),
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Therapists</h1>
          <p className="text-muted-foreground">
            Manage your therapy center therapists ({therapists.length} total)
          </p>
        </div>
        <Button onClick={() => router.push('/therapists/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Add Therapist
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={therapists}
        searchKey="firstName"
        searchPlaceholder="Search therapists by name..."
      />
    </div>
  );
}
