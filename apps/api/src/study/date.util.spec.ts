import { addDays, startOfTodayInTimezone } from './date.util';

describe('startOfTodayInTimezone', () => {
  it('returns local midnight for Asia/Seoul (UTC+9)', () => {
    // 2026-08-13 23:30 KST == 2026-08-13 14:30 UTC
    const reference = new Date('2026-08-13T14:30:00.000Z');
    const result = startOfTodayInTimezone('Asia/Seoul', reference);
    // 2026-08-13 00:00 KST == 2026-08-12 15:00 UTC
    expect(result.toISOString()).toBe('2026-08-12T15:00:00.000Z');
  });

  it('rolls over to the next KST day just after local midnight', () => {
    // 2026-08-13 00:05 KST == 2026-08-12 15:05 UTC
    const reference = new Date('2026-08-12T15:05:00.000Z');
    const result = startOfTodayInTimezone('Asia/Seoul', reference);
    expect(result.toISOString()).toBe('2026-08-12T15:00:00.000Z');
  });
});

describe('addDays', () => {
  it('adds whole days without mutating the input', () => {
    const start = new Date('2026-08-12T15:00:00.000Z');
    const result = addDays(start, 3);
    expect(result.toISOString()).toBe('2026-08-15T15:00:00.000Z');
    expect(start.toISOString()).toBe('2026-08-12T15:00:00.000Z');
  });
});
