import { defineStore } from 'pinia';
import { apiFetch } from '../api/client';
import type { LearningItemDto, ReviewResultDto, StudyMode, StudySessionDto } from '../api/types';

export const RATING_LABELS: Record<1 | 2 | 3 | 4, string> = {
  1: '다시',
  2: '어려움',
  3: '보통',
  4: '쉬움',
};

export const useStudyStore = defineStore('study', {
  state: () => ({
    sessionId: null as string | null,
    mode: null as StudyMode | null,
    items: [] as LearningItemDto[],
    index: 0,
    revealed: false,
    results: [] as ReviewResultDto[],
    submitting: false,
  }),
  getters: {
    current(state): LearningItemDto | null {
      return state.items[state.index] ?? null;
    },
    isDone(state): boolean {
      return state.items.length > 0 && state.index >= state.items.length;
    },
    total(state): number {
      return state.items.length;
    },
  },
  actions: {
    async start(mode: StudyMode, items: LearningItemDto[]): Promise<void> {
      this.mode = mode;
      this.items = items;
      this.index = 0;
      this.revealed = false;
      this.results = [];
      if (items.length === 0) {
        this.sessionId = null;
        return;
      }
      const session = await apiFetch<StudySessionDto>('/study/sessions', {
        method: 'POST',
        body: JSON.stringify({ mode }),
      });
      this.sessionId = session.id;
    },
    reveal(): void {
      this.revealed = true;
    },
    async rate(rating: 1 | 2 | 3 | 4): Promise<void> {
      if (!this.sessionId || !this.current || this.submitting) return;
      this.submitting = true;
      try {
        const result = await apiFetch<ReviewResultDto>('/study/reviews', {
          method: 'POST',
          body: JSON.stringify({ sessionId: this.sessionId, learningItemId: this.current.id, rating }),
        });
        this.results.push(result);
        this.index += 1;
        this.revealed = false;
        if (this.isDone) await this.finish();
      } finally {
        this.submitting = false;
      }
    },
    async finish(): Promise<void> {
      if (!this.sessionId) return;
      await apiFetch(`/study/sessions/${this.sessionId}/finish`, { method: 'PATCH' });
    },
    reset(): void {
      this.sessionId = null;
      this.mode = null;
      this.items = [];
      this.index = 0;
      this.revealed = false;
      this.results = [];
    },
  },
});
