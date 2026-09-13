<script setup lang="ts">
import { ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { googleLoginUrl } from '../api/client';
import { apiFetch } from '../api/client';
import type { ChunkDrillSummaryDto, ProgressSummaryResponseDto } from '../api/types';

const auth = useAuthStore();
const { user, status } = storeToRefs(auth);
const router = useRouter();

const summary = ref<ProgressSummaryResponseDto | null>(null);
const summaryError = ref<string | null>(null);
const chunkSummary = ref<ChunkDrillSummaryDto | null>(null);
const deleting = ref(false);
const deleteError = ref<string | null>(null);

async function handleDeleteAccount() {
  const confirmed = confirm(
    '정말 계정을 삭제하시겠습니까?\n학습 기록과 진행 상황이 영구적으로 삭제되며 복구할 수 없습니다.',
  );
  if (!confirmed) return;

  deleteError.value = null;
  deleting.value = true;
  try {
    await auth.deleteAccount();
  } catch (err) {
    deleteError.value = err instanceof Error ? err.message : '계정을 삭제하지 못했습니다.';
  } finally {
    deleting.value = false;
  }
}

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

async function loadChunkSummary() {
  try {
    chunkSummary.value = await apiFetch<ChunkDrillSummaryDto>('/chunk-drill/summary');
  } catch {
    chunkSummary.value = null;
  }
}

watch(
  user,
  (value) => {
    if (value) {
      loadSummary();
      loadChunkSummary();
    }
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
        <button class="danger-link" :disabled="deleting" @click="handleDeleteAccount">
          {{ deleting ? '삭제 중...' : '계정 삭제' }}
        </button>
        <p v-if="deleteError" class="error">{{ deleteError }}</p>
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

      <section class="chunk-drill-card" @click="router.push('/chunk-drill')">
        <div class="chunk-drill-heading">
          <span class="chunk-drill-icon">🗣️</span>
          <div>
            <p class="chunk-drill-title">Chunk 스피킹 드릴</p>
            <p class="chunk-drill-desc">회화에 자주 쓰이는 chunk를 쉐도잉으로 반복 연습</p>
          </div>
        </div>
        <p v-if="chunkSummary" class="chunk-drill-stat">
          {{ chunkSummary.practicedAtLeastOnce }}/{{ chunkSummary.total }} 연습함 · 오늘 {{ chunkSummary.practicedToday }}개
        </p>
      </section>
    </template>

    <section v-else class="card">
      <p class="intro">
        회화 표현·구동사·핵심 단어·비즈니스 영어, 엄선된 1,350개 표현을 간격반복(SRS) 복습으로
        익히는 스피킹 연습 서비스입니다. 로그인하면 학습 진행 상황이 기기 간에 그대로 이어집니다.
      </p>
      <a class="google-btn" :href="googleLoginUrl()">Google로 로그인</a>
      <p class="privacy-note">
        로그인 시 Google 계정의 이메일·이름·프로필 사진과, 서비스 이용 중 생성되는 학습 기록(복습 진행 상황
        등)을 저장합니다. 다른 목적으로 공유하지 않으며, 로그인 후 언제든 "계정 삭제"로 본인 데이터를
        영구적으로 삭제할 수 있습니다.
      </p>
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
.danger-link {
  border: none;
  background: none;
  color: #f87171;
  font-size: 0.75rem;
  padding: 0.25rem;
  text-decoration: underline;
}
.privacy-note {
  font-size: 0.7rem;
  opacity: 0.65;
  line-height: 1.4;
  max-width: 320px;
}
.intro {
  font-size: 0.9rem;
  line-height: 1.5;
  max-width: 340px;
  opacity: 0.9;
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
.chunk-drill-card {
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  border-radius: 14px;
  background: rgba(217, 119, 6, 0.15);
  border: 1px solid rgba(217, 119, 6, 0.45);
  cursor: pointer;
  text-align: left;
}
.chunk-drill-heading {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.chunk-drill-icon {
  font-size: 1.5rem;
}
.chunk-drill-title {
  font-weight: 700;
  margin: 0;
}
.chunk-drill-desc {
  font-size: 0.75rem;
  opacity: 0.75;
  margin: 0.15rem 0 0;
}
.chunk-drill-stat {
  font-size: 0.75rem;
  opacity: 0.7;
  margin: 0;
}
</style>
