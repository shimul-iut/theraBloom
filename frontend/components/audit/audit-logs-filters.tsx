'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X, Calendar } from 'lucide-react';
import { format, subDays } from 'date-fns';

export interface AuditLogFilters {
  action?: string;
  resourceType?: string;
  resourceId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  preset?: string;
  page?: number;
  limit?: number;
}

interface AuditLogsFiltersProps {
  filters: AuditLogFilters;
  onFiltersChange: (filters: AuditLogFilters) => void;
  presetContext?: {
    resourceType?: string;
    resourceId?: string;
    label?: string;
  };
}

export function AuditLogsFilters({
  filters,
  onFiltersChange,
  presetContext,
}: AuditLogsFiltersProps) {
  const handlePresetClick = (preset: string) => {
    const today = new Date();
    let startDate = '';
    let endDate = format(today, 'yyyy-MM-dd');

    switch (preset) {
      case 'today':
        startDate = format(today, 'yyyy-MM-dd');
        break;
      case 'yesterday':
        const yesterday = subDays(today, 1);
        startDate = format(yesterday, 'yyyy-MM-dd');
        endDate = format(yesterday, 'yyyy-MM-dd');
        break;
      case 'last7days':
        startDate = format(subDays(today, 7), 'yyyy-MM-dd');
        break;
      case 'last30days':
        startDate = format(subDays(today, 30), 'yyyy-MM-dd');
        break;
      default:
        break;
    }

    onFiltersChange({ ...filters, preset, startDate, endDate });
  };

  const clearDateFilters = () => {
    onFiltersChange({ ...filters, preset: '', startDate: '', endDate: '' });
  };

  const clearContextFilter = () => {
    onFiltersChange({ ...filters, resourceType: '', resourceId: '' });
  };

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        {/* Preset Context Banner */}
        {presetContext && presetContext.label && (
          <Alert>
            <AlertDescription className="flex items-center justify-between">
              <span>
                Showing logs for: <strong>{presetContext.label}</strong>
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearContextFilter}
              >
                <X className="h-4 w-4" />
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Date Range Presets */}
        <div className="space-y-2">
          <Label>Date Range</Label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filters.preset === 'today' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePresetClick('today')}
            >
              Today
            </Button>
            <Button
              variant={filters.preset === 'yesterday' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePresetClick('yesterday')}
            >
              Yesterday
            </Button>
            <Button
              variant={filters.preset === 'last7days' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePresetClick('last7days')}
            >
              Last 7 Days
            </Button>
            <Button
              variant={filters.preset === 'last30days' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePresetClick('last30days')}
            >
              Last 30 Days
            </Button>
            {(filters.startDate || filters.endDate) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearDateFilters}
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>

          {/* Custom Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">From</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      startDate: e.target.value,
                      preset: 'custom',
                    })
                  }
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">To</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      endDate: e.target.value,
                      preset: 'custom',
                    })
                  }
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Filter */}
        <div className="space-y-2">
          <Label>Action</Label>
          <Select
            value={filters.action || ''}
            onValueChange={(action) =>
              onFiltersChange({ ...filters, action: action || undefined })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Actions</SelectItem>
              <SelectItem value="CREATE">Create</SelectItem>
              <SelectItem value="UPDATE">Update</SelectItem>
              <SelectItem value="DELETE">Delete</SelectItem>
              <SelectItem value="CANCEL">Cancel</SelectItem>
              <SelectItem value="LOGIN">Login</SelectItem>
              <SelectItem value="LOGOUT">Logout</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Resource Type Filter */}
        <div className="space-y-2">
          <Label>Resource Type</Label>
          <Select
            value={filters.resourceType || ''}
            onValueChange={(resourceType) =>
              onFiltersChange({ ...filters, resourceType: resourceType || undefined })
            }
            disabled={!!presetContext?.resourceType}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Resources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Resources</SelectItem>
              <SelectItem value="Patient">Patient</SelectItem>
              <SelectItem value="Therapist">Therapist</SelectItem>
              <SelectItem value="Session">Session</SelectItem>
              <SelectItem value="Invoice">Invoice</SelectItem>
              <SelectItem value="Payment">Payment</SelectItem>
              <SelectItem value="User">User</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            placeholder="Search logs..."
            value={filters.search || ''}
            onChange={(e) =>
              onFiltersChange({ ...filters, search: e.target.value })
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
