import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

export interface SessionPayment {
  id: string;
  sessionId: string;
  paymentId: string;
  amount: number;
  createdAt: string;
  payment: {
    id: string;
    patientId: string;
    amount: number;
    paymentMethod: string;
    paymentDate: string;
  };
}

export interface PaymentSummary {
  totalCost: number;
  totalPaid: number;
  amountDue: number;
  payments: SessionPayment[];
}

export interface RecordSessionPaymentInput {
  amount: number;
  paymentMethod: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'CREDIT';
  paymentDate?: string;
}

export function useSessionPayments(sessionId: string) {
  return useQuery({
    queryKey: ['session-payments', sessionId],
    queryFn: async () => {
      const response = await api.get(`/sessions/${sessionId}/payments`);
      return response.data.data as SessionPayment[];
    },
    enabled: !!sessionId,
  });
}

export function usePaymentSummary(sessionId: string) {
  return useQuery({
    queryKey: ['session-payment-summary', sessionId],
    queryFn: async () => {
      const response = await api.get(`/sessions/${sessionId}/payment-summary`);
      return response.data.data as PaymentSummary;
    },
    enabled: !!sessionId,
  });
}

export function useRecordSessionPayment(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RecordSessionPaymentInput) => {
      const response = await api.post(`/sessions/${sessionId}/payments`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-payments', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['session-payment-summary', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['sessions', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast.success('Payment recorded successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to record payment');
    },
  });
}
