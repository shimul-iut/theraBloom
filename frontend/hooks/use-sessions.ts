import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

export interface Session {
  id: string;
  patientId: string;
  therapistId: string;
  therapyTypeId: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  cost: number;
  paidWithCredit?: boolean;
  notes?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    guardianPhone: string;
  };
  therapist: {
    id: string;
    firstName: string;
    lastName: string;
  };
  therapyType: {
    id: string;
    name: string;
  };
}

export interface CreateSessionInput {
  patientId: string;
  therapistId: string;
  therapyTypeId: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  cost: number;
  notes?: string;
}

export interface UpdateSessionInput extends Partial<CreateSessionInput> {
  status?: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
}

export function useSessions(filters?: {
  startDate?: string;
  endDate?: string;
  therapistId?: string;
  patientId?: string;
  status?: string;
}) {
  const queryParams = new URLSearchParams();
  if (filters?.startDate) queryParams.append('startDate', filters.startDate);
  if (filters?.endDate) queryParams.append('endDate', filters.endDate);
  if (filters?.therapistId) queryParams.append('therapistId', filters.therapistId);
  if (filters?.patientId) queryParams.append('patientId', filters.patientId);
  if (filters?.status) queryParams.append('status', filters.status);

  return useQuery({
    queryKey: ['sessions', filters],
    queryFn: async () => {
      const response = await api.get(`/sessions?${queryParams.toString()}`);
      // Backend returns { sessions: [], pagination: {} }
      const data = response.data.data;
      return {
        sessions: (data.sessions || data) as Session[],
        pagination: data.pagination,
      };
    },
  });
}

export function useCalendarSessions(filters?: {
  startDate?: string;
  endDate?: string;
  therapistId?: string;
}) {
  const queryParams = new URLSearchParams();
  if (filters?.startDate) queryParams.append('startDate', filters.startDate);
  if (filters?.endDate) queryParams.append('endDate', filters.endDate);
  if (filters?.therapistId) queryParams.append('therapistId', filters.therapistId);

  return useQuery({
    queryKey: ['sessions', 'calendar', filters],
    queryFn: async () => {
      const response = await api.get(`/sessions/calendar?${queryParams.toString()}`);
      return response.data.data as Session[];
    },
  });
}

export function useSession(id: string) {
  return useQuery({
    queryKey: ['sessions', id],
    queryFn: async () => {
      const response = await api.get(`/sessions/${id}`);
      return response.data.data as Session;
    },
    enabled: !!id,
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSessionInput) => {
      const response = await api.post('/sessions', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast.success('Session created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to create session');
    },
  });
}

export function useUpdateSession(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateSessionInput) => {
      const response = await api.put(`/sessions/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['sessions', id] });
      toast.success('Session updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to update session');
    },
  });
}

export function useCancelSession(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data?: { cancelReason?: string }) => {
      const response = await api.post(`/sessions/${id}/cancel`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['sessions', id] });
      toast.success('Session cancelled successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to cancel session');
    },
  });
}
