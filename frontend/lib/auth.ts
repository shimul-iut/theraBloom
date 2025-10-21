import api from './api';

export interface LoginCredentials {
  phoneNumber: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    phoneNumber: string;
    firstName: string;
    lastName: string;
    role: 'WORKSPACE_ADMIN' | 'OPERATOR' | 'THERAPIST' | 'ACCOUNTANT';
    tenantId: string;
  };
  accessToken: string;
  refreshToken: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post('/auth/login', credentials);
    const data = response.data.data;

    // Handle nested tokens object from backend
    const accessToken = data.tokens?.accessToken || data.accessToken;
    const refreshToken = data.tokens?.refreshToken || data.refreshToken;

    // Store tokens
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));

    return {
      user: data.user,
      accessToken,
      refreshToken,
    };
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Ignore errors on logout
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  },

  async refreshToken(refreshToken: string): Promise<string> {
    const response = await api.post('/auth/refresh', { refreshToken });
    const { accessToken } = response.data.data;
    localStorage.setItem('accessToken', accessToken);
    return accessToken;
  },

  getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getAccessToken() {
    return localStorage.getItem('accessToken');
  },

  isAuthenticated() {
    return !!this.getAccessToken();
  },
};
