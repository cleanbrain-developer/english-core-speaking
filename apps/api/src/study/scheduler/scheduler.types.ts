export type ReviewRating = 1 | 2 | 3 | 4;

export interface SchedulerState {
  reps: number;
  ease: number;
  intervalDays: number;
  lapses: number;
}

/**
 * Pure domain contract for spaced-repetition scheduling. Kept isolated from
 * Prisma/NestJS so the algorithm (currently SRS v1, see CLAUDE.md) can be
 * swapped later without touching StudyService or the Prisma models.
 */
export interface ReviewScheduler {
  computeNext(state: SchedulerState, rating: ReviewRating): SchedulerState;
}

export const REVIEW_SCHEDULER = Symbol('REVIEW_SCHEDULER');
