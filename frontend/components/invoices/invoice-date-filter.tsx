'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

interface InvoiceDateFilterProps {
  startDate?: string;
  endDate?: string;
  onFilterChange: (startDate?: string, endDate?: string) => void;
}

export function InvoiceDateFilter({ startDate, endDate, onFilterChange }: InvoiceDateFilterProps) {
  const [localStartDate, setLocalStartDate] = useState(startDate || '');
  const [localEndDate, setLocalEndDate] = useState(endDate || '');

  const handleApply = () => {
    onFilterChange(
      localStartDate || undefined,
      localEndDate || undefined
    );
  };

  const handleClear = () => {
    setLocalStartDate('');
    setLocalEndDate('');
    onFilterChange(undefined, undefined);
  };

  const hasActiveFilters = startDate || endDate;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Filter by Date Range</Label>
            </div>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-8 text-xs"
              >
                <X className="mr-1 h-3 w-3" />
                Clear
              </Button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start-date" className="text-xs text-muted-foreground">
                Start Date
              </Label>
              <Input
                id="start-date"
                type="date"
                value={localStartDate}
                onChange={(e) => setLocalStartDate(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date" className="text-xs text-muted-foreground">
                End Date
              </Label>
              <Input
                id="end-date"
                type="date"
                value={localEndDate}
                onChange={(e) => setLocalEndDate(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleApply} size="sm">
              Apply Filter
            </Button>
          </div>

          {hasActiveFilters && (
            <div className="text-xs text-muted-foreground">
              Showing invoices from{' '}
              {startDate ? format(new Date(startDate), 'MMM dd, yyyy') : 'beginning'} to{' '}
              {endDate ? format(new Date(endDate), 'MMM dd, yyyy') : 'now'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
