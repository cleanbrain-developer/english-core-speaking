import { LearningItem, LearningProgress } from '@prisma/client';

export interface ProgressSummary {
  reps: number;
  ease: number;
  intervalDays: number;
  lapses: number;
  dueDate: string | null;
  lastReviewedAt: Date | null;
}

export type QueueItem = LearningItem & { progress: ProgressSummary | null };

export function toQueueItem(item: LearningItem, progress: LearningProgress | null): QueueItem {
  return {
    ...item,
    progress: progress
      ? {
          reps: progress.reps,
          ease: progress.ease,
          intervalDays: progress.intervalDays,
          lapses: progress.lapses,
          dueDate: progress.dueDate ? progress.dueDate.toISOString().slice(0, 10) : null,
          lastReviewedAt: progress.lastReviewedAt,
        }
      : null,
  };
}
