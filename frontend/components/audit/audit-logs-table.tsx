'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { AuditLog } from '@/hooks/use-audit-logs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface AuditLogsTableProps {
  logs: AuditLog[];
}

export function AuditLogsTable({ logs }: AuditLogsTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'default'; // Green
      case 'UPDATE':
        return 'secondary'; // Blue
      case 'DELETE':
        return 'destructive'; // Red
      case 'CANCEL':
        return 'outline'; // Orange
      case 'LOGIN':
        return 'secondary'; // Purple
      case 'LOGOUT':
        return 'outline'; // Gray
      default:
        return 'outline';
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <p>No audit logs found matching your filters.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>Timestamp</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Resource</TableHead>
            <TableHead>Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <>
              <TableRow key={log.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpand(log.id)}
                  >
                    {expandedId === log.id ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </TableCell>
                <TableCell className="text-sm">
                  {format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm:ss')}
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {log.User.firstName} {log.User.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {log.User.role}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getActionBadgeVariant(log.action)}>
                    {log.action}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{log.resourceType}</div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {log.resourceId.substring(0, 8)}...
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm max-w-md">
                  {log.description ? (
                    <span className="text-foreground">{log.description}</span>
                  ) : log.changes && Object.keys(log.changes).length > 0 ? (
                    <span className="text-muted-foreground">
                      {Object.keys(log.changes).length} field(s) changed
                    </span>
                  ) : (
                    <span className="text-muted-foreground">No details recorded</span>
                  )}
                </TableCell>
              </TableRow>

              {/* Expanded Details */}
              {expandedId === log.id && (
                <TableRow>
                  <TableCell colSpan={6} className="bg-muted/30">
                    <div className="p-4 space-y-4">
                      {/* Description */}
                      {log.description && (
                        <div>
                          <h4 className="font-semibold mb-2">Description:</h4>
                          <p className="text-sm">{log.description}</p>
                        </div>
                      )}

                      {/* Changes */}
                      {log.changes && Object.keys(log.changes).length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2">Changes:</h4>
                          <div className="space-y-2">
                            {Object.entries(log.changes).map(([field, change]) => (
                              <div
                                key={field}
                                className="grid grid-cols-3 gap-4 text-sm"
                              >
                                <div className="font-medium">{field}:</div>
                                <div className="text-red-600">
                                  <span className="text-muted-foreground">Old: </span>
                                  {JSON.stringify(change.old)}
                                </div>
                                <div className="text-green-600">
                                  <span className="text-muted-foreground">New: </span>
                                  {JSON.stringify(change.new)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">IP Address: </span>
                          <span className="text-muted-foreground">
                            {log.ipAddress || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">User Agent: </span>
                          <span className="text-muted-foreground text-xs">
                            {log.userAgent || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Resource ID: </span>
                          <span className="text-muted-foreground font-mono text-xs">
                            {log.resourceId}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Log ID: </span>
                          <span className="text-muted-foreground font-mono text-xs">
                            {log.id}
                          </span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
