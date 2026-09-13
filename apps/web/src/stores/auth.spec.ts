import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useAuthStore } from './auth';

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sets user to null on a 401 from /auth/me instead of throwing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }),
      }),
    );

    const store = useAuthStore();
    await store.fetchCurrentUser();

    expect(store.user).toBeNull();
    expect(store.status).toBe('ready');
  });

  it('populates the user on a successful /auth/me response', async () => {
    const user = {
      id: '1',
      email: 'a@example.com',
      displayName: 'A',
      profileImageUrl: null,
      timezone: 'Asia/Seoul',
    };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => user }),
    );

    const store = useAuthStore();
    await store.fetchCurrentUser();

    expect(store.user).toEqual(user);
  });

  it('clears the user after a successful account deletion', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 204, json: async () => undefined });
    vi.stubGlobal('fetch', fetchMock);

    const store = useAuthStore();
    store.user = {
      id: '1',
      email: 'a@example.com',
      displayName: 'A',
      profileImageUrl: null,
      timezone: 'Asia/Seoul',
    };

    await store.deleteAccount();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/auth/me'),
      expect.objectContaining({ method: 'DELETE' }),
    );
    expect(store.user).toBeNull();
  });
});
