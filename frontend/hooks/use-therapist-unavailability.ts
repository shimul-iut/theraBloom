import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

export type UnavailabilityReason =
  | 'SICK_LEAVE'
  | 'VACATION'
  | 'PERSONAL_LEAVE'
  | 'EMERGENCY'
  | 'TRAINING'
  | 'OTHER';

export interface TherapistUnavailability {
  id: string;
  therapistId: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  reason: UnavailabilityReason;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AffectedSession {
  id: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface AvailableRescheduleSlot {
  date: string;
  startTime: string;
  endTime: string;
  dayOfWeek: string;
}

export interface CreateUnavailabilityInput {
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  reason: UnavailabilityReason;
  notes?: string;
  rescheduleSessionIds?: string[];
}

export interface UpdateUnavailabilityInput {
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  reason?: UnavailabilityReason;
  notes?: string;
}

export function useTherapistUnavailability(
  therapistId: string,
  filters?: {
    startDate?: string;
    endDate?: string;
  }
) {
  const queryParams = new URLSearchParams();
  if (filters?.startDate) queryParams.append('startDate', filters.startDate);
  if (filters?.endDate) queryParams.append('endDate', filters.endDate);

  return useQuery({
    queryKey: ['therapist-unavailability', therapistId, filters],
    queryFn: async () => {
      const response = await api.get(
        `/therapists/${therapistId}/unavailability?${queryParams.toString()}`
      );
      return response.data.data as TherapistUnavailability[];
    },
    enabled: !!therapistId,
  });
}

export function useAffectedSessions(
  therapistId: string,
  startDate?: string,
  endDate?: string,
  startTime?: string,
  endTime?: string
) {
  const queryParams = new URLSearchParams();
  if (startDate) queryParams.append('startDate', startDate);
  if (endDate) queryParams.append('endDate', endDate);
  if (startTime) queryParams.append('startTime', startTime);
  if (endTime) queryParams.append('endTime', endTime);

  return useQuery({
    queryKey: ['affected-sessions', therapistId, startDate, endDate, startTime, endTime],
    queryFn: async () => {
      const response = await api.get(
        `/therapists/${therapistId}/unavailability/affected-sessions?${queryParams.toString()}`
      );
      return response.data.data as AffectedSession[];
    },
    enabled: !!(therapistId && startDate && endDate),
  });
}

export function useAvailableRescheduleSlots(
  therapistId: string,
  sessionDuration?: number,
  startDate?: string,
  daysAhead: number = 30
) {
  const queryParams = new URLSearchParams();
  if (startDate) queryParams.append('startDate', startDate);
  if (sessionDuration) queryParams.append('sessionDuration', sessionDuration.toString());
  queryParams.append('daysAhead', daysAhead.toString());

  return useQuery({
    queryKey: ['reschedule-slots', therapistId, sessionDuration, startDate, daysAhead],
    queryFn: async () => {
      const response = await api.get(
        `/therapists/${therapistId}/unavailability/reschedule-slots?${queryParams.toString()}`
      );
      return response.data.data as AvailableRescheduleSlot[];
    },
    enabled: !!(therapistId && sessionDuration && startDate),
  });
}

export function useCreateUnavailability(therapistId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateUnavailabilityInput) => {
      const response = await api.post(`/therapists/${therapistId}/unavailability`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['therapist-unavailability', therapistId] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast.success('Unavailability period created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Failed to create unavailability period';
      toast.error(message);
    },
  });
}

export function useUpdateUnavailability(therapistId: string, unavailabilityId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateUnavailabilityInput) => {
      const response = await api.put(
        `/therapists/${therapistId}/unavailability/${unavailabilityId}`,
        data
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['therapist-unavailability', therapistId] });
      toast.success('Unavailability period updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Failed to update unavailability period';
      toast.error(message);
    },
  });
}

export function useDeleteUnavailability(therapistId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (unavailabilityId: string) => {
      const response = await api.delete(
        `/therapists/${therapistId}/unavailability/${unavailabilityId}`
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['therapist-unavailability', therapistId] });
      toast.success('Unavailability period deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Failed to delete unavailability period';
      toast.error(message);
    },
  });
}
