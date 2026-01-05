/**
 * API Service
 * Centralized HTTP client with authentication
 */

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, STORAGE_KEYS } from '../config/constants';
import type { User, AuthTokens, Room, RoomListItem, ExecutionResult, ApiError } from '../types';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config;
    
    // If 401 and not already retrying, try to refresh token
    if (error.response?.status === 401 && originalRequest && !(originalRequest as any)._retry) {
      (originalRequest as any)._retry = true;
      
      try {
        const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
            refreshToken,
          });
          
          const { accessToken, refreshToken: newRefreshToken } = response.data;
          localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
          
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - clear tokens and redirect to login
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// ===================
// Auth API
// ===================

export const authApi = {
  register: async (data: { username: string; email: string; password: string }) => {
    const response = await api.post<{ user: User } & AuthTokens>('/api/auth/register', data);
    return response.data;
  },

  login: async (data: { email: string; password: string }) => {
    const response = await api.post<{ user: User } & AuthTokens>('/api/auth/login', data);
    return response.data;
  },

  logout: async (refreshToken: string) => {
    await api.post('/api/auth/logout', { refreshToken });
  },

  getProfile: async () => {
    const response = await api.get<{ user: User }>('/api/auth/me');
    return response.data.user;
  },

  updateProfile: async (data: Partial<{ username: string; avatar: string; color: string }>) => {
    const response = await api.patch<{ user: User }>('/api/auth/me', data);
    return response.data.user;
  },
};

// ===================
// Rooms API
// ===================

export const roomsApi = {
  list: async (page = 1, limit = 20) => {
    const response = await api.get<{ rooms: RoomListItem[]; pagination: any }>('/api/rooms', {
      params: { page, limit },
    });
    return response.data;
  },

  get: async (slug: string) => {
    const response = await api.get<{ room: Room }>(`/api/rooms/${slug}`);
    return response.data.room;
  },

  create: async (data: { name: string; description?: string; isPublic?: boolean }) => {
    const response = await api.post<{ room: Room }>('/api/rooms', data);
    return response.data.room;
  },

  update: async (slug: string, data: Partial<{ name: string; description: string; settings: any }>) => {
    const response = await api.patch<{ room: Room }>(`/api/rooms/${slug}`, data);
    return response.data.room;
  },

  delete: async (slug: string) => {
    await api.delete(`/api/rooms/${slug}`);
  },

  join: async (slug: string, token?: string) => {
    const response = await api.post<{ room: { slug: string; name: string } }>(`/api/rooms/${slug}/join`, { token });
    return response.data.room;
  },

  generateInvite: async (slug: string, expiresInHours = 24) => {
    const response = await api.post<{ inviteToken: string; inviteUrl: string; expiresAt: string }>(
      `/api/rooms/${slug}/invite`,
      { expiresInHours }
    );
    return response.data;
  },

  removeMember: async (slug: string, userId: string) => {
    await api.delete(`/api/rooms/${slug}/members/${userId}`);
  },

  updateMemberRole: async (slug: string, userId: string, role: string) => {
    await api.patch(`/api/rooms/${slug}/members/${userId}`, { role });
  },
};

// ===================
// Judge API
// ===================

export const judgeApi = {
  run: async (data: { code: string; language: string; input?: string }) => {
    const response = await api.post<ExecutionResult>('/api/judge/run', data);
    return response.data;
  },

  getLanguages: async () => {
    const response = await api.get<{ languages: { id: number; name: string; aliases: string[] }[] }>(
      '/api/judge/languages'
    );
    return response.data.languages;
  },
};

export default api;

