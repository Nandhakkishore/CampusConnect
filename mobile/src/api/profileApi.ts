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

  uploadAvatar: async (imageBase64: string): Promise<{ success: boolean; data: { avatarUrl: string } }> => {
    const res = await apiClient.post('/upload/avatar', { imageBase64 });
    return res.data;
  },

  savePushToken: async (pushToken: string): Promise<{ success: boolean }> => {
    const res = await apiClient.post('/upload/push-token', { pushToken });
    return res.data;
  },
};
