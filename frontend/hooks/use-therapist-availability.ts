import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export interface TherapistAvailability {
  id: string;
  therapistId: string;
  therapyTypeId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  therapyType: {
    id: string;
    name: string;
  };
}

export interface CreateAvailabilityInput {
  therapyTypeId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
}

export interface UpdateAvailabilityInput {
  dayOfWeek?: DayOfWeek;
  startTime?: string;
  endTime?: string;
  active?: boolean;
}

export function useTherapistAvailability(
  therapistId: string,
  filters?: {
    dayOfWeek?: DayOfWeek;
    therapyTypeId?: string;
  }
) {
  const queryParams = new URLSearchParams();
  if (filters?.dayOfWeek) queryParams.append('dayOfWeek', filters.dayOfWeek);
  if (filters?.therapyTypeId) queryParams.append('therapyTypeId', filters.therapyTypeId);

  return useQuery({
    queryKey: ['therapist-availability', therapistId, filters],
    queryFn: async () => {
      const response = await api.get(
        `/therapists/${therapistId}/availability?${queryParams.toString()}`
      );
      return response.data.data as TherapistAvailability[];
    },
    enabled: !!therapistId,
  });
}

export function useAvailabilitySlot(therapistId: string, slotId: string) {
  return useQuery({
    queryKey: ['therapist-availability', therapistId, slotId],
    queryFn: async () => {
      const response = await api.get(`/therapists/${therapistId}/availability/${slotId}`);
      return response.data.data as TherapistAvailability;
    },
    enabled: !!(therapistId && slotId),
  });
}

export function useCreateAvailability(therapistId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAvailabilityInput) => {
      const response = await api.post(`/therapists/${therapistId}/availability`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['therapist-availability', therapistId] });
      toast.success('Availability slot created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Failed to create availability slot';
      toast.error(message);
    },
  });
}

export function useUpdateAvailability(therapistId: string, slotId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateAvailabilityInput) => {
      const response = await api.put(`/therapists/${therapistId}/availability/${slotId}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['therapist-availability', therapistId] });
      toast.success('Availability slot updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Failed to update availability slot';
      toast.error(message);
    },
  });
}

export function useDeleteAvailability(therapistId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slotId: string) => {
      const response = await api.delete(`/therapists/${therapistId}/availability/${slotId}`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['therapist-availability', therapistId] });
      toast.success('Availability slot deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Failed to delete availability slot';
      toast.error(message);
    },
  });
}
