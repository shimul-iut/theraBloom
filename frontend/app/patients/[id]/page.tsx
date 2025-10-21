'use client';

import { useRouter } from 'next/navigation';
import { usePatient } from '@/hooks/use-patients';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingPage } from '@/components/shared/loading-spinner';
import { ErrorMessage } from '@/components/shared/error-boundary';
import { ArrowLeft, Edit, Calendar, DollarSign, FileText } from 'lucide-react';
import { format } from 'date-fns';

export default function PatientDetailPage({ params }: { params: { id: string } }) {
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

  const age = Math.floor(
    (new Date().getTime() - new Date(patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );

  const creditBalance = Number(patient.creditBalance) || 0;
  const outstandingDues = Number(patient.totalOutstandingDues) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {patient.firstName} {patient.lastName}
            </h1>
            <p className="text-muted-foreground">Patient Details</p>
          </div>
        </div>
        <Button onClick={() => router.push(`/patients/${patient.id}/edit`)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Patient
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Basic patient details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Full Name</p>
              <p className="text-lg">
                {patient.firstName} {patient.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
              <p className="text-lg">
                {format(new Date(patient.dateOfBirth), 'MMMM dd, yyyy')} ({age} years old)
              </p>
            </div>
            {patient.address && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Address</p>
                <p className="text-lg">{patient.address}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Guardian Information</CardTitle>
            <CardDescription>Primary contact details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Guardian Name</p>
              <p className="text-lg">{patient.guardianName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Phone Number</p>
              <p className="text-lg">{patient.guardianPhone}</p>
            </div>
            {patient.guardianEmail && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-lg">{patient.guardianEmail}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financial Summary</CardTitle>
            <CardDescription>Credit balance and outstanding dues</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Credit Balance</p>
              <p className="text-2xl font-bold text-green-600">
                ${creditBalance.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Outstanding Dues</p>
              <p className={`text-2xl font-bold ${outstandingDues > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                ${outstandingDues.toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>

        {patient.medicalNotes && (
          <Card>
            <CardHeader>
              <CardTitle>Medical Notes</CardTitle>
              <CardDescription>Important medical information</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-lg whitespace-pre-wrap">{patient.medicalNotes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push(`/patients/${patient.id}/sessions`)}
        >
          <Calendar className="mr-2 h-4 w-4" />
          View Sessions
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push(`/patients/${patient.id}/payments`)}
        >
          <DollarSign className="mr-2 h-4 w-4" />
          View Payments
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push(`/patients/${patient.id}/reports`)}
        >
          <FileText className="mr-2 h-4 w-4" />
          Progress Reports
        </Button>
      </div>
    </div>
  );
}
