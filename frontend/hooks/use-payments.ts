import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import { formatErrorForDisplay } from '@/lib/error-handler';

export interface PaymentSession {
  id: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  paymentStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
  cost: number;
  therapyType: {
    id: string;
    name: string;
  };
  therapist: {
    id: string;
    name: string;
  };
}

export interface UnpaidPatient {
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    creditBalance: number;
    totalOutstandingDues: number;
  };
  sessions: PaymentSession[];
  totalDue: number;
  creditBalance: number;
  netPayable: number;
}

export interface UnpaidSessionsResponse {
  patients: UnpaidPatient[];
  summary: {
    totalPatients: number;
    totalSessions: number;
    totalDue: number;
    totalNetPayable: number;
  };
}

export interface ConfirmPaymentInput {
  patientId: string;
  sessionIds: string[];
  paidAmount: number;
  paymentMethod: 'CASH' | 'CARD' | 'PREPAID_CREDIT';
  useCreditAmount?: number;
  notes?: string;
}

export interface ConfirmPaymentResponse {
  success: boolean;
  payment: {
    totalDue: number;
    paidAmount: number;
    creditUsed: number;
    totalPayment: number;
    outstandingDues: number;
    paymentStatus: 'PAID' | 'PARTIALLY_PAID';
  };
  sessions: Array<{
    id: string;
    scheduledDate: string;
    startTime: string;
    endTime: string;
    status: string;
    paymentStatus: string;
    cost: number;
    TherapyType: {
      id: string;
      name: string;
    };
    User: {
      id: string;
      firstName: string;
      lastName: string;
    };
  }>;
  patient: {
    id: string;
    name: string;
    creditBalance: number;
    totalOutstandingDues: number;
  };
}

export interface SessionPayment {
  id: string;
  amount: number;
  paymentMethod: 'CASH' | 'CARD' | 'PREPAID_CREDIT';
  paymentDate: string;
  notes?: string;
  session: {
    id: string;
    scheduledDate: string;
    startTime: string;
    endTime: string;
    cost: number;
    status: string;
    paymentStatus: string;
    therapyType: {
      id: string;
      name: string;
    };
    therapist: {
      id: string;
      name: string;
    };
  };
}

export interface GeneralPayment {
  id: string;
  amount: number;
  method: 'CASH' | 'CARD' | 'PREPAID_CREDIT';
  date: string;
  description?: string;
  confirmedBy: {
    id: string;
    name: string;
  };
}

export interface PaymentHistoryResponse {
  patient: {
    id: string;
    name: string;
    creditBalance: number;
    totalOutstandingDues: number;
  };
  sessionPayments: SessionPayment[];
  generalPayments: GeneralPayment[];
  summary: {
    totalPaidForSessions: number;
    totalCreditPurchases: number;
    totalGeneralPayments: number;
    currentCreditBalance: number;
    currentOutstandingDues: number;
  };
  pagination: {
    sessionPayments: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    generalPayments: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

/**
 * Hook to fetch all unpaid sessions grouped by patient
 * Requirements: 2.1, 3.1
 */
export function useUnpaidSessions() {
  return useQuery({
    queryKey: ['payments', 'unpaid'],
    queryFn: async () => {
      const response = await api.get('/payments/unpaid');
      return response.data.data as UnpaidSessionsResponse;
    },
  });
}

/**
 * Hook to confirm payment for sessions
 * Handles full and partial payments with credit application
 * Requirements: 3.1
 */
export function useConfirmPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ConfirmPaymentInput) => {
      const response = await api.post('/payments/confirm', data);
      return response.data.data as ConfirmPaymentResponse;
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['payments', 'unpaid'] });
      queryClient.invalidateQueries({ queryKey: ['payments', 'history'] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patients', data.patient.id] });

      // Show success message
      const isFullyPaid = data.payment.paymentStatus === 'PAID';
      if (isFullyPaid) {
        toast.success('Payment confirmed successfully', {
          description: `Paid: $${data.payment.paidAmount.toFixed(2)}${
            data.payment.creditUsed > 0
              ? ` + $${data.payment.creditUsed.toFixed(2)} credit`
              : ''
          }`,
        });
      } else {
        toast.warning('Partial payment recorded', {
          description: `Outstanding dues: $${data.payment.outstandingDues.toFixed(2)}`,
          duration: 5000,
        });
      }
    },
    onError: (error: any) => {
      console.error('Confirm payment error:', error);
      const message = formatErrorForDisplay(error);
      toast.error(message, {
        duration: 4000,
      });
    },
  });
}

/**
 * Hook to fetch payment history for a patient
 * Requirements: 8.1
 */
export function usePaymentHistory(patientId: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: ['payments', 'history', patientId, page, limit],
    queryFn: async () => {
      const response = await api.get(`/payments/history/${patientId}?page=${page}&limit=${limit}`);
      return response.data.data as PaymentHistoryResponse;
    },
    enabled: !!patientId,
  });
}
