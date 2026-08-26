<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useChunkDrillStore } from '../stores/chunkDrill';
import { apiFetch } from '../api/client';
import type { ChunkDrillSetResponseDto } from '../api/types';
import { speakTimes } from '../composables/useSpeech';

const router = useRouter();
const store = useChunkDrillStore();
const { current, index, total, isDone } = storeToRefs(store);

const loading = ref(true);
const error = ref<string | null>(null);
const repeatCount = ref<1 | 3 | 5>(3);

async function loadSet() {
  loading.value = true;
  error.value = null;
  try {
    const res = await apiFetch<ChunkDrillSetResponseDto>('/chunk-drill/set?size=20');
    store.start(res.items);
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Chunk 목록을 불러오지 못했습니다.';
  } finally {
    loading.value = false;
  }
}

onMounted(loadSet);

function playCurrent() {
  if (current.value) speakTimes(current.value.english, repeatCount.value);
}

// Auto-play each new card so the drill flows without a manual tap per card.
watch(current, (item) => {
  if (item) playCurrent();
});

function onNext() {
  store.next();
}

function goHome() {
  store.reset();
  router.push('/');
}
</script>

<template>
  <main class="drill-page">
    <header class="topbar">
      <button class="icon-btn" @click="goHome" aria-label="닫기">✕</button>
      <span v-if="total > 0" class="progress-label">{{ Math.min(index + 1, total) }} / {{ total }}</span>
    </header>

    <div v-if="loading" class="center">불러오는 중...</div>
    <div v-else-if="error" class="center error">{{ error }}</div>

    <div v-else-if="total === 0" class="center">
      <p>연습할 Chunk가 없습니다.</p>
      <button @click="goHome">홈으로</button>
    </div>

    <section v-else-if="isDone" class="center summary">
      <h2>드릴 완료!</h2>
      <p>{{ total }}개의 Chunk를 연습했습니다.</p>
      <button @click="goHome">홈으로</button>
    </section>

    <section v-else-if="current" class="card-area">
      <p class="mode-badge">🗣️ Chunk 스피킹 드릴 · {{ current.practiceCount + 1 }}번째 연습</p>

      <div class="card">
        <div class="english-row">
          <h2>{{ current.english }}</h2>
          <button class="icon-btn" @click="playCurrent" aria-label="발음 다시 듣기">🔊</button>
        </div>
        <p class="korean">{{ current.korean }}</p>
        <p class="example">{{ current.example }}</p>
      </div>

      <div class="repeat-picker">
        <span class="repeat-label">반복 재생</span>
        <button
          v-for="n in [1, 3, 5]"
          :key="n"
          type="button"
          class="repeat-btn"
          :class="{ active: repeatCount === n }"
          @click="repeatCount = n as 1 | 3 | 5"
        >
          {{ n }}회
        </button>
      </div>
    </section>

    <footer v-if="current" class="next-bar">
      <button class="next-btn" @click="onNext">따라 말했어요, 다음 ▶</button>
    </footer>
  </main>
</template>

<style scoped>
.drill-page {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  max-width: 480px;
  margin: 0 auto;
  padding-bottom: env(safe-area-inset-bottom);
}
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
}
.icon-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: inherit;
  cursor: pointer;
}
.progress-label {
  opacity: 0.7;
  font-size: 0.9rem;
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
}
.error {
  color: #f87171;
}
.card-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 1rem;
  gap: 1rem;
}
.mode-badge {
  font-size: 0.8rem;
  opacity: 0.6;
}
.card {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1rem;
}
.english-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.english-row h2 {
  font-size: 1.9rem;
  margin: 0;
}
.korean {
  font-size: 1.4rem;
  margin: 0;
}
.example {
  opacity: 0.75;
  margin: 0;
}
.repeat-picker {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
}
.repeat-label {
  font-size: 0.8rem;
  opacity: 0.6;
  margin-right: 0.25rem;
}
.repeat-btn {
  padding: 0.4rem 0.9rem;
  border-radius: 999px;
  border: 1px solid rgba(217, 119, 6, 0.5);
  background: transparent;
  color: inherit;
  cursor: pointer;
  font-size: 0.85rem;
}
.repeat-btn.active {
  background: rgba(217, 119, 6, 0.25);
  border-color: #d97706;
  font-weight: 600;
}
.next-bar {
  padding: 1rem;
}
.next-btn {
  width: 100%;
  padding: 1rem;
  border-radius: 999px;
  border: none;
  background: #d97706;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
}
button {
  padding: 0.6rem 1.2rem;
  border-radius: 999px;
  border: 1px solid #d97706;
  background: transparent;
  color: inherit;
  cursor: pointer;
}
</style>
