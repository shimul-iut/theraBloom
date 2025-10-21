'use client';

import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Session } from '@/hooks/use-sessions';
import { cn } from '@/lib/utils';

interface CalendarProps {
  sessions: Session[];
  onDateClick?: (date: Date) => void;
  onSessionClick?: (session: Session) => void;
  onAddSession?: (date: Date) => void;
  selectedDate?: Date;
}

export function Calendar({ sessions, onDateClick, onSessionClick, onAddSession, selectedDate }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const previousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const getSessionsForDate = (date: Date) => {
    return sessions.filter(session => 
      isSameDay(new Date(session.scheduledDate), date)
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{format(currentMonth, 'MMMM yyyy')}</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Day Headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
          
          {/* Calendar Days */}
          {days.map(day => {
            const daySessions = getSessionsForDate(day);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());
            
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'min-h-[120px] border border-gray-200 p-1 cursor-pointer hover:bg-gray-50 group',
                  !isCurrentMonth && 'bg-gray-50 text-gray-400',
                  isSelected && 'ring-2 ring-primary',
                  isToday && 'bg-blue-50'
                )}
                onClick={() => onDateClick?.(day)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={cn(
                    'text-sm font-medium',
                    isToday && 'bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs'
                  )}>
                    {format(day, 'd')}
                  </span>
                  {onAddSession && isCurrentMonth && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddSession(day);
                      }}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                
                {/* Sessions for this day */}
                <div className="space-y-1">
                  {daySessions.slice(0, 3).map(session => (
                    <div
                      key={session.id}
                      className={cn(
                        'text-xs p-1 rounded border cursor-pointer hover:opacity-80',
                        getStatusColor(session.status)
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSessionClick?.(session);
                      }}
                    >
                      <div className="font-medium truncate">
                        {session.startTime} - {session.patient.firstName} {session.patient.lastName}
                      </div>
                      <div className="truncate opacity-75">
                        {session.therapyType.name}
                      </div>
                    </div>
                  ))}
                  {daySessions.length > 3 && (
                    <div className="text-xs text-muted-foreground p-1">
                      +{daySessions.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
