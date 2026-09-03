import apiClient from './client';
import { Profile } from '../types';

export const profileApi = {
  getMyProfile: async (): Promise<{ success: boolean; data: Profile }> => {
    const res = await apiClient.get('/profiles/me');
    return res.data;
  },

  getProfileByUserId: async (userId: string): Promise<{ success: boolean; data: Profile }> => {
    const res = await apiClient.get(`/profiles/user/${userId}`);
    return res.data;
  },

  updateProfile: async (data: Partial<Profile>): Promise<{ success: boolean; data: Profile }> => {
    const res = await apiClient.put('/profiles/me', data);
    return res.data;
  },
};
