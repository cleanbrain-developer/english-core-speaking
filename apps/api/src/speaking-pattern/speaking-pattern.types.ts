import { SpeakingPattern, SpeakingPatternProgress } from '@prisma/client';

export interface PatternSlot {
  key: string;
  type: 'noun' | 'verb' | 'adjective' | 'person' | 'reason' | 'clause' | 'topic' | 'free';
  placeholder?: string;
  examples?: string[];
}

export interface PatternExample {
  english: string;
  korean?: string;
  /** Optional clarifying note, e.g. contrasting this example against a related pattern. */
  note?: string;
}

export interface PatternExpansion {
  level: number;
  pattern: string;
  description?: string;
}

/**
 * Mastery status is derived from practiceCount, never stored -- same
 * approach the codebase already uses for "weak item" detection (see
 * StudyService.getWeakQueue), avoids a field that can drift out of sync
 * with the practice count it would otherwise duplicate.
 */
export type PatternStatus = 'new' | 'learning' | 'familiar' | 'mastered';

export function deriveStatus(practiceCount: number): PatternStatus {
  if (practiceCount <= 0) return 'new';
  if (practiceCount <= 2) return 'learning';
  if (practiceCount <= 5) return 'familiar';
  return 'mastered';
}

export type SpeakingPatternWithProgress = SpeakingPattern & { progress: SpeakingPatternProgress[] };

export interface SpeakingPatternItem {
  id: string;
  rank: number;
  speakingIntent: string;
  familyId: string;
  familyLabel: string;
  parentPatternId: string | null;
  pattern: string;
  koreanMeaning: string;
  speakingFunction: string;
  description: string | null;
  slots: PatternSlot[];
  examples: PatternExample[];
  expansions: PatternExpansion[] | null;
  relatedPatternIds: string[];
  contrastPatternIds: string[];
  tags: string[];
  difficulty: number;
  practiceCount: number;
  favorite: boolean;
  lastPracticedAt: string | null;
  status: PatternStatus;
}

export function toSpeakingPatternItem(row: SpeakingPatternWithProgress): SpeakingPatternItem {
  const progress = row.progress[0] ?? null;
  const practiceCount = progress?.practiceCount ?? 0;
  return {
    id: row.id,
    rank: row.rank,
    speakingIntent: row.speakingIntent,
    familyId: row.familyId,
    familyLabel: row.familyLabel,
    parentPatternId: row.parentPatternId,
    pattern: row.pattern,
    koreanMeaning: row.koreanMeaning,
    speakingFunction: row.speakingFunction,
    description: row.description,
    slots: row.slots as unknown as PatternSlot[],
    examples: row.examples as unknown as PatternExample[],
    expansions: (row.expansions as unknown as PatternExpansion[] | null) ?? null,
    relatedPatternIds: row.relatedPatternIds,
    contrastPatternIds: row.contrastPatternIds,
    tags: row.tags,
    difficulty: row.difficulty,
    practiceCount,
    favorite: progress?.favorite ?? false,
    lastPracticedAt: progress?.lastPracticedAt ? progress.lastPracticedAt.toISOString() : null,
    status: deriveStatus(practiceCount),
  };
}

export interface SpeakingIntentSummary {
  speakingIntent: string;
  total: number;
}

export function summarizeIntents(rows: Pick<SpeakingPattern, 'speakingIntent'>[]): SpeakingIntentSummary[] {
  const counts = new Map<string, number>();
  for (const row of rows) counts.set(row.speakingIntent, (counts.get(row.speakingIntent) ?? 0) + 1);
  return Array.from(counts.entries()).map(([speakingIntent, total]) => ({ speakingIntent, total }));
}
