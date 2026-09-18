<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSpeakingPatternStore } from '../stores/speakingPattern';
import type { DrillMode } from '../stores/speakingPattern';
import { speak } from '../composables/useSpeech';

const route = useRoute();
const router = useRouter();
const store = useSpeakingPatternStore();

const loading = ref(true);
const error = ref<string | null>(null);
const favoriteBusy = ref(false);

const id = computed(() => String(route.params.id));

async function load() {
  loading.value = true;
  error.value = null;
  try {
    await store.loadDetail(id.value);
  } catch (err) {
    error.value = err instanceof Error ? err.message : '패턴을 불러오지 못했습니다.';
  } finally {
    loading.value = false;
  }
}

onMounted(load);
watch(id, load);

// Renders "It was difficult to [ACTION]." with the [SLOT] token visually
// separated out, so the learner immediately sees what's fixed vs. swappable
// (§12 "Pattern Visualization") without a full templating engine.
const patternParts = computed(() => {
  const text = store.detail?.pattern ?? '';
  const parts: Array<{ text: string; slot: boolean }> = [];
  const regex = /\[([A-Z0-9_-]+)\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text))) {
    if (match.index > lastIndex) parts.push({ text: text.slice(lastIndex, match.index), slot: false });
    parts.push({ text: match[1], slot: true });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push({ text: text.slice(lastIndex), slot: false });
  return parts;
});

async function toggleFavorite() {
  if (!store.detail || favoriteBusy.value) return;
  favoriteBusy.value = true;
  try {
    await store.toggleFavorite(store.detail.id);
  } catch {
    // best-effort UI toggle -- a failed favorite save isn't worth blocking on
  } finally {
    favoriteBusy.value = false;
  }
}

const RANDOM_SLOT_ROUNDS = 5;

function startDrill(mode: DrillMode) {
  if (!store.detail) return;
  // Random Slot re-rolls its slot values every round (see
  // SpeakingPatternDrillView's watch on drillIndex), so repeating the same
  // pattern several times gives genuinely different combinations to
  // practice instead of a single one-off round.
  const items = mode === 'random-slot' ? Array(RANDOM_SLOT_ROUNDS).fill(store.detail) : [store.detail];
  store.startDrill(items, mode);
  router.push('/speaking-patterns/drill');
}

function startExpansionDrill() {
  if (!store.detail) return;
  router.push(`/speaking-patterns/drill/expansion/${store.detail.id}`);
}
</script>

<template>
  <main class="page">
    <header class="topbar">
      <button class="icon-btn" aria-label="뒤로" @click="router.back()">←</button>
      <button
        v-if="store.detail"
        class="icon-btn favorite"
        :class="{ active: store.detail.favorite }"
        :disabled="favoriteBusy"
        aria-label="즐겨찾기"
        @click="toggleFavorite"
      >
        {{ store.detail.favorite ? '★' : '☆' }}
      </button>
    </header>

    <div v-if="loading" class="center">불러오는 중...</div>
    <div v-else-if="error" class="center error">
      <p>{{ error }}</p>
      <button @click="load">다시 시도</button>
    </div>

    <template v-else-if="store.detail">
      <section class="header-block">
        <p class="pattern-line">
          <span v-for="(part, i) in patternParts" :key="i" :class="{ slot: part.slot }">{{ part.text }}</span>
        </p>
        <p class="meaning">{{ store.detail.koreanMeaning }}</p>
        <div class="function-row">
          <span class="function-text">{{ store.detail.speakingFunction }}</span>
          <button
            class="icon-btn"
            aria-label="발음 듣기"
            @click="speak(store.detail.examples[0]?.english ?? store.detail.pattern)"
          >
            🔊
          </button>
        </div>
        <p v-if="store.detail.description" class="description">{{ store.detail.description }}</p>
      </section>

      <section v-if="store.detail.slots.length > 0" class="slot-block">
        <h2 class="section-title">Slot</h2>
        <div v-for="slot in store.detail.slots" :key="slot.key" class="slot-row">
          <span class="slot-key">{{ slot.key }}</span>
          <span v-if="slot.examples?.length" class="slot-examples">{{ slot.examples.join(' / ') }}</span>
        </div>
      </section>

      <section class="example-block">
        <h2 class="section-title">Examples</h2>
        <ul class="example-list">
          <li v-for="(ex, i) in store.detail.examples" :key="i" class="example-row">
            <div class="example-main">
              <span class="example-en">{{ ex.english }}</span>
              <button class="icon-btn" aria-label="발음 듣기" @click="speak(ex.english)">🔊</button>
            </div>
            <p v-if="ex.korean" class="example-ko">{{ ex.korean }}</p>
            <p v-if="ex.note" class="example-note">{{ ex.note }}</p>
          </li>
        </ul>
      </section>

      <section v-if="store.detail.expansions?.length" class="expansion-block">
        <h2 class="section-title">Expansion</h2>
        <ol class="expansion-list">
          <li v-for="step in store.detail.expansions" :key="step.level" class="expansion-row">
            <span class="expansion-level">Lv.{{ step.level }}</span>
            <span class="expansion-text">{{ step.pattern }}</span>
          </li>
        </ol>
        <button class="expansion-drill-btn" @click="startExpansionDrill">Expansion 단계별 연습</button>
      </section>

      <section v-if="store.detail.contrastPatterns.length > 0" class="related-block">
        <h2 class="section-title">Contrast</h2>
        <button
          v-for="ref in store.detail.contrastPatterns"
          :key="ref.id"
          class="related-chip"
          @click="router.push(`/speaking-patterns/pattern/${ref.id}`)"
        >
          {{ ref.pattern }}
        </button>
      </section>

      <section v-if="store.detail.relatedPatterns.length > 0" class="related-block">
        <h2 class="section-title">Similar Pattern</h2>
        <button
          v-for="ref in store.detail.relatedPatterns"
          :key="ref.id"
          class="related-chip"
          @click="router.push(`/speaking-patterns/pattern/${ref.id}`)"
        >
          {{ ref.pattern }}
        </button>
      </section>

      <footer class="drill-bar">
        <button
          v-if="store.detail.slots.length > 0"
          class="drill-cta slot"
          @click="startDrill('slot')"
        >
          Slot 연습
        </button>
        <button
          v-if="store.detail.slots.length > 0"
          class="drill-cta random"
          @click="startDrill('random-slot')"
        >
          🎲 Random Slot
        </button>
        <button class="drill-cta cue" @click="startDrill('cue')">한국어 cue 연습</button>
      </footer>
    </template>
  </main>
</template>

<style scoped>
.page {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 1.5rem 1rem 2rem;
  max-width: 480px;
  margin: 0 auto;
}
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.icon-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: inherit;
  cursor: pointer;
  padding: 0.25rem;
}
.icon-btn.favorite.active {
  color: #f59e0b;
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
.header-block {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.pattern-line {
  font-size: 1.6rem;
  font-weight: 700;
  line-height: 1.35;
  margin: 0;
}
.pattern-line .slot {
  color: #f97316;
  border-bottom: 2px dashed #f97316;
}
.meaning {
  font-size: 1.1rem;
  opacity: 0.85;
  margin: 0;
}
.function-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}
.function-text {
  font-size: 0.8rem;
  opacity: 0.6;
}
.description {
  font-size: 0.8rem;
  opacity: 0.6;
  line-height: 1.5;
  margin: 0;
}
.section-title {
  font-size: 0.85rem;
  opacity: 0.6;
  margin: 0 0 0.5rem;
}
.slot-block {
  padding: 0.75rem;
  border-radius: 12px;
  background: rgba(249, 115, 22, 0.1);
  border: 1px solid rgba(249, 115, 22, 0.3);
}
.slot-row {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  font-size: 0.85rem;
}
.slot-key {
  font-weight: 700;
  color: #f97316;
}
.slot-examples {
  opacity: 0.7;
}
.example-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.example-row {
  padding: 0.7rem 0.9rem;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
}
.example-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}
.example-en {
  font-weight: 500;
}
.example-ko {
  font-size: 0.8rem;
  opacity: 0.65;
  margin: 0.2rem 0 0;
}
.example-note {
  font-size: 0.7rem;
  opacity: 0.55;
  margin: 0.2rem 0 0;
  font-style: italic;
}
.expansion-list {
  list-style: none;
  padding: 0;
  margin: 0 0 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.expansion-row {
  display: flex;
  gap: 0.5rem;
  font-size: 0.85rem;
  align-items: baseline;
}
.expansion-level {
  font-size: 0.7rem;
  opacity: 0.5;
  min-width: 2.2rem;
}
.expansion-drill-btn,
.related-chip {
  padding: 0.5rem 0.9rem;
  border-radius: 999px;
  border: 1px solid rgba(249, 115, 22, 0.5);
  background: rgba(249, 115, 22, 0.1);
  color: inherit;
  font-size: 0.8rem;
  cursor: pointer;
  margin: 0 0.35rem 0.35rem 0;
}
.related-block {
  display: flex;
  flex-wrap: wrap;
}
.drill-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  position: sticky;
  bottom: 0;
  padding-top: 0.5rem;
}
.drill-cta {
  flex: 1 1 30%;
  min-width: 6.5rem;
  padding: 0.75rem 0.5rem;
  border-radius: 999px;
  border: none;
  background: #f97316;
  color: white;
  font-weight: 700;
  font-size: 0.8rem;
  cursor: pointer;
}
.drill-cta.random {
  background: #c2410c;
}
.drill-cta.cue {
  background: #ea580c;
}
</style>
