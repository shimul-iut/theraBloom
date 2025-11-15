import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import { formatErrorForDisplay } from '@/lib/error-handler';

// ============================================
// TYPES
// ============================================

export interface UninvoicedSession {
  id: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  cost: number;
  status: string;
  therapyType: {
    id: string;
    name: string;
  };
  therapist: {
    id: string;
    name: string;
  };
}

export interface UninvoicedPatient {
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    creditBalance: number;
    totalOutstandingDues: number;
  };
  sessions: UninvoicedSession[];
  totalCost: number;
  netPayable: number;
}

export interface UninvoicedSessionsResponse {
  patients: UninvoicedPatient[];
  summary: {
    totalPatients: number;
    totalSessions: number;
    totalCost: number;
  };
}

export interface CreateInvoiceInput {
  patientId: string;
  sessionIds: string[];
  paidAmount: number;
  paymentMethod: 'CASH' | 'CREDIT_CARD' | 'BANK_TRANSFER' | 'PREPAID_CREDIT';
  creditUsed: number;
  notes?: string;
}

export interface InvoiceLineItem {
  sessionId: string;
  description: string;
  amount: number;
}

export interface CreateInvoiceResponse {
  invoice: {
    id: string;
    invoiceNumber: string;
    invoiceDate: string;
    totalAmount: number;
    paidAmount: number;
    creditUsed: number;
    outstandingAmount: number;
    paymentMethod: string;
    lineItems: InvoiceLineItem[];
  };
  patient: {
    id: string;
    name: string;
    creditBalance: number;
    totalOutstandingDues: number;
  };
}

export interface InvoiceSessionDetail {
  scheduledDate: string;
  startTime: string;
  endTime: string;
  therapyType: string;
  therapist: string;
}

export interface InvoiceLineItemDetail {
  id: string;
  sessionId: string;
  description: string;
  amount: number;
  session: InvoiceSessionDetail;
}

export interface InvoiceDetails {
  invoice: {
    id: string;
    invoiceNumber: string;
    invoiceDate: string;
    totalAmount: number;
    paidAmount: number;
    creditUsed: number;
    outstandingAmount: number;
    paymentMethod: string;
    notes?: string;
  };
  lineItems: InvoiceLineItemDetail[];
  patient: {
    id: string;
    name: string;
    guardianName: string;
    guardianPhone: string;
    creditBalance: number;
    totalOutstandingDues: number;
  };
  confirmedBy: {
    id: string;
    name: string;
  };
}

export interface PatientInvoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  totalAmount: number;
  paidAmount: number;
  creditUsed: number;
  outstandingAmount: number;
  paymentMethod: string;
  lineItemCount: number;
}

export interface PatientInvoicesResponse {
  invoices: PatientInvoice[];
  summary: {
    totalInvoiced: number;
    totalPaid: number;
    totalCreditUsed: number;
    totalOutstanding: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PatientBalance {
  patient: {
    id: string;
    name: string;
    creditBalance: number;
    totalOutstandingDues: number;
  };
  uninvoiced: {
    count: number;
    total: number;
    netPayable: number;
  };
}

// ============================================
// HOOKS
// ============================================

/**
 * Hook to fetch all uninvoiced sessions grouped by patient
 * Supports filtering by date range, patient, and therapist
 * Requirements: 1.1, 1.2, 1.3, 2.1
 */
export function useUninvoicedSessions(filters?: {
  startDate?: string;
  endDate?: string;
  patientId?: string;
  therapistId?: string;
}) {
  const queryParams = new URLSearchParams();
  if (filters?.startDate) queryParams.append('startDate', filters.startDate);
  if (filters?.endDate) queryParams.append('endDate', filters.endDate);
  if (filters?.patientId) queryParams.append('patientId', filters.patientId);
  if (filters?.therapistId) queryParams.append('therapistId', filters.therapistId);

  const queryString = queryParams.toString();

  return useQuery({
    queryKey: ['invoices', 'uninvoiced', filters],
    queryFn: async () => {
      const url = `/invoices/unpaid-sessions${queryString ? `?${queryString}` : ''}`;
      const response = await api.get(url);
      return response.data.data as UninvoicedSessionsResponse;
    },
  });
}

/**
 * Hook to create an invoice for selected sessions
 * Handles payment, credit application, and balance updates
 * Requirements: 3.1
 */
export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateInvoiceInput) => {
      const response = await api.post('/invoices/create', data);
      return response.data.data as CreateInvoiceResponse;
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['invoices', 'uninvoiced'] });
      queryClient.invalidateQueries({ queryKey: ['invoices', 'patient'] });
      queryClient.invalidateQueries({ queryKey: ['invoices', 'balance'] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patients', data.patient.id] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });

      // Show success message
      const hasOutstanding = data.invoice.outstandingAmount > 0;
      if (hasOutstanding) {
        toast.success('Invoice created with outstanding balance', {
          description: `Invoice ${data.invoice.invoiceNumber} - Outstanding: ${data.invoice.outstandingAmount.toFixed(2)}`,
          duration: 5000,
        });
      } else {
        toast.success('Invoice created and fully paid', {
          description: `Invoice ${data.invoice.invoiceNumber} - Total: ${data.invoice.totalAmount.toFixed(2)}`,
        });
      }
    },
    onError: (error: any) => {
      console.error('Create invoice error:', error);
      const message = formatErrorForDisplay(error);
      toast.error(message, {
        duration: 4000,
      });
    },
  });
}

/**
 * Hook to fetch a single invoice by ID
 * Includes line items, patient info, and confirmedBy user
 * Requirements: 7.1
 */
export function useInvoice(invoiceId: string) {
  return useQuery({
    queryKey: ['invoices', invoiceId],
    queryFn: async () => {
      const response = await api.get(`/invoices/${invoiceId}`);
      return response.data.data as InvoiceDetails;
    },
    enabled: !!invoiceId,
  });
}

/**
 * Hook to fetch all invoices for a patient
 * Supports pagination and date range filtering
 * Requirements: 8.1
 */
export function usePatientInvoices(
  patientId: string,
  options?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }
) {
  const page = options?.page || 1;
  const limit = options?.limit || 20;

  const queryParams = new URLSearchParams();
  queryParams.append('page', page.toString());
  queryParams.append('limit', limit.toString());
  if (options?.startDate) queryParams.append('startDate', options.startDate);
  if (options?.endDate) queryParams.append('endDate', options.endDate);

  return useQuery({
    queryKey: ['invoices', 'patient', patientId, options],
    queryFn: async () => {
      const response = await api.get(
        `/invoices/patient/${patientId}?${queryParams.toString()}`
      );
      return response.data.data as PatientInvoicesResponse;
    },
    enabled: !!patientId,
  });
}

/**
 * Hook to fetch patient financial balance with uninvoiced sessions
 * Includes credit balance, outstanding dues, and uninvoiced summary
 * Requirements: 9.1
 */
export function usePatientBalance(patientId: string) {
  return useQuery({
    queryKey: ['invoices', 'balance', patientId],
    queryFn: async () => {
      const response = await api.get(`/invoices/patient/${patientId}/balance`);
      return response.data.data as PatientBalance;
    },
    enabled: !!patientId,
  });
}
