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
