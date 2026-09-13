import { defineStore } from 'pinia';
import { apiFetch } from '../api/client';
import type { ChunkDrillItemDto } from '../api/types';

export const useChunkDrillStore = defineStore('chunkDrill', {
  state: () => ({
    items: [] as ChunkDrillItemDto[],
    index: 0,
    practicedIds: [] as number[],
    completing: false,
    // Guards next() against a rapid double-tap of the "다음" button, which
    // would otherwise fire two synchronous index increments before the
    // first render happens, silently skipping one chunk item.
    advancing: false,
    finishError: null as string | null,
  }),
  getters: {
    current(state): ChunkDrillItemDto | null {
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
    start(items: ChunkDrillItemDto[]): void {
      this.items = items;
      this.index = 0;
      this.practicedIds = [];
      this.advancing = false;
      this.finishError = null;
    },
    async next(): Promise<void> {
      if (!this.current || this.advancing) return;
      this.advancing = true;
      try {
        this.practicedIds.push(this.current.id);
        this.index += 1;
        if (this.isDone) await this.finish();
      } finally {
        this.advancing = false;
      }
    },
    async finish(): Promise<void> {
      if (this.practicedIds.length === 0 || this.completing) return;
      this.completing = true;
      this.finishError = null;
      try {
        await apiFetch('/chunk-drill/complete', {
          method: 'POST',
          body: JSON.stringify({ chunkItemIds: this.practicedIds }),
        });
      } catch (err) {
        // Surfaced in ChunkDrillView's summary screen with a retry button --
        // previously this rejection went nowhere, so a failed save looked
        // identical to a successful one and silently didn't persist.
        this.finishError = err instanceof Error ? err.message : '완료 처리에 실패했습니다.';
      } finally {
        this.completing = false;
      }
    },
    reset(): void {
      this.items = [];
      this.index = 0;
      this.practicedIds = [];
      this.advancing = false;
      this.finishError = null;
    },
  },
});
