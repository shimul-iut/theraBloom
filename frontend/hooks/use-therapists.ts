import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export interface Therapist {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  specializationId?: string;
  TherapyType?: {
    id: string;
    name: string;
  };
  // Alias for backward compatibility
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
      const therapists = (data.users || data) as Therapist[];
      // Map TherapyType to specialization for backward compatibility
      return therapists.map(t => {
        if (t.TherapyType && !t.specialization) {
          t.specialization = t.TherapyType;
        }
        return t;
      });
    },
  });
}

export function useTherapist(id: string) {
  return useQuery({
    queryKey: ['therapists', id],
    queryFn: async () => {
      const response = await api.get(`/users/${id}`);
      const data = response.data.data;
      // Map TherapyType to specialization for backward compatibility
      if (data.TherapyType && !data.specialization) {
        data.specialization = data.TherapyType;
      }
      return data as Therapist;
    },
    enabled: !!id,
  });
}
