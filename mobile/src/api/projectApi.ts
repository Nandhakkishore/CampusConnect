import apiClient from './client';
import { Project, ProjectComment } from '../types';

export interface GetProjectsParams {
  search?: string;
  branch?: string;
  techStack?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export const projectApi = {
  getProjects: async (params?: GetProjectsParams): Promise<{
    success: boolean;
    data: {
      projects: Project[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    };
  }> => {
    const res = await apiClient.get('/projects', { params });
    return res.data;
  },

  getProjectById: async (id: string): Promise<{ success: boolean; data: Project }> => {
    const res = await apiClient.get(`/projects/${id}`);
    return res.data;
  },

  createProject: async (data: {
    title: string;
    summary: string;
    description: string;
    branch?: string;
    techStack: string[];
    status?: string;
    repositoryUrl?: string;
    demoUrl?: string;
  }): Promise<{ success: boolean; data: Project }> => {
    const res = await apiClient.post('/projects', data);
    return res.data;
  },

  updateProject: async (id: string, data: Partial<Project>): Promise<{ success: boolean; data: Project }> => {
    const res = await apiClient.put(`/projects/${id}`, data);
    return res.data;
  },

  deleteProject: async (id: string) => {
    const res = await apiClient.delete(`/projects/${id}`);
    return res.data;
  },

  toggleUpvote: async (id: string): Promise<{ success: boolean; data: { hasUpvoted: boolean } }> => {
    const res = await apiClient.post(`/projects/${id}/upvote`);
    return res.data;
  },

  getComments: async (id: string): Promise<{ success: boolean; data: ProjectComment[] }> => {
    const res = await apiClient.get(`/projects/${id}/comments`);
    return res.data;
  },

  addComment: async (id: string, content: string): Promise<{ success: boolean; data: ProjectComment }> => {
    const res = await apiClient.post(`/projects/${id}/comments`, { content });
    return res.data;
  },
};
