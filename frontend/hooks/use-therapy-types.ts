import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export interface TherapyType {
  id: string;
  name: string;
  description?: string;
  duration: number;
  cost: number;
  active: boolean;
}

export function useTherapyTypes() {
  return useQuery({
    queryKey: ['therapy-types'],
    queryFn: async () => {
      const response = await api.get('/therapy-types');
      return response.data.data as TherapyType[];
    },
  });
}

export function useTherapyType(id: string) {
  return useQuery({
    queryKey: ['therapy-types', id],
    queryFn: async () => {
      const response = await api.get(`/therapy-types/${id}`);
      return response.data.data as TherapyType;
    },
    enabled: !!id,
  });
}
