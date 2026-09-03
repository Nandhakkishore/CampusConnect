import apiClient from './client';
import { User } from '../types';

export interface AuthResponse {
  success: boolean;
  message?: string;
  data: {
    user: User;
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  };
}

export const authApi = {
  login: async (credentials: { email: string; password: string }): Promise<AuthResponse> => {
    const res = await apiClient.post('/auth/login', credentials);
    return res.data;
  },

  googleLogin: async (data: { email: string; fullName?: string; avatarUrl?: string }): Promise<AuthResponse> => {
    const res = await apiClient.post('/auth/google', data);
    return res.data;
  },

  register: async (data: {
    email: string;
    password: string;
    fullName: string;
    branch?: string;
    gradYear?: number;
  }): Promise<AuthResponse> => {
    const res = await apiClient.post('/auth/register', data);
    return res.data;
  },

  getMe: async (): Promise<{ success: boolean; data: User }> => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },

  logout: async (refreshToken?: string) => {
    const res = await apiClient.post('/auth/logout', { refreshToken });
    return res.data;
  },
};
