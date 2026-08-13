<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useStudyStore, RATING_LABELS } from '../stores/study';
import { apiFetch } from '../api/client';
import type { QueueResponse, StudyMode } from '../api/types';
import { speak } from '../composables/useSpeech';
import { categoryLabel } from '../constants/category';

const QUEUE_ENDPOINTS: Record<string, string> = {
  daily: '/study/daily',
  due: '/study/due',
  new: '/study/new',
  weak: '/study/weak',
};

const route = useRoute();
const router = useRouter();
const studyStore = useStudyStore();
const { current, revealed, index, total, isDone, results } = storeToRefs(studyStore);

const loading = ref(true);
const error = ref<string | null>(null);
const recallInput = ref('');

const modeParam = computed(() => String(route.params.mode ?? ''));

async function loadQueue() {
  const endpoint = QUEUE_ENDPOINTS[modeParam.value];
  if (!endpoint) {
    // "session" mode: caller (BrowseView) already populated the store.
    loading.value = false;
    return;
  }
  loading.value = true;
  error.value = null;
  try {
    const res = await apiFetch<QueueResponse>(`${endpoint}?limit=30`);
    await studyStore.start(modeParam.value as StudyMode, res.items);
  } catch (err) {
    error.value = err instanceof Error ? err.message : '학습 항목을 불러오지 못했습니다.';
  } finally {
    loading.value = false;
  }
}

onMounted(loadQueue);

function onReveal() {
  studyStore.reveal();
}

async function onRate(rating: 1 | 2 | 3 | 4) {
  recallInput.value = '';
  await studyStore.rate(rating);
}

function onSpeak() {
  if (current.value) speak(current.value.english);
}

function goHome() {
  studyStore.reset();
  router.push('/');
}

const ratingSummary = computed(() => {
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
  for (const r of results.value) counts[r.rating] += 1;
  return counts;
});
</script>

<template>
  <main class="study-page">
    <header class="topbar">
      <button class="icon-btn" @click="goHome" aria-label="닫기">✕</button>
      <span v-if="total > 0" class="progress-label">{{ Math.min(index + 1, total) }} / {{ total }}</span>
    </header>

    <div v-if="loading" class="center">불러오는 중...</div>
    <div v-else-if="error" class="center error">{{ error }}</div>

    <div v-else-if="total === 0" class="center">
      <p>학습할 항목이 없습니다.</p>
      <button @click="goHome">홈으로</button>
    </div>

    <section v-else-if="isDone" class="center summary">
      <h2>학습 완료!</h2>
      <p>{{ total }}개 항목을 복습했습니다.</p>
      <ul class="summary-list">
        <li v-for="n in [1, 2, 3, 4]" :key="n">{{ RATING_LABELS[n as 1 | 2 | 3 | 4] }}: {{ ratingSummary[n] }}</li>
      </ul>
      <button @click="goHome">홈으로</button>
    </section>

    <section v-else-if="current" class="card-area">
      <p class="category-badge">{{ categoryLabel(current.category) }}</p>

      <div class="card">
        <div class="english-row">
          <h2>{{ current.english }}</h2>
          <button class="icon-btn" @click="onSpeak" aria-label="발음 듣기">🔊</button>
        </div>

        <template v-if="!revealed">
          <textarea
            v-model="recallInput"
            class="recall-input"
            placeholder="뜻을 말하거나 입력해 보세요 (선택)"
            rows="2"
          />
          <button class="reveal-btn" @click="onReveal">정답 확인</button>
        </template>

        <template v-else>
          <p class="korean">{{ current.korean }}</p>
          <p class="example">{{ current.example }}</p>
          <p v-if="recallInput" class="recall-echo">내 입력: {{ recallInput }}</p>
        </template>
      </div>
    </section>

    <footer v-if="current && revealed" class="rating-bar">
      <button class="rating-btn again" :disabled="studyStore.submitting" @click="onRate(1)">다시</button>
      <button class="rating-btn hard" :disabled="studyStore.submitting" @click="onRate(2)">어려움</button>
      <button class="rating-btn good" :disabled="studyStore.submitting" @click="onRate(3)">보통</button>
      <button class="rating-btn easy" :disabled="studyStore.submitting" @click="onRate(4)">쉬움</button>
    </footer>
  </main>
</template>

<style scoped>
.study-page {
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
.card-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 1rem;
  gap: 0.75rem;
}
.category-badge {
  font-size: 0.8rem;
  opacity: 0.6;
}
.card {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.english-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.english-row h2 {
  font-size: 1.75rem;
  margin: 0;
}
.recall-input {
  width: 100%;
  box-sizing: border-box;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: transparent;
  color: inherit;
  padding: 0.75rem;
  font-size: 1rem;
  resize: vertical;
}
.reveal-btn {
  padding: 1rem;
  border-radius: 999px;
  border: none;
  background: #4f46e5;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
}
.korean {
  font-size: 1.5rem;
  margin: 0;
}
.example {
  opacity: 0.75;
  margin: 0;
}
.recall-echo {
  opacity: 0.6;
  font-size: 0.9rem;
}
.rating-bar {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
  padding: 1rem;
}
.rating-btn {
  padding: 1rem 0;
  border-radius: 12px;
  border: none;
  color: white;
  font-weight: 600;
  cursor: pointer;
}
.rating-btn:disabled {
  opacity: 0.5;
}
.rating-btn.again {
  background: #dc2626;
}
.rating-btn.hard {
  background: #ea580c;
}
.rating-btn.good {
  background: #2563eb;
}
.rating-btn.easy {
  background: #16a34a;
}
.summary-list {
  list-style: none;
  padding: 0;
  opacity: 0.8;
}
</style>
