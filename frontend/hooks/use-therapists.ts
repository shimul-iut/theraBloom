import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export interface Therapist {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  specializationId?: string;
  specialization?: {
    id: string;
    name: string;
  };
  sessionDuration?: number;
  sessionCost?: number;
  active: boolean;
}

export function useTherapists() {
  return useQuery({
    queryKey: ['therapists'],
    queryFn: async () => {
      const response = await api.get('/users?role=THERAPIST');
      // Backend returns { users: [], pagination: {} }
      const data = response.data.data;
      return (data.users || data) as Therapist[];
    },
  });
}

export function useTherapist(id: string) {
  return useQuery({
    queryKey: ['therapists', id],
    queryFn: async () => {
      const response = await api.get(`/users/${id}`);
      return response.data.data as Therapist;
    },
    enabled: !!id,
  });
}
