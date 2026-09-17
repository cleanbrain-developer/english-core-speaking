import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useSpeakingPatternStore } from './speakingPattern';
import type { SpeakingPatternDto } from '../api/types';

function jsonResponse(body: unknown, status = 200) {
  return { ok: status < 400, status, json: async () => body };
}

function pattern(overrides: Partial<SpeakingPatternDto>): SpeakingPatternDto {
  return {
    id: 'it-was-difficult-to',
    rank: 1,
    speakingIntent: '과거 상황을 설명하고 싶을 때',
    familyId: 'it-was',
    familyLabel: 'It was ...',
    parentPatternId: null,
    pattern: 'It was difficult to [ACTION].',
    koreanMeaning: '~하기 어려웠어.',
    speakingFunction: 'test',
    description: null,
    slots: [],
    examples: [{ english: 'It was difficult to understand.' }],
    expansions: null,
    relatedPatternIds: [],
    contrastPatternIds: [],
    tags: [],
    difficulty: 1,
    practiceCount: 0,
    favorite: false,
    lastPracticedAt: null,
    status: 'new',
    ...overrides,
  };
}

const items = [pattern({ id: 'p1' }), pattern({ id: 'p2' })];

describe('useSpeakingPatternStore drill', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('walks through the drill list and saves practice once done', async () => {
    const store = useSpeakingPatternStore();
    store.startDrill(items, 'slot');

    expect(store.currentDrillItem?.id).toBe('p1');
    expect(store.isDrillDone).toBe(false);

    await store.nextDrillItem();
    expect(store.currentDrillItem?.id).toBe('p2');

    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse({ practicedCount: 2 }));
    vi.stubGlobal('fetch', fetchMock);

    await store.nextDrillItem();
    expect(store.isDrillDone).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/speaking-patterns/practice'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ patternIds: ['p1', 'p2'] }) }),
    );
  });

  it('ignores nextDrillItem while a previous call is still in flight', async () => {
    const store = useSpeakingPatternStore();
    store.startDrill(items, 'slot');
    store.advancing = true;

    await store.nextDrillItem();

    expect(store.drillIndex).toBe(0);
    expect(store.practicedIds).toEqual([]);
  });

  it('records a finishError instead of throwing when the practice save fails', async () => {
    const store = useSpeakingPatternStore();
    store.startDrill(items, 'cue');

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ error: { code: 'ERR', message: 'boom' } }, 500)),
    );

    await store.nextDrillItem();
    await expect(store.nextDrillItem()).resolves.toBeUndefined();

    expect(store.isDrillDone).toBe(true);
    expect(store.finishError).toBeTruthy();
  });
});

describe('useSpeakingPatternStore favorite', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('toggles favorite optimistically on both detail and the list entry', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ favorite: true }));
    vi.stubGlobal('fetch', fetchMock);

    const store = useSpeakingPatternStore();
    store.patterns = [pattern({ id: 'p1', favorite: false })];
    store.detail = { ...pattern({ id: 'p1', favorite: false }), relatedPatterns: [], contrastPatterns: [] };

    await store.toggleFavorite('p1');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/speaking-patterns/p1/favorite'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ favorite: true }) }),
    );
    expect(store.detail?.favorite).toBe(true);
    expect(store.patterns[0].favorite).toBe(true);
  });
});
