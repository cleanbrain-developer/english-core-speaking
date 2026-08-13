import { Injectable } from '@nestjs/common';
import { ReviewRating, ReviewScheduler, SchedulerState } from './scheduler.types';

const MIN_EASE = 1.3;
const MAX_EASE = 3.2;

/**
 * SRS v1 formulas, as specified in CLAUDE.md "Scheduler v1". A card is
 * "new" when it has never been reviewed (reps === 0) — new cards use the
 * fixed Good/Easy intervals instead of the interval*ease multiplier.
 */
@Injectable()
export class SrsV1Scheduler implements ReviewScheduler {
  computeNext(state: SchedulerState, rating: ReviewRating): SchedulerState {
    const isNewCard = state.reps === 0;

    switch (rating) {
      case 1: // Again
        return {
          reps: state.reps + 1,
          lapses: state.lapses + 1,
          ease: Math.max(MIN_EASE, state.ease - 0.2),
          intervalDays: 1,
        };

      case 2: // Hard
        return {
          reps: state.reps + 1,
          lapses: state.lapses,
          ease: Math.max(MIN_EASE, state.ease - 0.05),
          intervalDays: Math.max(1, Math.round(state.intervalDays * 1.4)),
        };

      case 3: // Good
        return {
          reps: state.reps + 1,
          lapses: state.lapses,
          ease: state.ease,
          intervalDays: isNewCard ? 2 : Math.round(state.intervalDays * state.ease),
        };

      case 4: { // Easy
        const nextEase = Math.min(MAX_EASE, state.ease + 0.08);
        return {
          reps: state.reps + 1,
          lapses: state.lapses,
          ease: nextEase,
          intervalDays: isNewCard ? 4 : Math.round(state.intervalDays * (nextEase + 0.15)),
        };
      }
    }
  }
}
