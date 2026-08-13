import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useStudyStore } from './study';
import type { LearningItemDto } from '../api/types';

function jsonResponse(body: unknown, status = 200) {
  return { ok: status < 400, status, json: async () => body };
}

const items: LearningItemDto[] = [
  { id: 1, category: 'Core Word', rank: 1, english: 'go', korean: '가다', example: 'go home' },
  { id: 2, category: 'Core Word', rank: 2, english: 'come', korean: '오다', example: 'come here' },
];

describe('useStudyStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates a session and walks through items until done, then auto-finishes', async () => {
    const fetchMock = vi.fn();
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ id: 'session-1' }, 201)) // POST /study/sessions
      .mockResolvedValueOnce(
        jsonResponse({ learningItemId: 1, rating: 3, reps: 1, lapses: 0, ease: 2.5, intervalDays: 2, dueDate: '2026-08-15' }, 201),
      ) // POST /study/reviews for item 1
      .mockResolvedValueOnce(
        jsonResponse({ learningItemId: 2, rating: 4, reps: 1, lapses: 0, ease: 2.58, intervalDays: 4, dueDate: '2026-08-17' }, 201),
      ) // POST /study/reviews for item 2
      .mockResolvedValueOnce(jsonResponse({ id: 'session-1', endedAt: '2026-08-13T00:00:00.000Z' })); // PATCH finish
    vi.stubGlobal('fetch', fetchMock);

    const store = useStudyStore();
    await store.start('new', items);
    expect(store.sessionId).toBe('session-1');
    expect(store.current?.id).toBe(1);

    store.reveal();
    expect(store.revealed).toBe(true);

    await store.rate(3);
    expect(store.current?.id).toBe(2);
    expect(store.isDone).toBe(false);

    await store.rate(4);
    expect(store.isDone).toBe(true);
    expect(store.results).toHaveLength(2);
    // 4 calls: create session, 2 reviews, auto-finish on the last rate()
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('does not create a session when the queue is empty', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const store = useStudyStore();
    await store.start('due', []);

    expect(store.sessionId).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
