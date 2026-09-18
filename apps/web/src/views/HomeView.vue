<script setup lang="ts">
import { ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useSpeakingPatternStore } from '../stores/speakingPattern';
import { googleLoginUrl } from '../api/client';
import { apiFetch } from '../api/client';
import type { ChunkDrillSummaryDto, ProgressCalendarResponseDto, ProgressSummaryResponseDto } from '../api/types';

const auth = useAuthStore();
const { user, status } = storeToRefs(auth);
const router = useRouter();
const speakingPatternStore = useSpeakingPatternStore();
const startingPatternDrill = ref(false);
const patternDrillError = ref<string | null>(null);

const summary = ref<ProgressSummaryResponseDto | null>(null);
const summaryError = ref<string | null>(null);
const chunkSummary = ref<ChunkDrillSummaryDto | null>(null);
const streak = ref(0);
const deleting = ref(false);
const deleteError = ref<string | null>(null);

async function handleDeleteAccount() {
  const confirmed = confirm(
    '정말 탈퇴하시겠습니까?\n학습 기록과 진행 상황이 영구적으로 삭제되며 복구할 수 없습니다.',
  );
  if (!confirmed) return;

  deleteError.value = null;
  deleting.value = true;
  try {
    await auth.deleteAccount();
  } catch (err) {
    deleteError.value = err instanceof Error ? err.message : '탈퇴 처리에 실패했습니다.';
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

// getCalendar's day-by-count data already existed for the "progress calendar"
// feature but nothing consumed it in the UI. Counting the consecutive days
// (from today, backwards) with at least one review gives a simple streak
// with no new backend work.
async function loadStreak() {
  try {
    const res = await apiFetch<ProgressCalendarResponseDto>('/progress/calendar?days=60');
    let count = 0;
    for (let i = res.days.length - 1; i >= 0; i--) {
      if (res.days[i].count <= 0) break;
      count += 1;
    }
    streak.value = count;
  } catch {
    streak.value = 0;
  }
}

// One-tap entry into a Speaking Pattern Core drill from Home, instead of
// Home -> Intent grid -> List -> Detail -> Drill (4 screens) for someone
// who just wants to practice, not browse. Prefers the learner's own
// favorites; falls back to the highest-priority patterns overall (the
// dataset's own curated ordering) when there are no favorites yet.
async function startQuickPatternDrill() {
  if (startingPatternDrill.value) return;
  patternDrillError.value = null;
  startingPatternDrill.value = true;
  try {
    await speakingPatternStore.loadPatterns({});
    const favorites = speakingPatternStore.patterns.filter((p) => p.favorite);
    const pool = favorites.length > 0 ? favorites : speakingPatternStore.patterns;
    if (pool.length === 0) {
      patternDrillError.value = '연습할 패턴이 없습니다.';
      return;
    }
    speakingPatternStore.startDrill(pool.slice(0, 5), 'cue');
    router.push('/speaking-patterns/drill');
  } catch (err) {
    patternDrillError.value = err instanceof Error ? err.message : '패턴을 불러오지 못했습니다.';
  } finally {
    startingPatternDrill.value = false;
  }
}

watch(
  user,
  (value) => {
    if (value) {
      loadSummary();
      loadChunkSummary();
      loadStreak();
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
      <section class="profile-row">
        <img v-if="user.profileImageUrl" :src="user.profileImageUrl" alt="" class="avatar" />
        <div class="profile-info">
          <p class="profile-name">{{ user.displayName ?? user.email }}</p>
          <p v-if="streak > 0" class="streak-badge">🔥 {{ streak }}일 연속</p>
        </div>
        <button class="ghost-btn" @click="auth.logout()">로그아웃</button>
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

      <button class="browse-btn ghost-btn" @click="router.push('/browse')">카테고리 / 검색으로 학습</button>

      <section class="feature-card" @click="router.push('/chunk-drill')">
        <div class="feature-heading">
          <span class="icon-chip">🗣️</span>
          <div>
            <p class="feature-title">Chunk 스피킹 드릴</p>
            <p class="feature-desc">회화에 자주 쓰이는 chunk를 쉐도잉으로 반복 연습</p>
          </div>
        </div>
        <p v-if="chunkSummary" class="feature-stat">
          {{ chunkSummary.practicedAtLeastOnce }}/{{ chunkSummary.total }} 연습함 · 오늘 {{ chunkSummary.practicedToday }}개
        </p>
      </section>

      <section class="feature-card" @click="router.push('/speaking-patterns')">
        <div class="feature-heading">
          <span class="icon-chip">🧩</span>
          <div>
            <p class="feature-title">Speaking Pattern Core</p>
            <p class="feature-desc">"It was difficult to ..." 같은 문장 골격을 통째로 익혀서 바로 발화</p>
          </div>
        </div>
        <button
          class="pattern-quick-start"
          :disabled="startingPatternDrill"
          @click.stop="startQuickPatternDrill"
        >
          {{ startingPatternDrill ? '불러오는 중...' : '⚡ 빠른 연습 시작' }}
        </button>
        <p v-if="patternDrillError" class="error">{{ patternDrillError }}</p>
      </section>

      <footer class="account-footer">
        <button class="danger-link" :disabled="deleting" @click="handleDeleteAccount">
          {{ deleting ? '탈퇴 처리 중...' : '탈퇴하기' }}
        </button>
        <p v-if="deleteError" class="error">{{ deleteError }}</p>
      </footer>
    </template>

    <section v-else class="card">
      <p class="intro">
        회화 표현·구동사·핵심 단어·비즈니스 영어, 엄선된 1,350개 표현을 간격반복(SRS) 복습으로
        익히는 스피킹 연습 서비스입니다. 로그인하면 학습 진행 상황이 기기 간에 그대로 이어집니다.
      </p>
      <a class="google-btn" :href="googleLoginUrl()">Google로 로그인</a>
      <p class="privacy-note">
        로그인 시 Google 계정의 이메일·이름·프로필 사진과, 서비스 이용 중 생성되는 학습 기록(복습 진행 상황
        등)을 저장합니다. 다른 목적으로 공유하지 않으며, 로그인 후 언제든 탈퇴를 통해 본인 데이터를
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
  gap: 1.1rem;
  padding: 2.5rem 1rem;
  max-width: 480px;
  margin: 0 auto;
}
.page h1 {
  font-size: 1.3rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  margin: 0 0 0.5rem;
  color: #eafff2;
  text-shadow: 0 0 18px rgba(0, 255, 65, 0.25);
}
.card {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  text-align: center;
}

/* Every card below shares the same "glass" surface recipe: a soft neutral
   tint lifted off the black background with a shadow, not a saturated
   color fill. Green is reserved for accents (icon chips, key numbers,
   borders, the one primary CTA), not whole-surface fills -- that's what
   read as flat/cheap at the previous heavier rgba(0,255,65,0.15) fill. */
.profile-row {
  width: 100%;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.9rem 1.1rem;
  background: linear-gradient(165deg, rgba(255, 255, 255, 0.055), rgba(255, 255, 255, 0.015));
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.4);
}
.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 2px solid rgba(0, 255, 65, 0.4);
  box-shadow: 0 0 12px rgba(0, 255, 65, 0.2);
  flex-shrink: 0;
}
.profile-info {
  flex: 1;
  min-width: 0;
  text-align: left;
}
.profile-name {
  margin: 0;
  font-weight: 600;
  font-size: 0.95rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.error {
  color: #f87171;
}
.streak-badge {
  display: inline-flex;
  align-items: center;
  margin: 0.3rem 0 0;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.3);
  font-size: 0.72rem;
  font-weight: 600;
  color: #fbbf24;
}
.account-footer {
  width: 100%;
  margin-top: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
}
.danger-link {
  border: none;
  background: none;
  color: rgba(248, 113, 113, 0.7);
  font-size: 0.7rem;
  padding: 0.25rem;
  text-decoration: underline;
}
.privacy-note {
  font-size: 0.7rem;
  opacity: 0.6;
  line-height: 1.5;
  max-width: 320px;
}
.intro {
  font-size: 0.9rem;
  line-height: 1.6;
  max-width: 340px;
  opacity: 0.85;
}
.google-btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  border-radius: 999px;
  background: #00ff41;
  box-shadow: 0 0 14px rgba(0, 255, 65, 0.55);
  color: #04120a;
  text-decoration: none;
  font-weight: 600;
}

/* Ghost/secondary buttons: thin border, no fill -- reserves solid green
   fill + glow for the one truly primary action (⚡ 빠른 연습 시작). */
.ghost-btn {
  padding: 0.55rem 1.1rem;
  border-radius: 999px;
  border: 1px solid rgba(0, 255, 65, 0.4);
  background: transparent;
  color: rgba(234, 255, 242, 0.9);
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
}
.summary-card {
  width: 100%;
  box-sizing: border-box;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  background: linear-gradient(165deg, rgba(255, 255, 255, 0.055), rgba(255, 255, 255, 0.015));
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.4);
  padding: 1.1rem 0.5rem;
}
.summary-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  border-left: 1px solid rgba(255, 255, 255, 0.07);
}
.summary-stat:first-child {
  border-left: none;
}
.summary-stat strong {
  font-size: 1.3rem;
  font-weight: 700;
  color: #eafff2;
}
.summary-stat span {
  font-size: 0.68rem;
  opacity: 0.6;
}
.mode-grid {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.7rem;
}
.mode-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.3rem;
  padding: 1rem;
  background: linear-gradient(165deg, rgba(255, 255, 255, 0.055), rgba(255, 255, 255, 0.015));
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-left: 2px solid rgba(0, 255, 65, 0.5);
  border-radius: 14px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);
  text-align: left;
  color: inherit;
  cursor: pointer;
}
.mode-label {
  font-weight: 700;
  font-size: 0.95rem;
}
.mode-desc {
  font-size: 0.72rem;
  opacity: 0.65;
  line-height: 1.4;
}
.browse-btn {
  width: 100%;
}
.feature-card {
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 1.1rem;
  background: linear-gradient(165deg, rgba(255, 255, 255, 0.055), rgba(255, 255, 255, 0.015));
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.4);
  cursor: pointer;
  text-align: left;
}
.feature-heading {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}
.icon-chip {
  flex-shrink: 0;
  width: 2.75rem;
  height: 2.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: rgba(0, 255, 65, 0.1);
  border: 1px solid rgba(0, 255, 65, 0.25);
  font-size: 1.3rem;
}
.feature-title {
  font-weight: 700;
  font-size: 0.95rem;
  margin: 0;
}
.feature-desc {
  font-size: 0.75rem;
  opacity: 0.65;
  line-height: 1.4;
  margin: 0.2rem 0 0;
}
.feature-stat {
  font-size: 0.72rem;
  opacity: 0.55;
  margin: 0;
}
.pattern-quick-start {
  align-self: flex-start;
  padding: 0.45rem 1rem;
  border-radius: 999px;
  border: none;
  background: #00ff41;
  box-shadow: 0 0 12px rgba(0, 255, 65, 0.45);
  color: #04120a;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
}
</style>
