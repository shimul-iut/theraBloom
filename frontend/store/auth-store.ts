import { create } from 'zustand';
import { authService } from '@/lib/auth';

interface User {
  id: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  role: 'WORKSPACE_ADMIN' | 'OPERATOR' | 'THERAPIST' | 'ACCOUNTANT';
  tenantId: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  login: (phoneNumber: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    }),

  login: async (phoneNumber, password) => {
    try {
      const data = await authService.login({ phoneNumber, password });
      set({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      throw error;
    }
  },

  logout: async () => {
    await authService.logout();
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  initialize: () => {
    const user = authService.getUser();
    const isAuthenticated = authService.isAuthenticated();
    set({
      user,
      isAuthenticated,
      isLoading: false,
    });
  },
}));
