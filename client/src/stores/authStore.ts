/**
 * Auth Store
 * Global authentication state with Zustand
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../services/api';
import { STORAGE_KEYS } from '../config/constants';
import type { User } from '../types';

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const { user, accessToken, refreshToken } = await authApi.login({ email, password });
          
          // Store tokens
          localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
          
          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            error: error.response?.data?.error || 'Login failed',
            isLoading: false,
          });
          throw error;
        }
      },

      register: async (username: string, email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const { user, accessToken, refreshToken } = await authApi.register({
            username,
            email,
            password,
          });
          
          // Store tokens
          localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
          
          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            error: error.response?.data?.error || 'Registration failed',
            isLoading: false,
          });
          throw error;
        }
      },

      logout: async () => {
        const { refreshToken } = get();
        try {
          if (refreshToken) {
            await authApi.logout(refreshToken);
          }
        } catch (error) {
          // Ignore logout API errors
        } finally {
          // Clear local storage
          localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
          
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      checkAuth: async () => {
        const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        
        if (!accessToken) {
          set({ isLoading: false, isAuthenticated: false });
          return;
        }
        
        try {
          const user = await authApi.getProfile();
          set({
            user,
            accessToken,
            refreshToken: localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          // Token invalid
          localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      updateUser: (data: Partial<User>) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...data } });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'codeverse-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

