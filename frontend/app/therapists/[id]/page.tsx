'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTherapist } from '@/hooks/use-therapists';
import { useDeleteAvailability } from '@/hooks/use-therapist-availability';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingPage } from '@/components/shared/loading-spinner';
import { ErrorMessage } from '@/components/shared/error-boundary';
import { ArrowLeft, Edit, Phone, User, Calendar as CalendarIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TherapistScheduleCalendar } from '@/components/therapist/therapist-schedule-calendar';
import { AvailabilitySlotForm } from '@/components/therapist/availability-slot-form';
import { SessionQuickForm } from '@/components/therapist/session-quick-form';
import { UnavailabilityList } from '@/components/therapist/unavailability-list';

export default function TherapistDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: therapist, isLoading, error } = useTherapist(params.id);
  
  // Availability management
  const [slotFormOpen, setSlotFormOpen] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<string | undefined>();
  const deleteAvailabilityMutation = useDeleteAvailability(params.id);
  
  // Session management
  const [sessionFormOpen, setSessionFormOpen] = useState(false);
  const [sessionDate, setSessionDate] = useState<string>();
  const [sessionStartTime, setSessionStartTime] = useState<string>();
  const [sessionEndTime, setSessionEndTime] = useState<string>();
  const [editingSessionId, setEditingSessionId] = useState<string | undefined>();

  // Availability slot handlers
  const handleAddSlot = () => {
    setEditingSlotId(undefined);
    setSlotFormOpen(true);
  };

  const handleEditSlot = (slotId: string) => {
    setEditingSlotId(slotId);
    setSlotFormOpen(true);
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (confirm('Are you sure you want to delete this availability slot?')) {
      await deleteAvailabilityMutation.mutateAsync(slotId);
    }
  };

  // Session handlers
  const handleCreateSession = (date: string, startTime: string, endTime: string) => {
    setSessionDate(date);
    setSessionStartTime(startTime);
    setSessionEndTime(endTime);
    setEditingSessionId(undefined);
    setSessionFormOpen(true);
  };

  const handleEditSession = (sessionId: string) => {
    setEditingSessionId(sessionId);
    setSessionDate(undefined);
    setSessionStartTime(undefined);
    setSessionEndTime(undefined);
    setSessionFormOpen(true);
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (confirm('Are you sure you want to cancel this session?')) {
      try {
        await api.post(`/sessions/${sessionId}/cancel`, { cancelReason: 'Cancelled by admin' });
        toast.success('Session cancelled successfully');
        // Refresh the page data
        window.location.reload();
      } catch (error: any) {
        const message = error.response?.data?.error?.message || 'Failed to cancel session';
        toast.error(message);
      }
    }
  };

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
                    <p className="font-semibold">৳{Number(therapist.sessionCost).toFixed(2)}</p>
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

      {/* Availability Management Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Availability Setup
              </CardTitle>
              <CardDescription>Manage weekly availability slots</CardDescription>
            </div>
            <Button onClick={handleAddSlot}>Add Availability Slot</Button>
          </div>
        </CardHeader>
      </Card>

      {/* Unavailability Management */}
      {therapist.sessionDuration ? (
        <UnavailabilityList
          therapistId={params.id}
          therapistName={`${therapist.firstName} ${therapist.lastName}`}
          sessionDuration={therapist.sessionDuration}
        />
      ) : null}

      {/* Therapist Schedule Calendar */}
      {therapist.sessionDuration && therapist.specializationId ? (
        <TherapistScheduleCalendar
          therapistId={params.id}
          therapistName={`${therapist.firstName} ${therapist.lastName}`}
          sessionDuration={therapist.sessionDuration}
          onCreateSession={handleCreateSession}
          onEditSession={handleEditSession}
          onDeleteSession={handleDeleteSession}
        />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center">
              Please set up therapist specialization and session duration to view the schedule calendar.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Availability Slot Form Dialog */}
      <AvailabilitySlotForm
        therapistId={params.id}
        therapistSpecializationId={therapist.specializationId || undefined}
        slotId={editingSlotId}
        open={slotFormOpen}
        onOpenChange={setSlotFormOpen}
      />

      {/* Session Quick Form Dialog */}
      {therapist.specializationId && therapist.sessionCost && (
        <SessionQuickForm
          therapistId={params.id}
          therapistName={`${therapist.firstName} ${therapist.lastName}`}
          therapyTypeId={therapist.specializationId}
          sessionCost={Number(therapist.sessionCost)}
          date={sessionDate}
          startTime={sessionStartTime}
          endTime={sessionEndTime}
          sessionId={editingSessionId}
          open={sessionFormOpen}
          onOpenChange={setSessionFormOpen}
        />
      )}
    </div>
  );
}
