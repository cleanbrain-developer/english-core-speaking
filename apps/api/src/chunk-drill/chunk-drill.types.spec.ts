import { ChunkDrillItem, sortByDrillPriority } from './chunk-drill.types';

function item(overrides: Partial<ChunkDrillItem>): ChunkDrillItem {
  return {
    id: 1,
    rank: 1,
    english: 'placeholder',
    korean: 'placeholder',
    example: 'placeholder',
    practiceCount: 0,
    lastPracticedAt: null,
    ...overrides,
  };
}

describe('sortByDrillPriority', () => {
  it('puts never-practiced items before practiced ones, ordered by rank', () => {
    const items = [
      item({ id: 1, rank: 3, practiceCount: 2, lastPracticedAt: '2026-08-20T00:00:00.000Z' }),
      item({ id: 2, rank: 2, practiceCount: 0 }),
      item({ id: 3, rank: 1, practiceCount: 0 }),
    ];

    const ordered = sortByDrillPriority(items);

    expect(ordered.map((i) => i.id)).toEqual([3, 2, 1]);
  });

  it('among equally-practiced items, prefers the least-recently-practiced one', () => {
    const items = [
      item({ id: 1, rank: 1, practiceCount: 1, lastPracticedAt: '2026-08-26T00:00:00.000Z' }),
      item({ id: 2, rank: 2, practiceCount: 1, lastPracticedAt: '2026-08-20T00:00:00.000Z' }),
    ];

    const ordered = sortByDrillPriority(items);

    expect(ordered.map((i) => i.id)).toEqual([2, 1]);
  });

  it('falls back to rank when practice count and last-practiced are tied', () => {
    const items = [
      item({ id: 1, rank: 5, practiceCount: 3, lastPracticedAt: '2026-08-20T00:00:00.000Z' }),
      item({ id: 2, rank: 2, practiceCount: 3, lastPracticedAt: '2026-08-20T00:00:00.000Z' }),
    ];

    const ordered = sortByDrillPriority(items);

    expect(ordered.map((i) => i.id)).toEqual([2, 1]);
  });
});
