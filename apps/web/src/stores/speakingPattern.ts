import { defineStore } from 'pinia';
import { apiFetch } from '../api/client';
import type {
  SpeakingIntentDto,
  SpeakingPatternDetailDto,
  SpeakingPatternDto,
  SpeakingPatternListResponseDto,
} from '../api/types';

export type DrillMode = 'slot' | 'cue';

export const useSpeakingPatternStore = defineStore('speakingPattern', {
  state: () => ({
    intents: [] as SpeakingIntentDto[],
    patterns: [] as SpeakingPatternDto[],
    detail: null as SpeakingPatternDetailDto | null,

    // Drill 1 (Slot Replacement) / Drill 2 (Korean Cue) share this stepping
    // state -- both iterate the same pattern list, the view just renders
    // slot-fill vs. Korean-cue UI depending on `drillMode`. Mirrors the
    // guard pattern in stores/chunkDrill.ts (advancing/finishError) so a
    // rapid double-tap on "Next" can't double-advance, and a failed
    // completion save surfaces instead of vanishing silently.
    drillItems: [] as SpeakingPatternDto[],
    drillIndex: 0,
    drillMode: 'slot' as DrillMode,
    practicedIds: [] as string[],
    advancing: false,
    completing: false,
    finishError: null as string | null,
  }),
  getters: {
    currentDrillItem(state): SpeakingPatternDto | null {
      return state.drillItems[state.drillIndex] ?? null;
    },
    isDrillDone(state): boolean {
      return state.drillItems.length > 0 && state.drillIndex >= state.drillItems.length;
    },
    drillTotal(state): number {
      return state.drillItems.length;
    },
  },
  actions: {
    async loadIntents(): Promise<void> {
      this.intents = await apiFetch<SpeakingIntentDto[]>('/speaking-patterns/intents');
    },

    async loadPatterns(filters: { intent?: string; familyId?: string } = {}): Promise<void> {
      const params = new URLSearchParams();
      if (filters.intent) params.set('intent', filters.intent);
      if (filters.familyId) params.set('familyId', filters.familyId);
      const query = params.toString();
      const res = await apiFetch<SpeakingPatternListResponseDto>(
        `/speaking-patterns${query ? `?${query}` : ''}`,
      );
      this.patterns = res.items;
    },

    async loadDetail(id: string): Promise<void> {
      this.detail = await apiFetch<SpeakingPatternDetailDto>(`/speaking-patterns/${id}`);
    },

    async toggleFavorite(id: string): Promise<void> {
      const current = this.detail?.id === id ? this.detail.favorite : this.patterns.find((p) => p.id === id)?.favorite;
      const next = !current;
      await apiFetch(`/speaking-patterns/${id}/favorite`, {
        method: 'POST',
        body: JSON.stringify({ favorite: next }),
      });
      if (this.detail?.id === id) this.detail.favorite = next;
      const listed = this.patterns.find((p) => p.id === id);
      if (listed) listed.favorite = next;
    },

    startDrill(items: SpeakingPatternDto[], mode: DrillMode): void {
      this.drillItems = items;
      this.drillIndex = 0;
      this.drillMode = mode;
      this.practicedIds = [];
      this.advancing = false;
      this.finishError = null;
    },

    async nextDrillItem(): Promise<void> {
      if (!this.currentDrillItem || this.advancing) return;
      this.advancing = true;
      try {
        this.practicedIds.push(this.currentDrillItem.id);
        this.drillIndex += 1;
        if (this.isDrillDone) await this.finishDrill();
      } finally {
        this.advancing = false;
      }
    },

    async finishDrill(): Promise<void> {
      if (this.practicedIds.length === 0 || this.completing) return;
      this.completing = true;
      this.finishError = null;
      try {
        await apiFetch('/speaking-patterns/practice', {
          method: 'POST',
          body: JSON.stringify({ patternIds: this.practicedIds }),
        });
      } catch (err) {
        this.finishError = err instanceof Error ? err.message : '완료 처리에 실패했습니다.';
      } finally {
        this.completing = false;
      }
    },

    resetDrill(): void {
      this.drillItems = [];
      this.drillIndex = 0;
      this.practicedIds = [];
      this.advancing = false;
      this.finishError = null;
    },

    /** Used by the standalone Expansion drill, which steps through one pattern's expansion levels rather than a list of patterns. */
    async practiceOne(id: string): Promise<void> {
      await apiFetch('/speaking-patterns/practice', {
        method: 'POST',
        body: JSON.stringify({ patternIds: [id] }),
      });
    },
  },
});
