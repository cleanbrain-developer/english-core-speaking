import { SrsV1Scheduler } from './srs-v1.scheduler';
import { SchedulerState } from './scheduler.types';

describe('SrsV1Scheduler', () => {
  const scheduler = new SrsV1Scheduler();
  const newCard: SchedulerState = { reps: 0, ease: 2.5, intervalDays: 0, lapses: 0 };
  const reviewedCard: SchedulerState = { reps: 3, ease: 2.5, intervalDays: 6, lapses: 0 };

  describe('rating 1 (Again)', () => {
    it('resets interval to 1 day and increments lapses', () => {
      const next = scheduler.computeNext(reviewedCard, 1);
      expect(next).toEqual({ reps: 4, ease: 2.3, intervalDays: 1, lapses: 1 });
    });

    it('floors ease at 1.3', () => {
      const next = scheduler.computeNext({ ...reviewedCard, ease: 1.35 }, 1);
      expect(next.ease).toBe(1.3);
    });
  });

  describe('rating 2 (Hard)', () => {
    it('grows the interval by 1.4x and nudges ease down', () => {
      const next = scheduler.computeNext(reviewedCard, 2);
      expect(next).toEqual({ reps: 4, ease: 2.45, intervalDays: 8, lapses: 0 }); // round(6*1.4)=8
    });

    it('floors interval at 1 day for a new card', () => {
      const next = scheduler.computeNext(newCard, 2);
      expect(next.intervalDays).toBe(1);
    });
  });

  describe('rating 3 (Good)', () => {
    it('uses the fixed 2-day interval for a new card', () => {
      const next = scheduler.computeNext(newCard, 3);
      expect(next).toEqual({ reps: 1, ease: 2.5, intervalDays: 2, lapses: 0 });
    });

    it('multiplies interval by ease for a reviewed card', () => {
      const next = scheduler.computeNext(reviewedCard, 3);
      expect(next).toEqual({ reps: 4, ease: 2.5, intervalDays: 15, lapses: 0 }); // round(6*2.5)=15
    });
  });

  describe('rating 4 (Easy)', () => {
    it('uses the fixed 4-day interval for a new card and bumps ease up', () => {
      const next = scheduler.computeNext(newCard, 4);
      expect(next).toEqual({ reps: 1, ease: 2.58, intervalDays: 4, lapses: 0 });
    });

    it('multiplies interval by the updated ease + 0.15 for a reviewed card', () => {
      const next = scheduler.computeNext(reviewedCard, 4);
      // nextEase = 2.58, interval = round(6 * (2.58+0.15)) = round(16.38) = 16
      expect(next).toEqual({ reps: 4, ease: 2.58, intervalDays: 16, lapses: 0 });
    });

    it('caps ease at 3.2', () => {
      const next = scheduler.computeNext({ ...reviewedCard, ease: 3.18 }, 4);
      expect(next.ease).toBe(3.2);
    });
  });
});
