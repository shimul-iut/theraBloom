'use client';

import { format } from 'date-fns';
import { Session } from '@/hooks/use-sessions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User, Phone, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SessionListProps {
  sessions: Session[];
  selectedDate: Date;
  onEditSession?: (session: Session) => void;
  onCancelSession?: (session: Session) => void;
  onAddSession?: () => void;
}

export function SessionList({ 
  sessions, 
  selectedDate, 
  onEditSession, 
  onCancelSession, 
  onAddSession 
}: SessionListProps) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'default';
      case 'COMPLETED':
        return 'secondary';
      case 'CANCELLED':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const sortedSessions = sessions.sort((a, b) => 
    a.startTime.localeCompare(b.startTime)
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            Sessions for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </CardTitle>
          {onAddSession && (
            <Button onClick={onAddSession} size="sm">
              Add Session
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {sortedSessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No sessions scheduled for this date</p>
            {onAddSession && (
              <Button variant="outline" onClick={onAddSession} className="mt-4">
                Schedule a Session
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {sortedSessions.map(session => {
              const cost = Number(session.cost) || 0;
              
              return (
                <div
                  key={session.id}
                  className={cn(
                    'border rounded-lg p-4 hover:shadow-md transition-shadow',
                    session.status === 'CANCELLED' && 'opacity-60'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={getStatusVariant(session.status)}>
                          {session.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {session.startTime} - {session.endTime}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {session.patient.firstName} {session.patient.lastName}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {session.patient.guardianPhone}
                          </span>
                        </div>
                        
                        <div className="text-sm">
                          <span className="font-medium">Therapist:</span> {session.therapist.firstName} {session.therapist.lastName}
                        </div>
                        
                        <div className="text-sm">
                          <span className="font-medium">Type:</span> {session.therapyType.name}
                        </div>
                        
                        <div className="text-sm">
                          <span className="font-medium">Cost:</span> ${cost.toFixed(2)}
                        </div>
                        
                        {session.notes && (
                          <div className="text-sm">
                            <span className="font-medium">Notes:</span> {session.notes}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      {onEditSession && session.status !== 'COMPLETED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEditSession(session)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {onCancelSession && session.status === 'SCHEDULED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onCancelSession(session)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
