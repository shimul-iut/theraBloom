'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { useSessions, Session } from '@/hooks/use-sessions';
import { useTherapists } from '@/hooks/use-therapists';
import { Calendar } from '@/components/schedule/calendar';
import { SessionList } from '@/components/schedule/session-list';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingPage } from '@/components/shared/loading-spinner';
import { ErrorMessage } from '@/components/shared/error-boundary';
import { CalendarDays, List, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

type ViewMode = 'calendar' | 'list';

export default function SchedulePage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [selectedTherapist, setSelectedTherapist] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Get current month range for initial load
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);

  const { data: therapists } = useTherapists();
  const { data: sessionsData, isLoading, error } = useSessions({
    startDate: monthStart.toISOString(),
    endDate: monthEnd.toISOString(),
    therapistId: selectedTherapist !== 'all' ? selectedTherapist : undefined,
    status: selectedStatus !== 'all' ? selectedStatus : undefined,
  });

  if (isLoading) return <LoadingPage />;
  if (error) return <ErrorMessage message="Failed to load schedule" />;

  // Extract sessions array from the response
  const filteredSessions = sessionsData?.sessions || [];
  const selectedDateSessions = filteredSessions.filter(session => 
    format(new Date(session.scheduledDate), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
  );

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    if (viewMode === 'calendar') {
      setViewMode('list');
    }
  };

  const handleSessionClick = (session: Session) => {
    // TODO: Open session details modal
    console.log('Session clicked:', session);
  };

  const handleAddSession = (date?: Date) => {
    const dateStr = format(date || selectedDate, 'yyyy-MM-dd');
    router.push(`/schedule/new?date=${dateStr}`);
  };

  const handleEditSession = (session: Session) => {
    // TODO: Open edit session modal
    console.log('Edit session:', session);
  };

  const handleCancelSession = (session: Session) => {
    // TODO: Implement cancel session
    console.log('Cancel session:', session);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Schedule</h1>
          <p className="text-muted-foreground">
            Manage therapy sessions and appointments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('calendar')}
          >
            <CalendarDays className="mr-2 h-4 w-4" />
            Calendar
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="mr-2 h-4 w-4" />
            List
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Therapist:</label>
              <Select value={selectedTherapist} onValueChange={setSelectedTherapist}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select therapist" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Therapists</SelectItem>
                  {therapists?.map(therapist => (
                    <SelectItem key={therapist.id} value={therapist.id}>
                      {therapist.firstName} {therapist.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Status:</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={() => handleAddSession()} className="ml-auto">
              Add Session
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className={cn(
          viewMode === 'calendar' ? 'lg:col-span-3' : 'lg:col-span-2'
        )}>
          {viewMode === 'calendar' ? (
            <Calendar
              sessions={filteredSessions}
              onDateClick={handleDateClick}
              onSessionClick={handleSessionClick}
              onAddSession={handleAddSession}
              selectedDate={selectedDate}
            />
          ) : (
            <SessionList
              sessions={selectedDateSessions}
              selectedDate={selectedDate}
              onEditSession={handleEditSession}
              onCancelSession={handleCancelSession}
              onAddSession={() => handleAddSession(selectedDate)}
            />
          )}
        </div>

        {viewMode === 'list' && (
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-2xl font-bold">{filteredSessions.length}</div>
                  <div className="text-sm text-muted-foreground">Total Sessions</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {filteredSessions.filter(s => s.status === 'COMPLETED').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {filteredSessions.filter(s => s.status === 'SCHEDULED').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Scheduled</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {filteredSessions.filter(s => s.status === 'CANCELLED').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Cancelled</div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
