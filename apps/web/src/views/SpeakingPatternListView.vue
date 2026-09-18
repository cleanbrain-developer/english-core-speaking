<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSpeakingPatternStore } from '../stores/speakingPattern';
import { speakingIntentLabel } from '../constants/speakingIntent';
import type { SpeakingPatternDto } from '../api/types';

const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  learning: 'Learning',
  familiar: 'Familiar',
  mastered: 'Mastered',
};

const route = useRoute();
const router = useRouter();
const store = useSpeakingPatternStore();

const loading = ref(true);
const error = ref<string | null>(null);
const drillSize = ref<5 | 10 | 'all'>(10);

const intent = computed(() => (typeof route.query.intent === 'string' ? route.query.intent : undefined));
const familyId = computed(() => (typeof route.query.familyId === 'string' ? route.query.familyId : undefined));
// "favorites"/"review" are client-side views over the FULL dataset (only
// 119 rows total -- no pagination anywhere in this feature, see
// speaking-pattern.controller.ts), not server-side filters. Loading
// everything and filtering here avoids adding favorite/status query
// params to the API for what's still a small dataset.
const view = computed(() => (route.query.view === 'favorites' || route.query.view === 'review' ? route.query.view : undefined));

async function load() {
  loading.value = true;
  error.value = null;
  try {
    if (view.value) {
      await store.loadPatterns({});
    } else {
      await store.loadPatterns({ intent: intent.value, familyId: familyId.value });
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : '목록을 불러오지 못했습니다.';
  } finally {
    loading.value = false;
  }
}

onMounted(load);
watch([intent, familyId, view], load);

// Everything below reads `displayedPatterns`, never `store.patterns`
// directly, so the favorites/review views and the drill-size cap apply
// uniformly to grouping and to the "전체 연습" buttons alike.
const displayedPatterns = computed(() => {
  if (view.value === 'favorites') return store.patterns.filter((p) => p.favorite);
  if (view.value === 'review') return store.patterns.filter((p) => p.status !== 'mastered');
  return store.patterns;
});

const groups = computed(() => {
  const byFamily = new Map<string, { familyLabel: string; items: SpeakingPatternDto[] }>();
  for (const item of displayedPatterns.value) {
    if (!byFamily.has(item.familyId)) byFamily.set(item.familyId, { familyLabel: item.familyLabel, items: [] });
    byFamily.get(item.familyId)!.items.push(item);
  }
  return Array.from(byFamily.values());
});

const pageTitle = computed(() => {
  if (view.value === 'favorites') return '⭐ 즐겨찾기';
  if (view.value === 'review') return '📌 복습이 필요한 패턴';
  return intent.value ? speakingIntentLabel(intent.value) : '전체 패턴';
});

const emptyMessage = computed(() => {
  if (view.value === 'favorites') return '아직 즐겨찾기한 패턴이 없습니다. 패턴 상세 화면에서 ☆를 눌러 추가해보세요.';
  if (view.value === 'review') return '복습이 필요한 패턴이 없습니다. 전부 마스터했어요!';
  return '패턴이 없습니다.';
});

function startFullDrill(mode: 'slot' | 'cue') {
  const pool = displayedPatterns.value;
  if (pool.length === 0) return;
  const items = drillSize.value === 'all' ? pool : pool.slice(0, drillSize.value);
  store.startDrill(items, mode);
  router.push('/speaking-patterns/drill');
}
</script>

<template>
  <main class="page">
    <header class="topbar">
      <button class="icon-btn" aria-label="뒤로" @click="router.push('/speaking-patterns')">←</button>
      <h1>{{ pageTitle }}</h1>
    </header>

    <div v-if="loading" class="center">불러오는 중...</div>
    <div v-else-if="error" class="center error">
      <p>{{ error }}</p>
      <button @click="load">다시 시도</button>
    </div>

    <template v-else>
      <div v-if="displayedPatterns.length > 0" class="drill-setup">
        <div class="size-picker">
          <span class="size-label">세션 크기</span>
          <button :class="{ active: drillSize === 5 }" @click="drillSize = 5">5개</button>
          <button :class="{ active: drillSize === 10 }" @click="drillSize = 10">10개</button>
          <button :class="{ active: drillSize === 'all' }" @click="drillSize = 'all'">
            전체 ({{ displayedPatterns.length }})
          </button>
        </div>
        <div class="drill-actions">
          <button class="drill-cta slot" @click="startFullDrill('slot')">Slot 연습</button>
          <button class="drill-cta cue" @click="startFullDrill('cue')">한국어 cue 연습</button>
        </div>
      </div>

      <p v-if="displayedPatterns.length === 0" class="center">{{ emptyMessage }}</p>

      <section v-for="group in groups" :key="group.familyLabel" class="family-group">
        <h2 class="family-label">{{ group.familyLabel }}</h2>
        <ul class="pattern-list">
          <li
            v-for="item in group.items"
            :key="item.id"
            class="pattern-row"
            @click="router.push(`/speaking-patterns/pattern/${item.id}`)"
          >
            <div class="pattern-main">
              <span class="pattern-text">{{ item.pattern }}</span>
              <span v-if="item.favorite" class="favorite-mark">★</span>
            </div>
            <p class="pattern-meaning">{{ item.koreanMeaning }}</p>
            <span class="status-badge" :class="item.status">{{ STATUS_LABELS[item.status] }}</span>
          </li>
        </ul>
      </section>
    </template>
  </main>
</template>

<style scoped>
.page {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem 1rem 2rem;
  max-width: 480px;
  margin: 0 auto;
}
.topbar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.topbar h1 {
  font-size: 1.1rem;
  margin: 0;
}
.icon-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: inherit;
  cursor: pointer;
  padding: 0.25rem;
}
.center {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem;
  text-align: center;
  opacity: 0.7;
}
.center.error {
  color: #f87171;
  opacity: 1;
}
.drill-setup {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.size-picker {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.size-label {
  font-size: 0.75rem;
  opacity: 0.55;
  margin-right: 0.15rem;
}
.size-picker button {
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  border: 1px solid rgba(249, 115, 22, 0.4);
  background: transparent;
  color: inherit;
  font-size: 0.75rem;
  cursor: pointer;
  opacity: 0.7;
}
.size-picker button.active {
  background: rgba(249, 115, 22, 0.2);
  border-color: #f97316;
  opacity: 1;
  font-weight: 600;
}
.drill-actions {
  display: flex;
  gap: 0.5rem;
}
.drill-cta {
  flex: 1;
  padding: 0.7rem;
  border-radius: 999px;
  border: 1px solid #f97316;
  background: rgba(249, 115, 22, 0.15);
  color: inherit;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
}
.family-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.family-label {
  font-size: 0.85rem;
  opacity: 0.6;
  margin: 0;
}
.pattern-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.pattern-row {
  padding: 0.9rem;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
  position: relative;
}
.pattern-main {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.pattern-text {
  font-weight: 600;
}
.favorite-mark {
  color: #f59e0b;
  font-size: 0.85rem;
}
.pattern-meaning {
  font-size: 0.8rem;
  opacity: 0.7;
  margin: 0.2rem 0 0;
}
.status-badge {
  position: absolute;
  top: 0.7rem;
  right: 0.8rem;
  font-size: 0.65rem;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  opacity: 0.7;
  border: 1px solid currentColor;
}
.status-badge.new {
  color: #9ca3af;
}
.status-badge.learning {
  color: #60a5fa;
}
.status-badge.familiar {
  color: #34d399;
}
.status-badge.mastered {
  color: #f59e0b;
}
button {
  cursor: pointer;
}
</style>
