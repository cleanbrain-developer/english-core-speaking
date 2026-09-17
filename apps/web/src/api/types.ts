export type StudyMode = 'daily' | 'due' | 'new' | 'weak' | 'category';

export interface ProgressSummaryDto {
  reps: number;
  ease: number;
  intervalDays: number;
  lapses: number;
  dueDate: string | null;
  lastReviewedAt: string | null;
}

export interface LearningItemDto {
  id: number;
  category: string;
  rank: number;
  english: string;
  korean: string;
  example: string;
  progress?: ProgressSummaryDto | null;
}

export interface QueueResponse {
  items: LearningItemDto[];
  total: number;
}

export interface StudySessionDto {
  id: string;
  userId: string;
  mode: string;
  startedAt: string;
  endedAt: string | null;
  reviewedCount: number;
}

export interface ReviewResultDto {
  learningItemId: number;
  rating: 1 | 2 | 3 | 4;
  reps: number;
  lapses: number;
  ease: number;
  intervalDays: number;
  dueDate: string;
}

export interface ProgressCategoryDto {
  category: string;
  total: number;
  learned: number;
}

export interface ProgressSummaryResponseDto {
  total: number;
  learned: number;
  due: number;
  today: number;
  categories: ProgressCategoryDto[];
}

export interface ProgressCalendarDayDto {
  date: string;
  count: number;
}

export interface ProgressCalendarResponseDto {
  from: string;
  to: string;
  days: ProgressCalendarDayDto[];
}

export interface ChunkDrillItemDto {
  id: number;
  rank: number;
  english: string;
  korean: string;
  example: string;
  practiceCount: number;
  lastPracticedAt: string | null;
}

export interface ChunkDrillSetResponseDto {
  items: ChunkDrillItemDto[];
  total: number;
}

export interface ChunkDrillSummaryDto {
  total: number;
  practicedAtLeastOnce: number;
  practicedToday: number;
}

export type PatternSlotType = 'noun' | 'verb' | 'adjective' | 'person' | 'reason' | 'clause' | 'topic' | 'free';

export interface PatternSlotDto {
  key: string;
  type: PatternSlotType;
  placeholder?: string;
  examples?: string[];
}

export interface PatternExampleDto {
  english: string;
  korean?: string;
  note?: string;
}

export interface PatternExpansionDto {
  level: number;
  pattern: string;
  description?: string;
}

export type PatternStatus = 'new' | 'learning' | 'familiar' | 'mastered';

export interface SpeakingPatternDto {
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
  slots: PatternSlotDto[];
  examples: PatternExampleDto[];
  expansions: PatternExpansionDto[] | null;
  relatedPatternIds: string[];
  contrastPatternIds: string[];
  tags: string[];
  difficulty: number;
  practiceCount: number;
  favorite: boolean;
  lastPracticedAt: string | null;
  status: PatternStatus;
}

export interface RelatedPatternRefDto {
  id: string;
  pattern: string;
  koreanMeaning: string;
}

export interface SpeakingPatternDetailDto extends SpeakingPatternDto {
  relatedPatterns: RelatedPatternRefDto[];
  contrastPatterns: RelatedPatternRefDto[];
}

export interface SpeakingPatternListResponseDto {
  items: SpeakingPatternDto[];
  total: number;
}

export interface SpeakingIntentDto {
  speakingIntent: string;
  total: number;
}
