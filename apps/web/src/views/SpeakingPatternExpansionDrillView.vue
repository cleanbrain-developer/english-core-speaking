<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSpeakingPatternStore } from '../stores/speakingPattern';
import { speak } from '../composables/useSpeech';

const route = useRoute();
const router = useRouter();
const store = useSpeakingPatternStore();

const loading = ref(true);
const error = ref<string | null>(null);
const stepIndex = ref(0);
const saving = ref(false);
const saveError = ref<string | null>(null);
const done = ref(false);

const id = computed(() => String(route.params.id));
const steps = computed(() => store.detail?.expansions ?? []);
const total = computed(() => steps.value.length);
const current = computed(() => steps.value[stepIndex.value] ?? null);

onMounted(async () => {
  loading.value = true;
  error.value = null;
  try {
    await store.loadDetail(id.value);
    if (!store.detail?.expansions?.length) {
      error.value = '이 패턴에는 Expansion 단계가 없습니다.';
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : '패턴을 불러오지 못했습니다.';
  } finally {
    loading.value = false;
  }
});

async function next() {
  if (stepIndex.value < total.value - 1) {
    stepIndex.value += 1;
    return;
  }
  done.value = true;
  saveError.value = null;
  saving.value = true;
  try {
    await store.practiceOne(id.value);
  } catch (err) {
    saveError.value = err instanceof Error ? err.message : '완료 처리에 실패했습니다.';
  } finally {
    saving.value = false;
  }
}

function goHome() {
  router.push('/');
}

async function retrySave() {
  saveError.value = null;
  saving.value = true;
  try {
    await store.practiceOne(id.value);
  } catch (err) {
    saveError.value = err instanceof Error ? err.message : '완료 처리에 실패했습니다.';
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <main class="drill-page">
    <header class="topbar">
      <button class="icon-btn" aria-label="닫기" @click="goHome">✕</button>
      <span v-if="total > 0" class="progress-label">Lv.{{ current?.level ?? total }} / {{ total }}</span>
    </header>

    <div v-if="loading" class="center">불러오는 중...</div>
    <div v-else-if="error" class="center error">
      <p>{{ error }}</p>
      <button @click="goHome">홈으로</button>
    </div>

    <section v-else-if="done" class="center summary">
      <h2>Expansion 완료!</h2>
      <p>가장 짧은 문장부터 가장 긴 문장까지 단계별로 확장해봤습니다.</p>
      <template v-if="saveError">
        <p class="error">저장에 실패했습니다: {{ saveError }}</p>
        <button :disabled="saving" @click="retrySave">
          {{ saving ? '재시도 중...' : '다시 저장' }}
        </button>
      </template>
      <button @click="goHome">홈으로</button>
    </section>

    <template v-else-if="current">
      <section class="card-area">
        <p class="mode-badge">🪜 Pattern Expansion</p>
        <p v-if="store.detail" class="base-meaning">{{ store.detail.koreanMeaning }}</p>
        <p class="instruction">짧은 문장에서 시작해서 점점 길게 확장하며 소리 내어 말해보세요.</p>
        <div class="card">
          <p class="expansion-pattern">{{ current.pattern }}</p>
          <p v-if="current.description" class="expansion-desc">{{ current.description }}</p>
          <button class="icon-btn" aria-label="발음 듣기" @click="speak(current.pattern)">🔊</button>
        </div>
      </section>

      <footer class="next-bar">
        <button class="next-btn" @click="next">
          {{ stepIndex < total - 1 ? '다음 단계로 확장 ▶' : '완료' }}
        </button>
      </footer>
    </template>
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
  font-size: 1.1rem;
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
.base-meaning {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
}
.instruction {
  font-size: 0.75rem;
  opacity: 0.55;
  margin: 0;
}
.card {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.75rem;
}
.expansion-pattern {
  font-size: 1.3rem;
  font-weight: 700;
  line-height: 1.5;
  margin: 0;
  color: #f97316;
}
.expansion-desc {
  font-size: 0.8rem;
  opacity: 0.65;
  margin: 0;
}
.next-bar {
  padding: 1rem;
}
.next-btn {
  width: 100%;
  padding: 1rem;
  border-radius: 999px;
  border: none;
  background: #f97316;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
}
button {
  padding: 0.6rem 1.2rem;
  border-radius: 999px;
  border: 1px solid #f97316;
  background: transparent;
  color: inherit;
  cursor: pointer;
}
</style>
