'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

interface Therapist {
  id: string;
  name: string;
}

interface PaymentFiltersProps {
  therapists: Therapist[];
  selectedTherapist: string;
  onTherapistChange: (therapistId: string) => void;
  dateRange: { from?: string; to?: string };
  onDateRangeChange: (range: { from?: string; to?: string }) => void;
}

export function PaymentFilters({
  therapists,
  selectedTherapist,
  onTherapistChange,
  dateRange,
  onDateRangeChange,
}: PaymentFiltersProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Therapist Filter */}
          <div className="space-y-2">
            <Label htmlFor="therapist-filter">Therapist</Label>
            <Select
              value={selectedTherapist}
              onValueChange={(value) => onTherapistChange(value === 'all' ? '' : value)}
            >
              <SelectTrigger id="therapist-filter">
                <SelectValue placeholder="All therapists" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All therapists</SelectItem>
                {therapists.map((therapist) => (
                  <SelectItem key={therapist.id} value={therapist.id}>
                    {therapist.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date From Filter */}
          <div className="space-y-2">
            <Label htmlFor="date-from">From Date</Label>
            <Input
              id="date-from"
              type="date"
              value={dateRange.from || ''}
              onChange={(e) =>
                onDateRangeChange({ ...dateRange, from: e.target.value })
              }
            />
          </div>

          {/* Date To Filter */}
          <div className="space-y-2">
            <Label htmlFor="date-to">To Date</Label>
            <Input
              id="date-to"
              type="date"
              value={dateRange.to || ''}
              onChange={(e) =>
                onDateRangeChange({ ...dateRange, to: e.target.value })
              }
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
