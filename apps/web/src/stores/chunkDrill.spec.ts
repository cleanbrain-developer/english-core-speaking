import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useChunkDrillStore } from './chunkDrill';
import type { ChunkDrillItemDto } from '../api/types';

function jsonResponse(body: unknown, status = 200) {
  return { ok: status < 400, status, json: async () => body };
}

const items: ChunkDrillItemDto[] = [
  { id: 1, rank: 1, english: 'I mean', korean: '내 말은', example: 'I mean, it is fine.', practiceCount: 0, lastPracticedAt: null },
  { id: 2, rank: 2, english: 'You know', korean: '있잖아', example: 'You know, it was late.', practiceCount: 2, lastPracticedAt: null },
];

describe('useChunkDrillStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('walks through the set and reports completion once every card is seen', async () => {
    const store = useChunkDrillStore();
    store.start(items);

    expect(store.current?.id).toBe(1);
    expect(store.isDone).toBe(false);

    await store.next();
    expect(store.current?.id).toBe(2);
    expect(store.isDone).toBe(false);

    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse({ practicedCount: 2 }));
    vi.stubGlobal('fetch', fetchMock);

    await store.next();
    expect(store.isDone).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/chunk-drill/complete'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ chunkItemIds: [1, 2] }) }),
    );
  });

  it('does nothing when the set is empty', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const store = useChunkDrillStore();
    store.start([]);
    await store.next();

    expect(store.isDone).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
