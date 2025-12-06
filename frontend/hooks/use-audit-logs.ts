import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export interface AuditLog {
  id: string;
  tenantId: string;
  userId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'CANCEL' | 'LOGIN' | 'LOGOUT';
  resourceType: string;
  resourceId: string;
  description: string | null;
  changes: Record<string, { old: any; new: any }> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  User: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

export interface AuditLogFilters {
  userId?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AuditLogsResponse {
  logs: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Hook to fetch audit logs with filters and pagination
 */
export function useAuditLogs(filters: AuditLogFilters = {}) {
  const queryParams = new URLSearchParams();

  if (filters.userId) queryParams.append('userId', filters.userId);
  if (filters.action) queryParams.append('action', filters.action);
  if (filters.resourceType) queryParams.append('entityType', filters.resourceType);
  if (filters.resourceId) queryParams.append('entityId', filters.resourceId);
  if (filters.startDate) queryParams.append('startDate', filters.startDate);
  if (filters.endDate) queryParams.append('endDate', filters.endDate);
  if (filters.search) queryParams.append('search', filters.search);
  if (filters.page) queryParams.append('page', filters.page.toString());
  if (filters.limit) queryParams.append('limit', filters.limit.toString());

  return useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: async () => {
      const response = await api.get(`/audit-logs?${queryParams.toString()}`);
      return response.data.data as AuditLogsResponse;
    },
  });
}

/**
 * Hook to fetch a single audit log by ID
 */
export function useAuditLog(id: string) {
  return useQuery({
    queryKey: ['audit-logs', id],
    queryFn: async () => {
      const response = await api.get(`/audit-logs/${id}`);
      return response.data.data as AuditLog;
    },
    enabled: !!id,
  });
}

/**
 * Hook to fetch audit log count for a specific resource
 */
export function useAuditLogCount(resourceType?: string, resourceId?: string) {
  return useQuery({
    queryKey: ['audit-logs', 'count', resourceType, resourceId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (resourceType) params.append('resourceType', resourceType);
      if (resourceId) params.append('resourceId', resourceId);

      const response = await api.get(`/audit-logs/count?${params.toString()}`);
      return response.data.data as { count: number };
    },
    enabled: !!(resourceType && resourceId),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
