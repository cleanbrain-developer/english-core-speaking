import { defineStore } from 'pinia';
import { apiFetch, ApiError } from '../api/client';

export interface CurrentUser {
  id: string;
  email: string;
  displayName: string | null;
  profileImageUrl: string | null;
  timezone: string;
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as CurrentUser | null,
    status: 'idle' as 'idle' | 'loading' | 'ready',
  }),
  actions: {
    async fetchCurrentUser(): Promise<void> {
      this.status = 'loading';
      try {
        this.user = await apiFetch<CurrentUser>('/auth/me');
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          this.user = null;
        } else {
          throw err;
        }
      } finally {
        this.status = 'ready';
      }
    },
    async logout(): Promise<void> {
      await apiFetch('/auth/logout', { method: 'POST' });
      this.user = null;
    },
  },
});
