import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

export interface Patient {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    guardianName: string;
    guardianPhone: string;
    guardianEmail?: string;
    address?: string;
    medicalNotes?: string;
    creditBalance: number;
    totalOutstandingDues: number;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreatePatientInput {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    guardianName: string;
    guardianPhone: string;
    guardianEmail?: string;
    address?: string;
    medicalNotes?: string;
}

export interface UpdatePatientInput extends Partial<CreatePatientInput> { }

export function usePatients() {
    return useQuery({
        queryKey: ['patients'],
        queryFn: async () => {
            const response = await api.get('/patients');
            // Backend returns { patients: [], pagination: {} }
            const data = response.data.data;
            return (data.patients || data) as Patient[];
        },
    });
}

export function usePatient(id: string) {
    return useQuery({
        queryKey: ['patients', id],
        queryFn: async () => {
            const response = await api.get(`/patients/${id}`);
            return response.data.data as Patient;
        },
        enabled: !!id,
    });
}

export function useCreatePatient() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreatePatientInput) => {
            const response = await api.post('/patients', data);
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patients'] });
            toast.success('Patient created successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Failed to create patient');
        },
    });
}

export function useUpdatePatient(id: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: UpdatePatientInput) => {
            const response = await api.put(`/patients/${id}`, data);
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patients'] });
            queryClient.invalidateQueries({ queryKey: ['patients', id] });
            toast.success('Patient updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Failed to update patient');
        },
    });
}
