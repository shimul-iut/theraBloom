import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

export interface CreateTherapistInput {
  phoneNumber: string;
  firstName: string;
  lastName: string;
  specializationId: string;
  sessionDuration: number;
  sessionCost: number;
  password: string;
}

export interface UpdateTherapistInput {
  firstName?: string;
  lastName?: string;
  specializationId?: string;
  sessionDuration?: number;
  sessionCost?: number;
  active?: boolean;
}

export function useCreateTherapist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTherapistInput) => {
      const response = await api.post('/users', {
        ...data,
        role: 'THERAPIST',
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['therapists'] });
      toast.success('Therapist created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to create therapist');
    },
  });
}

export function useUpdateTherapist(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateTherapistInput) => {
      const response = await api.put(`/users/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['therapists'] });
      queryClient.invalidateQueries({ queryKey: ['therapists', id] });
      toast.success('Therapist updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to update therapist');
    },
  });
}
