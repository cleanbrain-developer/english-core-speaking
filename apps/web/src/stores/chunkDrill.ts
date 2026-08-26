import { defineStore } from 'pinia';
import { apiFetch } from '../api/client';
import type { ChunkDrillItemDto } from '../api/types';

export const useChunkDrillStore = defineStore('chunkDrill', {
  state: () => ({
    items: [] as ChunkDrillItemDto[],
    index: 0,
    practicedIds: [] as number[],
    completing: false,
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
    },
    async next(): Promise<void> {
      if (!this.current) return;
      this.practicedIds.push(this.current.id);
      this.index += 1;
      if (this.isDone) await this.finish();
    },
    async finish(): Promise<void> {
      if (this.practicedIds.length === 0 || this.completing) return;
      this.completing = true;
      try {
        await apiFetch('/chunk-drill/complete', {
          method: 'POST',
          body: JSON.stringify({ chunkItemIds: this.practicedIds }),
        });
      } finally {
        this.completing = false;
      }
    },
    reset(): void {
      this.items = [];
      this.index = 0;
      this.practicedIds = [];
    },
  },
});
