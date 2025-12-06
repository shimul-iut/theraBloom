'use client';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

interface Therapist {
  id: string;
  name: string;
}

interface InvoiceFiltersProps {
  therapists: Therapist[];
  selectedTherapist: string;
  onTherapistChange: (therapistId: string) => void;
  dateRange: { from?: string; to?: string };
  onDateRangeChange: (range: { from?: string; to?: string }) => void;
}

export function InvoiceFilters({
  therapists,
  selectedTherapist,
  onTherapistChange,
  dateRange,
  onDateRangeChange,
}: InvoiceFiltersProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="therapist">Therapist</Label>
            <Select
              value={selectedTherapist || 'ALL'}
              onValueChange={(val) =>
                onTherapistChange(val === 'ALL' ? '' : val)
              }
            >
              <SelectTrigger id="therapist">
                <SelectValue placeholder="All therapists" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All therapists</SelectItem>
                {therapists.map((therapist) => (
                  <SelectItem key={therapist.id} value={therapist.id}>
                    {therapist.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
