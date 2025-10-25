'use client';

import { useCheckAvailability } from '@/hooks/use-sessions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AvailabilityCheckerProps {
  therapistId?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
}

export function AvailabilityChecker({
  therapistId,
  date,
  startTime,
  endTime,
}: AvailabilityCheckerProps) {
  const { data: availability, isLoading } = useCheckAvailability(
    therapistId,
    date,
    startTime,
    endTime
  );

  // Don't show anything if required fields are missing
  if (!therapistId || !date || !startTime || !endTime) {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Checking Availability...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Verifying therapist schedule...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!availability) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Availability Check
        </CardTitle>
        <CardDescription>
          {availability.therapist.name} on {new Date(date).toLocaleDateString()} at {startTime} - {endTime}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Status */}
        <Alert variant={availability.available ? 'default' : 'destructive'}>
          <div className="flex items-start gap-3">
            {availability.available ? (
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="font-semibold mb-1">
                {availability.available ? 'Available' : 'Not Available'}
              </div>
              <AlertDescription>
                {availability.available
                  ? 'This time slot is available for booking.'
                  : 'This time slot cannot be booked due to conflicts or schedule restrictions.'}
              </AlertDescription>
            </div>
          </div>
        </Alert>

        {/* Detailed Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm font-medium">Schedule Availability</span>
            <Badge variant={availability.hasAvailabilitySchedule ? 'default' : 'secondary'}>
              {availability.hasAvailabilitySchedule ? (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Within Schedule
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  Outside Schedule
                </span>
              )}
            </Badge>
          </div>

          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm font-medium">Scheduling Conflicts</span>
            <Badge variant={availability.hasConflict ? 'destructive' : 'default'}>
              {availability.hasConflict ? (
                <span className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Conflict Detected
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  No Conflicts
                </span>
              )}
            </Badge>
          </div>
        </div>

        {/* Existing Sessions */}
        {availability.existingSessions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Existing Sessions on This Date
            </h4>
            <div className="space-y-2">
              {availability.existingSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-2 bg-muted rounded-md text-sm"
                >
                  <div>
                    <div className="font-medium">{session.patientName}</div>
                    <div className="text-xs text-muted-foreground">
                      {session.startTime} - {session.endTime}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Booked
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No sessions message */}
        {availability.existingSessions.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-2">
            No other sessions scheduled for this date
          </div>
        )}

        {/* Helpful messages */}
        {!availability.hasAvailabilitySchedule && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              The therapist is not scheduled to work during this time. Please check their availability schedule or choose a different time.
            </AlertDescription>
          </Alert>
        )}

        {availability.hasConflict && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              This time slot overlaps with an existing session. Please select a different time.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
