'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Clock, Trash2, AlertTriangle } from 'lucide-react';
import {
  useTherapistUnavailability,
  useDeleteUnavailability,
  UnavailabilityReason,
} from '@/hooks/use-therapist-unavailability';
import { UnavailabilityForm } from './unavailability-form';

interface UnavailabilityListProps {
  therapistId: string;
  therapistName: string;
  sessionDuration: number;
}

const REASON_LABELS: Record<UnavailabilityReason, string> = {
  SICK_LEAVE: 'Sick Leave',
  VACATION: 'Vacation',
  PERSONAL_LEAVE: 'Personal Leave',
  EMERGENCY: 'Emergency',
  TRAINING: 'Training',
  OTHER: 'Other',
};

const REASON_COLORS: Record<UnavailabilityReason, string> = {
  SICK_LEAVE: 'bg-red-100 text-red-800',
  VACATION: 'bg-blue-100 text-blue-800',
  PERSONAL_LEAVE: 'bg-yellow-100 text-yellow-800',
  EMERGENCY: 'bg-orange-100 text-orange-800',
  TRAINING: 'bg-purple-100 text-purple-800',
  OTHER: 'bg-gray-100 text-gray-800',
};

export function UnavailabilityList({
  therapistId,
  therapistName,
  sessionDuration,
}: UnavailabilityListProps) {
  const [formOpen, setFormOpen] = useState(false);

  const { data: unavailabilityPeriods = [], isLoading } = useTherapistUnavailability(therapistId);
  const deleteMutation = useDeleteUnavailability(therapistId);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this unavailability period?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleAdd = () => {
    setFormOpen(true);
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (format(start, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd')) {
      return format(start, 'MMM d, yyyy');
    }
    return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
  };

  const formatTimeRange = (startTime?: string, endTime?: string) => {
    if (!startTime || !endTime) {
      return 'All day';
    }
    return `${startTime} - ${endTime}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Unavailability Periods</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Unavailability Periods
              </CardTitle>
              <CardDescription>
                Manage times when {therapistName} is not available
              </CardDescription>
            </div>
            <Button onClick={handleAdd}>
              Mark Unavailable
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {unavailabilityPeriods.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No unavailability periods set. Click "Mark Unavailable" to add periods when this therapist is not available.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {unavailabilityPeriods.map((period) => (
                <Card key={period.id} className="border-l-4 border-l-red-500">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {formatDateRange(period.startDate, period.endDate)}
                          </span>
                          {period.startTime && period.endTime && (
                            <>
                              <Clock className="h-4 w-4 text-muted-foreground ml-2" />
                              <span className="text-sm text-muted-foreground">
                                {formatTimeRange(period.startTime, period.endTime)}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={REASON_COLORS[period.reason]}>
                            {REASON_LABELS[period.reason]}
                          </Badge>
                          {!period.startTime && !period.endTime && (
                            <Badge variant="outline">All Day</Badge>
                          )}
                        </div>
                        {period.notes && (
                          <p className="text-sm text-muted-foreground">
                            {period.notes}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Created {format(new Date(period.createdAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(period.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <UnavailabilityForm
        therapistId={therapistId}
        therapistName={therapistName}
        sessionDuration={sessionDuration}
        open={formOpen}
        onOpenChange={setFormOpen}
      />
    </>
  );
}
