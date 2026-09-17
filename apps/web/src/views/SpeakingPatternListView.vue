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

const intent = computed(() => (typeof route.query.intent === 'string' ? route.query.intent : undefined));
const familyId = computed(() => (typeof route.query.familyId === 'string' ? route.query.familyId : undefined));

async function load() {
  loading.value = true;
  error.value = null;
  try {
    await store.loadPatterns({ intent: intent.value, familyId: familyId.value });
  } catch (err) {
    error.value = err instanceof Error ? err.message : '목록을 불러오지 못했습니다.';
  } finally {
    loading.value = false;
  }
}

onMounted(load);
watch([intent, familyId], load);

const groups = computed(() => {
  const byFamily = new Map<string, { familyLabel: string; items: SpeakingPatternDto[] }>();
  for (const item of store.patterns) {
    if (!byFamily.has(item.familyId)) byFamily.set(item.familyId, { familyLabel: item.familyLabel, items: [] });
    byFamily.get(item.familyId)!.items.push(item);
  }
  return Array.from(byFamily.values());
});

const pageTitle = computed(() => (intent.value ? speakingIntentLabel(intent.value) : '전체 패턴'));

function startFullDrill(mode: 'slot' | 'cue') {
  if (store.patterns.length === 0) return;
  store.startDrill(store.patterns, mode);
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
      <div v-if="store.patterns.length > 0" class="drill-actions">
        <button class="drill-cta slot" @click="startFullDrill('slot')">전체 Slot 연습</button>
        <button class="drill-cta cue" @click="startFullDrill('cue')">전체 한국어 cue 연습</button>
      </div>

      <p v-if="store.patterns.length === 0" class="center">패턴이 없습니다.</p>

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
