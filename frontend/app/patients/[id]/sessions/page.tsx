'use client';

import { useRouter } from 'next/navigation';
import { usePatient } from '@/hooks/use-patients';
import { useSessions } from '@/hooks/use-sessions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingPage } from '@/components/shared/loading-spinner';
import { ErrorMessage } from '@/components/shared/error-boundary';
import { ArrowLeft, Calendar, Clock, User, FileText } from 'lucide-react';
import { format } from 'date-fns';

export default function PatientSessionsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: patient, isLoading: loadingPatient, error: patientError } = usePatient(params.id);
  const { data: sessionsData, isLoading: loadingSessions } = useSessions({
    patientId: params.id,
  });

  if (loadingPatient || loadingSessions) {
    return <LoadingPage />;
  }

  if (patientError || !patient) {
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

  const sessions = sessionsData?.sessions || [];
  const now = new Date();
  
  // Separate sessions by status and date
  const upcomingSessions = sessions.filter((s) => {
    const sessionDate = new Date(s.scheduledDate);
    return s.status === 'SCHEDULED' && sessionDate >= now;
  });
  
  const completedSessions = sessions.filter((s) => s.status === 'COMPLETED');
  const cancelledSessions = sessions.filter((s) => s.status === 'CANCELLED');
  const noShowSessions = sessions.filter((s) => s.status === 'NO_SHOW');

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      SCHEDULED: 'default',
      COMPLETED: 'secondary',
      CANCELLED: 'destructive',
      NO_SHOW: 'outline',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  const totalSpent = completedSessions.reduce((sum, session) => sum + Number(session.cost), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {patient.firstName} {patient.lastName} - Sessions
            </h1>
            <p className="text-muted-foreground">Session history and upcoming appointments</p>
          </div>
        </div>
        <Button onClick={() => router.push(`/schedule/new?patient=${params.id}`)}>
          Book New Session
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Upcoming
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{upcomingSessions.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedSessions.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳{totalSpent.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Sessions */}
      {upcomingSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Sessions
            </CardTitle>
            <CardDescription>Scheduled appointments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent cursor-pointer"
                  onClick={() => router.push(`/schedule?session=${session.id}`)}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{session.TherapyType.name}</p>
                      {getStatusBadge(session.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(session.scheduledDate), 'MMM dd, yyyy')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {session.startTime} - {session.endTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {session.User.firstName} {session.User.lastName}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">৳{Number(session.cost).toFixed(2)}</p>
                    {session.paidWithCredit && (
                      <p className="text-xs text-muted-foreground">Paid with credit</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Session History
          </CardTitle>
          <CardDescription>Past and cancelled sessions</CardDescription>
        </CardHeader>
        <CardContent>
          {completedSessions.length === 0 && cancelledSessions.length === 0 && noShowSessions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No session history yet</p>
          ) : (
            <div className="space-y-4">
              {[...completedSessions, ...cancelledSessions, ...noShowSessions]
                .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime())
                .map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent cursor-pointer"
                    onClick={() => router.push(`/schedule?session=${session.id}`)}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{session.TherapyType.name}</p>
                        {getStatusBadge(session.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(session.scheduledDate), 'MMM dd, yyyy')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {session.startTime} - {session.endTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {session.User.firstName} {session.User.lastName}
                        </span>
                      </div>
                      {session.notes && (
                        <p className="text-sm text-muted-foreground mt-1">{session.notes}</p>
                      )}
                      {session.cancelReason && (
                        <p className="text-sm text-red-600 mt-1">Reason: {session.cancelReason}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">৳{Number(session.cost).toFixed(2)}</p>
                      {session.paidWithCredit && (
                        <p className="text-xs text-muted-foreground">Paid with credit</p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
