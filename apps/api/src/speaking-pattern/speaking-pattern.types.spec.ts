import { deriveStatus, summarizeIntents, toSpeakingPatternItem, SpeakingPatternWithProgress } from './speaking-pattern.types';

describe('deriveStatus', () => {
  it('classifies by practiceCount thresholds', () => {
    expect(deriveStatus(0)).toBe('new');
    expect(deriveStatus(1)).toBe('learning');
    expect(deriveStatus(2)).toBe('learning');
    expect(deriveStatus(3)).toBe('familiar');
    expect(deriveStatus(5)).toBe('familiar');
    expect(deriveStatus(6)).toBe('mastered');
    expect(deriveStatus(50)).toBe('mastered');
  });
});

function row(overrides: Partial<SpeakingPatternWithProgress> = {}): SpeakingPatternWithProgress {
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
    priority: 0,
    datasetVersion: '1.0',
    isActive: true,
    progress: [],
    ...overrides,
  } as unknown as SpeakingPatternWithProgress;
}

describe('toSpeakingPatternItem', () => {
  it('defaults progress fields when the user has never practiced this pattern', () => {
    const item = toSpeakingPatternItem(row());

    expect(item.practiceCount).toBe(0);
    expect(item.favorite).toBe(false);
    expect(item.lastPracticedAt).toBeNull();
    expect(item.status).toBe('new');
  });

  it('reflects the joined progress row when present', () => {
    const lastPracticedAt = new Date('2026-09-01T00:00:00.000Z');
    const item = toSpeakingPatternItem(
      row({
        progress: [
          {
            id: 'p1',
            userId: 'u1',
            patternId: 'it-was-difficult-to',
            practiceCount: 4,
            favorite: true,
            lastPracticedAt,
          },
        ],
      } as unknown as Partial<SpeakingPatternWithProgress>),
    );

    expect(item.practiceCount).toBe(4);
    expect(item.favorite).toBe(true);
    expect(item.lastPracticedAt).toBe(lastPracticedAt.toISOString());
    expect(item.status).toBe('familiar');
  });
});

describe('summarizeIntents', () => {
  it('counts rows per speakingIntent', () => {
    const rows = [
      { speakingIntent: 'A' },
      { speakingIntent: 'A' },
      { speakingIntent: 'B' },
    ];

    const result = summarizeIntents(rows);

    expect(result).toEqual(
      expect.arrayContaining([
        { speakingIntent: 'A', total: 2 },
        { speakingIntent: 'B', total: 1 },
      ]),
    );
    expect(result).toHaveLength(2);
  });
});
