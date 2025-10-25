'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTherapistAvailability, DayOfWeek } from '@/hooks/use-therapist-availability';
import { useCalendarSessions } from '@/hooks/use-sessions';
import { format, startOfWeek, endOfWeek, addDays } from 'date-fns';
import { Calendar, Clock, Plus, Edit2, Trash2 } from 'lucide-react';
import { LoadingPage } from '@/components/shared/loading-spinner';

interface WeeklyAvailabilityCalendarProps {
  therapistId: string;
  onAddSlot?: () => void;
  onEditSlot?: (slotId: string) => void;
  onDeleteSlot?: (slotId: string) => void;
  editable?: boolean;
}

const DAYS: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const DAY_LABELS = {
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
  SATURDAY: 'Saturday',
  SUNDAY: 'Sunday',
};

export function WeeklyAvailabilityCalendar({
  therapistId,
  onAddSlot,
  onEditSlot,
  onDeleteSlot,
  editable = false,
}: WeeklyAvailabilityCalendarProps) {
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  
  const { data: availability, isLoading: loadingAvailability } = useTherapistAvailability(therapistId);
  
  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 });
  
  const { data: sessions, isLoading: loadingSessions } = useCalendarSessions({
    startDate: weekStart.toISOString(),
    endDate: weekEnd.toISOString(),
    therapistId,
  });

  if (loadingAvailability || loadingSessions) {
    return <LoadingPage />;
  }

  // Group availability by day
  const availabilityByDay = DAYS.reduce((acc, day) => {
    acc[day] = (availability || []).filter(slot => slot.dayOfWeek === day && slot.active);
    return acc;
  }, {} as Record<DayOfWeek, typeof availability>);

  // Group sessions by day
  const sessionsByDay = DAYS.reduce((acc, day, index) => {
    const dayDate = addDays(weekStart, index);
    const dayStr = format(dayDate, 'yyyy-MM-dd');
    acc[day] = (sessions || []).filter(
      session => format(new Date(session.scheduledDate), 'yyyy-MM-dd') === dayStr
    );
    return acc;
  }, {} as Record<DayOfWeek, typeof sessions>);

  const goToPreviousWeek = () => {
    setSelectedWeek(prev => addDays(prev, -7));
  };

  const goToNextWeek = () => {
    setSelectedWeek(prev => addDays(prev, 7));
  };

  const goToToday = () => {
    setSelectedWeek(new Date());
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
                Weekly Schedule
              </CardTitle>
              <CardDescription>
                {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
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
              {editable && onAddSlot && (
                <Button size="sm" onClick={onAddSlot}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Slot
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Weekly Grid */}
      <div className="grid gap-4 md:grid-cols-7">
        {DAYS.map((day, index) => {
          const dayDate = addDays(weekStart, index);
          const isToday = format(dayDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
          const dayAvailability = availabilityByDay[day] || [];
          const daySessions = sessionsByDay[day] || [];

          return (
            <Card key={day} className={isToday ? 'border-primary' : ''}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  {DAY_LABELS[day]}
                  {isToday && (
                    <Badge variant="default" className="ml-2 text-xs">
                      Today
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-xs">
                  {format(dayDate, 'MMM d')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* Availability Slots */}
                {dayAvailability.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">Available</p>
                    {dayAvailability.map(slot => (
                      <div
                        key={slot.id}
                        className="rounded-md border border-green-200 bg-green-50 p-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-green-600" />
                            <span className="font-medium text-green-900">
                              {slot.startTime} - {slot.endTime}
                            </span>
                          </div>
                          {editable && (
                            <div className="flex gap-1">
                              {onEditSlot && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => onEditSlot(slot.id)}
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                              )}
                              {onDeleteSlot && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                  onClick={() => onDeleteSlot(slot.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-green-700">{slot.therapyType.name}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No availability</p>
                )}

                {/* Booked Sessions */}
                {daySessions.length > 0 && (
                  <div className="space-y-2 pt-2 border-t">
                    <p className="text-xs font-semibold text-muted-foreground">Booked</p>
                    {daySessions.map(session => (
                      <div
                        key={session.id}
                        className="rounded-md border border-blue-200 bg-blue-50 p-2 text-xs"
                      >
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-blue-600" />
                          <span className="font-medium text-blue-900">
                            {session.startTime} - {session.endTime}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-blue-700">
                          {session.patient.firstName} {session.patient.lastName}
                        </p>
                      </div>
                    ))}
                  </div>
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
            <span className="text-sm">Available Slots</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded border border-blue-200 bg-blue-50" />
            <span className="text-sm">Booked Sessions</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
