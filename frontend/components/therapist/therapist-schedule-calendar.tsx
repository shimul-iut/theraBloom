'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTherapistAvailability, DayOfWeek } from '@/hooks/use-therapist-availability';
import { useSessions } from '@/hooks/use-sessions';
import { format, startOfWeek, endOfWeek, addDays, parse, addMinutes } from 'date-fns';
import { Calendar, Clock, Plus, Edit2, Trash2, User } from 'lucide-react';
import { LoadingPage } from '@/components/shared/loading-spinner';
import { cn } from '@/lib/utils';

interface TherapistScheduleCalendarProps {
  therapistId: string;
  therapistName: string;
  sessionDuration: number; // in minutes
  onCreateSession?: (date: string, startTime: string, endTime: string) => void;
  onEditSession?: (sessionId: string) => void;
  onDeleteSession?: (sessionId: string) => void;
}

const DAYS: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const DAY_LABELS = {
  MONDAY: 'Mon',
  TUESDAY: 'Tue',
  WEDNESDAY: 'Wed',
  THURSDAY: 'Thu',
  FRIDAY: 'Fri',
  SATURDAY: 'Sat',
  SUNDAY: 'Sun',
};

interface TimeSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  session?: {
    id: string;
    patientName: string;
    status: string;
  };
}

export function TherapistScheduleCalendar({
  therapistId,
  therapistName,
  sessionDuration,
  onCreateSession,
  onEditSession,
  onDeleteSession,
}: TherapistScheduleCalendarProps) {
  const [selectedWeek, setSelectedWeek] = useState(new Date());

  const { data: availability, isLoading: loadingAvailability } = useTherapistAvailability(therapistId);

  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 });

  const { data: sessionsData, isLoading: loadingSessions } = useSessions({
    startDate: weekStart.toISOString(),
    endDate: weekEnd.toISOString(),
    therapistId,
  });

  const sessions = sessionsData?.sessions || [];

  if (loadingAvailability || loadingSessions) {
    return <LoadingPage />;
  }

  // Generate time slots for each day based on availability and session duration
  const generateTimeSlots = (day: DayOfWeek, dayDate: Date): TimeSlot[] => {
    const dayAvailability = (availability || []).filter(
      (slot) => slot.dayOfWeek === day && slot.active
    );

    if (dayAvailability.length === 0) {
      return [];
    }

    const slots: TimeSlot[] = [];
    const dayStr = format(dayDate, 'yyyy-MM-dd');

    // Get sessions for this specific day (exclude cancelled sessions)
    const daySessions = sessions.filter(
      (session) => 
        format(new Date(session.scheduledDate), 'yyyy-MM-dd') === dayStr &&
        session.status !== 'CANCELLED'
    );

    // For each availability window, generate time slots
    dayAvailability.forEach((avail) => {
      const startTime = parse(avail.startTime, 'HH:mm', new Date());
      const endTime = parse(avail.endTime, 'HH:mm', new Date());

      let currentTime = startTime;

      while (currentTime < endTime) {
        const slotEnd = addMinutes(currentTime, sessionDuration);

        // Don't add slot if it would exceed availability end time
        if (slotEnd > endTime) {
          break;
        }

        const slotStartStr = format(currentTime, 'HH:mm');
        const slotEndStr = format(slotEnd, 'HH:mm');

        // Check if this slot has a booked session
        const bookedSession = daySessions.find(
          (session) => session.startTime === slotStartStr
        );

        slots.push({
          startTime: slotStartStr,
          endTime: slotEndStr,
          isAvailable: !bookedSession,
          session: bookedSession
            ? {
              id: bookedSession.id,
              patientName: `${bookedSession.Patient.firstName} ${bookedSession.Patient.lastName}`,
              status: bookedSession.status,
            }
            : undefined,
        });

        currentTime = slotEnd;
      }
    });

    return slots;
  };

  const goToPreviousWeek = () => {
    setSelectedWeek((prev) => addDays(prev, -7));
  };

  const goToNextWeek = () => {
    setSelectedWeek((prev) => addDays(prev, 7));
  };

  const goToToday = () => {
    setSelectedWeek(new Date());
  };

  const handleSlotClick = (dayDate: Date, slot: TimeSlot) => {
    const dateStr = format(dayDate, 'yyyy-MM-dd');

    if (slot.isAvailable && onCreateSession) {
      onCreateSession(dateStr, slot.startTime, slot.endTime);
    } else if (!slot.isAvailable && slot.session && onEditSession) {
      onEditSession(slot.session.id);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (onDeleteSession) {
      onDeleteSession(sessionId);
    }
  };

  return (
    <div className="space-y-4">
      {/* Week Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {therapistName}'s Schedule
              </CardTitle>
              <CardDescription>
                {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')} • {sessionDuration} min sessions
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
                Previous
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={goToNextWeek}>
                Next
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Weekly Grid */}
      <div className="grid gap-4 md:grid-cols-7">
        {DAYS.map((day, index) => {
          const dayDate = addDays(weekStart, index);
          const isToday = format(dayDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
          const timeSlots = generateTimeSlots(day, dayDate);

          return (
            <Card key={day} className={cn(isToday && 'border-primary border-2')}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-medium">{DAY_LABELS[day]}</CardTitle>
                    <CardDescription className="text-xs">{format(dayDate, 'MMM d')}</CardDescription>
                  </div>
                  {isToday && (
                    <Badge variant="default" className="text-xs">
                      Today
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {timeSlots.length > 0 ? (
                  timeSlots.map((slot, slotIndex) => (
                    <div
                      key={slotIndex}
                      onClick={() => handleSlotClick(dayDate, slot)}
                      className={cn(
                        'rounded-md border p-2 text-xs cursor-pointer transition-all hover:shadow-md',
                        slot.isAvailable
                          ? 'border-green-200 bg-green-50 hover:bg-green-100'
                          : 'border-blue-200 bg-blue-50 hover:bg-blue-100'
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1">
                          <Clock className={cn('h-3 w-3', slot.isAvailable ? 'text-green-600' : 'text-blue-600')} />
                          <span className={cn('font-medium', slot.isAvailable ? 'text-green-900' : 'text-blue-900')}>
                            {slot.startTime}
                          </span>
                        </div>
                        {!slot.isAvailable && slot.session && onDeleteSession && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 text-red-600 hover:text-red-700 hover:bg-red-100"
                            onClick={(e) => handleDeleteClick(e, slot.session!.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      {slot.isAvailable ? (
                        <div className="flex items-center gap-1 text-green-700">
                          <Plus className="h-3 w-3" />
                          <span className="text-xs">Available</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-blue-700">
                          <User className="h-3 w-3" />
                          <span className="text-xs font-medium">{slot.session?.patientName}</span>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">No availability</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Legend */}
      <Card>
        <CardContent className="flex items-center gap-6 pt-6">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded border border-green-200 bg-green-50" />
            <span className="text-sm">Available - Click to book</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded border border-blue-200 bg-blue-50" />
            <span className="text-sm">Booked - Click to view/edit</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
