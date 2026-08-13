<script setup lang="ts">
import { ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { googleLoginUrl } from '../api/client';
import { apiFetch } from '../api/client';
import type { ProgressSummaryResponseDto } from '../api/types';

const auth = useAuthStore();
const { user, status } = storeToRefs(auth);
const router = useRouter();

const summary = ref<ProgressSummaryResponseDto | null>(null);
const summaryError = ref<string | null>(null);

const STUDY_MODES: Array<{ mode: 'daily' | 'due' | 'new' | 'weak'; label: string; description: string }> = [
  { mode: 'daily', label: '오늘의 30개', description: '복습 예정 우선, 부족하면 신규 항목' },
  { mode: 'due', label: '복습', description: '오늘 복습해야 할 항목' },
  { mode: 'new', label: '신규', description: '아직 학습하지 않은 항목' },
  { mode: 'weak', label: '취약 항목', description: '자주 틀리거나 난이도가 높은 항목' },
];

async function loadSummary() {
  summaryError.value = null;
  try {
    summary.value = await apiFetch<ProgressSummaryResponseDto>('/progress/summary');
  } catch (err) {
    summaryError.value = err instanceof Error ? err.message : '진행 상황을 불러오지 못했습니다.';
  }
}

watch(
  user,
  (value) => {
    if (value) loadSummary();
  },
  { immediate: true },
);
</script>

<template>
  <main class="page">
    <h1>Speaking Core 1350</h1>

    <section v-if="status === 'loading'" class="card">
      <p>Loading session...</p>
    </section>

    <template v-else-if="user">
      <section class="card">
        <img v-if="user.profileImageUrl" :src="user.profileImageUrl" alt="" class="avatar" />
        <p>{{ user.displayName ?? user.email }}</p>
        <button @click="auth.logout()">로그아웃</button>
      </section>

      <section v-if="summary" class="summary-card">
        <div class="summary-stat">
          <strong>{{ summary.total }}</strong><span>전체</span>
        </div>
        <div class="summary-stat">
          <strong>{{ summary.learned }}</strong><span>학습함</span>
        </div>
        <div class="summary-stat">
          <strong>{{ summary.due }}</strong><span>복습 대상</span>
        </div>
        <div class="summary-stat">
          <strong>{{ summary.today }}</strong><span>오늘 학습</span>
        </div>
      </section>
      <p v-else-if="summaryError" class="error">{{ summaryError }}</p>

      <section class="mode-grid">
        <button
          v-for="item in STUDY_MODES"
          :key="item.mode"
          class="mode-card"
          @click="router.push(`/study/${item.mode}`)"
        >
          <span class="mode-label">{{ item.label }}</span>
          <span class="mode-desc">{{ item.description }}</span>
        </button>
      </section>

      <button class="browse-btn" @click="router.push('/browse')">카테고리 / 검색으로 학습</button>
    </template>

    <section v-else class="card">
      <p>Google 계정으로 로그인하세요.</p>
      <a class="google-btn" :href="googleLoginUrl()">Google로 로그인</a>
    </section>
  </main>
</template>

<style scoped>
.page {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  padding: 2rem 1rem;
  max-width: 480px;
  margin: 0 auto;
}
.card {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  text-align: center;
}
.avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
}
.error {
  color: #f87171;
}
.google-btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  border-radius: 999px;
  background: #4f46e5;
  color: white;
  text-decoration: none;
  font-weight: 600;
}
button {
  padding: 0.6rem 1.2rem;
  border-radius: 999px;
  border: 1px solid #4f46e5;
  background: transparent;
  color: inherit;
  cursor: pointer;
}
.summary-card {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 14px;
  padding: 1rem 0.5rem;
}
.summary-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
}
.summary-stat strong {
  font-size: 1.25rem;
}
.summary-stat span {
  font-size: 0.7rem;
  opacity: 0.7;
}
.mode-grid {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}
.mode-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.35rem;
  padding: 1rem;
  border-radius: 14px;
  background: rgba(79, 70, 229, 0.15);
  border: 1px solid rgba(79, 70, 229, 0.4);
  text-align: left;
}
.mode-label {
  font-weight: 700;
  font-size: 1rem;
}
.mode-desc {
  font-size: 0.75rem;
  opacity: 0.75;
}
.browse-btn {
  width: 100%;
}
</style>
