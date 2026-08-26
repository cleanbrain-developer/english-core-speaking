import { ChunkDrillProgress, ChunkItem } from '@prisma/client';

export type ChunkItemWithProgress = ChunkItem & { progress: ChunkDrillProgress[] };

export interface ChunkDrillItem {
  id: number;
  rank: number;
  english: string;
  korean: string;
  example: string;
  practiceCount: number;
  lastPracticedAt: string | null;
}

export function toChunkDrillItem(item: ChunkItemWithProgress): ChunkDrillItem {
  const progress = item.progress[0] ?? null;
  return {
    id: item.id,
    rank: item.rank,
    english: item.english,
    korean: item.korean,
    example: item.example,
    practiceCount: progress?.practiceCount ?? 0,
    lastPracticedAt: progress?.lastPracticedAt ? progress.lastPracticedAt.toISOString() : null,
  };
}

/**
 * Never-practiced items first (by rank), then least-practiced / least-recently-practiced —
 * favors coverage and repetition-spacing over any due-date scheduling (this drill has no SRS).
 */
export function sortByDrillPriority(items: ChunkDrillItem[]): ChunkDrillItem[] {
  return [...items].sort((a, b) => {
    if (a.practiceCount !== b.practiceCount) return a.practiceCount - b.practiceCount;
    if (a.lastPracticedAt !== b.lastPracticedAt) {
      if (a.lastPracticedAt === null) return -1;
      if (b.lastPracticedAt === null) return 1;
      return a.lastPracticedAt.localeCompare(b.lastPracticedAt);
    }
    return a.rank - b.rank;
  });
}
