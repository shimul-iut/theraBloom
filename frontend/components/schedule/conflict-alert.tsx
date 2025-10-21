'use client';

import { AlertCircle, Calendar, Clock, User } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ConflictAlertProps {
  type: 'therapist' | 'patient';
  message: string;
  onViewSchedule?: () => void;
}

export function ConflictAlert({ type, message, onViewSchedule }: ConflictAlertProps) {
  const icon = type === 'therapist' ? User : Calendar;
  const title = type === 'therapist' ? 'Therapist Conflict' : 'Patient Conflict';
  const description =
    type === 'therapist'
      ? 'The selected therapist already has a session scheduled at this time.'
      : 'The selected patient already has a session scheduled at this time.';

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        {title}
      </AlertTitle>
      <AlertDescription className="mt-2 space-y-2">
        <p>{description}</p>
        <p className="text-sm font-medium">{message}</p>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-3 w-3" />
          <span>Please select a different time slot or check the schedule for availability.</span>
        </div>
        {onViewSchedule && (
          <button
            onClick={onViewSchedule}
            className="text-sm underline hover:no-underline mt-2"
          >
            View {type === 'therapist' ? 'Therapist' : 'Patient'} Schedule
          </button>
        )}
      </AlertDescription>
    </Alert>
  );
}
