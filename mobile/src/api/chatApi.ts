import apiClient from './client';
import { ChatConversation, Message } from '../types';

export const chatApi = {
  getConversations: async (): Promise<{ success: boolean; data: ChatConversation[] }> => {
    const res = await apiClient.get('/chat/conversations');
    return res.data;
  },

  getMessages: async (conversationId: string): Promise<{ success: boolean; data: Message[] }> => {
    const res = await apiClient.get(`/chat/conversations/${conversationId}/messages`);
    return res.data;
  },

  startDirectChat: async (targetUserId: string): Promise<{ success: boolean; data: ChatConversation }> => {
    const res = await apiClient.post('/chat/conversations/direct', { targetUserId });
    return res.data;
  },
};
