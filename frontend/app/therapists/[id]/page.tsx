'use client';

import { useRouter } from 'next/navigation';
import { useTherapist } from '@/hooks/use-therapists';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingPage } from '@/components/shared/loading-spinner';
import { ErrorMessage } from '@/components/shared/error-boundary';
import { ArrowLeft, Edit, Phone, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function TherapistDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: therapist, isLoading, error } = useTherapist(params.id);

  if (isLoading) return <LoadingPage />;

  if (error || !therapist) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <ErrorMessage message="Failed to load therapist details" />
      </div>
    );
  }

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
              {therapist.firstName} {therapist.lastName}
            </h1>
            <p className="text-muted-foreground">Therapist Details</p>
          </div>
        </div>
        <Button onClick={() => router.push(`/therapists/${params.id}/edit`)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Basic therapist details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Full Name</p>
                <p className="font-medium">
                  {therapist.firstName} {therapist.lastName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Phone Number</p>
                <p className="font-medium">{therapist.phoneNumber}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-5 w-5" />
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={therapist.active ? 'default' : 'destructive'}>
                  {therapist.active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Specialization & Pricing</CardTitle>
            <CardDescription>Therapy type and session details</CardDescription>
          </CardHeader>
          <CardContent>
            {therapist.specialization ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{therapist.specialization.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {therapist.sessionDuration} minutes per session
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${Number(therapist.sessionCost).toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">per session</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No specialization configured for this therapist
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common actions for this therapist</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => router.push(`/schedule?therapist=${params.id}`)}
          >
            View Schedule
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/schedule/new?therapist=${params.id}`)}
          >
            Create Session
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
