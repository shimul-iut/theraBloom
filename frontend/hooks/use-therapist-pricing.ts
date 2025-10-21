import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export interface TherapistPricing {
  id: string;
  therapistId: string;
  therapyTypeId: string;
  sessionDuration: number;
  sessionCost: number;
  active: boolean;
  therapyType: {
    id: string;
    name: string;
  };
}

export function useTherapistPricing(therapistId: string) {
  return useQuery({
    queryKey: ['therapist-pricing', therapistId],
    queryFn: async () => {
      const response = await api.get(`/therapist-pricing?therapistId=${therapistId}`);
      const data = response.data.data;
      return (data.pricing || data) as TherapistPricing[];
    },
    enabled: !!therapistId,
  });
}

export function useTherapistPricingForType(therapistId: string, therapyTypeId: string) {
  return useQuery({
    queryKey: ['therapist-pricing', therapistId, therapyTypeId],
    queryFn: async () => {
      const response = await api.get(`/therapist-pricing?therapistId=${therapistId}&therapyTypeId=${therapyTypeId}`);
      const data = response.data.data;
      // Return first pricing or null
      const pricing = data.pricing || data;
      return Array.isArray(pricing) ? pricing[0] : pricing;
    },
    enabled: !!therapistId && !!therapyTypeId,
  });
}
