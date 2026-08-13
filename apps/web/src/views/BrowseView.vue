<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { apiFetch } from '../api/client';
import { useStudyStore } from '../stores/study';
import type { LearningItemDto, QueueResponse } from '../api/types';
import { speak } from '../composables/useSpeech';
import { CATEGORIES, CATEGORY_SHORT_LABELS } from '../constants/category';

const PAGE_SIZE = 50;
const STUDY_SESSION_MAX = 200; // backend's per-request cap (see ListLearningItemsDto)

const router = useRouter();
const studyStore = useStudyStore();

const category = ref<string>('');
const search = ref('');
const items = ref<LearningItemDto[]>([]);
const total = ref(0);
const loading = ref(false);
const loadingMore = ref(false);
const revealedIds = ref<Set<number>>(new Set());
// List view by default (뜻 항상 표시); toggling to quiz mode hides all and
// lets each row be tapped to reveal individually.
const showAllKorean = ref(true);

const sentinel = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | undefined;
let searchTimer: ReturnType<typeof setTimeout> | undefined;

function buildParams(limit: number, offset: number) {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (category.value) params.set('category', category.value);
  if (search.value.trim()) params.set('search', search.value.trim());
  return params;
}

async function reload() {
  loading.value = true;
  revealedIds.value = new Set();
  try {
    const res = await apiFetch<QueueResponse>(`/learning-items?${buildParams(PAGE_SIZE, 0)}`);
    items.value = res.items;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
}

async function loadMore() {
  if (loadingMore.value || loading.value || items.value.length >= total.value) return;
  loadingMore.value = true;
  try {
    const res = await apiFetch<QueueResponse>(`/learning-items?${buildParams(PAGE_SIZE, items.value.length)}`);
    items.value = [...items.value, ...res.items];
  } finally {
    loadingMore.value = false;
  }
}

watch(category, reload);
watch(search, () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(reload, 300);
});

onMounted(() => {
  reload();
  observer = new IntersectionObserver((entries) => {
    if (entries[0]?.isIntersecting) loadMore();
  });
  if (sentinel.value) observer.observe(sentinel.value);
});

onBeforeUnmount(() => observer?.disconnect());

function toggleReveal(id: number) {
  if (showAllKorean.value) return;
  const next = new Set(revealedIds.value);
  next.has(id) ? next.delete(id) : next.add(id);
  revealedIds.value = next;
}

function toggleListMode() {
  showAllKorean.value = !showAllKorean.value;
  revealedIds.value = new Set();
}

async function startStudy(shuffled: boolean) {
  // Independent of the paginated list on screen — always pulls the full
  // filtered set (capped at the backend's per-request max) so "학습 시작"
  // works correctly before the user scrolls through everything.
  const res = await apiFetch<QueueResponse>(`/learning-items?${buildParams(STUDY_SESSION_MAX, 0)}`);
  if (res.items.length === 0) return;
  const list = shuffled ? [...res.items].sort(() => Math.random() - 0.5) : res.items;
  await studyStore.start('category', list);
  router.push('/study/session');
}
</script>

<template>
  <main class="browse-page">
    <header class="topbar">
      <button class="icon-btn" @click="router.push('/')" aria-label="닫기">✕</button>
      <span class="total-label">{{ total }}개</span>
    </header>

    <div class="filters">
      <select v-model="category">
        <option value="">전체 카테고리</option>
        <option v-for="c in CATEGORIES" :key="c" :value="c">{{ CATEGORY_SHORT_LABELS[c] }}</option>
      </select>
      <input v-model="search" type="search" placeholder="영어 또는 한국어 검색" />
    </div>

    <div class="actions">
      <button @click="startStudy(false)" :disabled="total === 0">순서대로 학습</button>
      <button @click="startStudy(true)" :disabled="total === 0">랜덤 학습</button>
      <button @click="toggleListMode">{{ showAllKorean ? '뜻 가리기' : '뜻 보이기' }}</button>
    </div>

    <p v-if="loading" class="center">불러오는 중...</p>

    <ul class="item-list">
      <li v-for="item in items" :key="item.id" class="item-row" @click="toggleReveal(item.id)">
        <div class="item-main">
          <span class="category-tag">{{ CATEGORY_SHORT_LABELS[item.category] ?? item.category }}</span>
          <span class="english">{{ item.english }}</span>
          <button class="icon-btn" @click.stop="speak(item.english)" aria-label="발음 듣기">🔊</button>
        </div>
        <p v-if="showAllKorean || revealedIds.has(item.id)" class="korean">{{ item.korean }}</p>
      </li>
    </ul>
    <p v-if="!loading && items.length === 0" class="center">검색 결과가 없습니다.</p>
    <p v-else-if="loadingMore" class="center">더 불러오는 중...</p>
    <p v-else-if="!loading && items.length >= total" class="center muted">모두 불러왔습니다 ({{ total }}개)</p>
    <div ref="sentinel" class="scroll-sentinel" />
  </main>
</template>

<style scoped>
.browse-page {
  min-height: 100dvh;
  max-width: 480px;
  margin: 0 auto;
  padding: 0 1rem 2rem;
}
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
}
.icon-btn {
  background: none;
  border: none;
  font-size: 1.1rem;
  color: inherit;
  cursor: pointer;
}
.total-label {
  opacity: 0.7;
  font-size: 0.9rem;
}
.filters {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}
.filters select,
.filters input {
  flex: 1;
  padding: 0.6rem;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: transparent;
  color: inherit;
}
.filters select {
  /* The dropdown popup is native-rendered (often a light background
     regardless of page theme), so force readable option colors explicitly. */
  color-scheme: light dark;
}
.filters select option {
  color: #111827;
  background: #ffffff;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.actions button {
  flex: 1 1 auto;
  min-width: 8rem;
  padding: 0.6rem;
  border-radius: 999px;
  border: 1px solid #4f46e5;
  background: transparent;
  color: inherit;
  cursor: pointer;
}
.actions button:disabled {
  opacity: 0.4;
}
.center {
  text-align: center;
  opacity: 0.7;
  padding: 0.5rem 0;
}
.center.muted {
  font-size: 0.8rem;
}
.item-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.item-row {
  padding: 0.75rem;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  cursor: pointer;
}
.item-main {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.category-tag {
  flex-shrink: 0;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  background: rgba(79, 70, 229, 0.25);
  color: #c7d2fe;
}
.english {
  flex: 1;
  font-weight: 600;
}
.korean {
  margin: 0.4rem 0 0;
  opacity: 0.8;
}
.scroll-sentinel {
  height: 1px;
}
</style>
