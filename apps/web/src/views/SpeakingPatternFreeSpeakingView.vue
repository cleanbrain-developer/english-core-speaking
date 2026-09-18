<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useSpeakingPatternStore } from '../stores/speakingPattern';
import { speak } from '../composables/useSpeech';
import { FREE_SPEAKING_PROMPTS } from '../constants/freeSpeakingPrompts';

const router = useRouter();
const store = useSpeakingPatternStore();

const loading = ref(true);
const error = ref<string | null>(null);
const promptIndex = ref(Math.floor(Math.random() * FREE_SPEAKING_PROMPTS.length));

onMounted(async () => {
  loading.value = true;
  error.value = null;
  try {
    // Needs the full 119-pattern dataset loaded (not just one family) to
    // resolve every prompt's recommended pattern ids -- prompts deliberately
    // mix patterns from several families.
    await store.loadPatterns({});
  } catch (err) {
    error.value = err instanceof Error ? err.message : '패턴을 불러오지 못했습니다.';
  } finally {
    loading.value = false;
  }
});

const currentPrompt = computed(() => FREE_SPEAKING_PROMPTS[promptIndex.value]);

const recommendedPatterns = computed(() => {
  const byId = new Map(store.patterns.map((p) => [p.id, p]));
  return currentPrompt.value.recommendedPatternIds.map((id) => byId.get(id)).filter((p): p is NonNullable<typeof p> => !!p);
});

function nextPrompt() {
  // Avoid repeating the same prompt twice in a row when there's more than one.
  if (FREE_SPEAKING_PROMPTS.length <= 1) return;
  let next = promptIndex.value;
  while (next === promptIndex.value) next = Math.floor(Math.random() * FREE_SPEAKING_PROMPTS.length);
  promptIndex.value = next;
}

function goHome() {
  router.push('/');
}
</script>

<template>
  <main class="page">
    <header class="topbar">
      <button class="icon-btn" aria-label="닫기" @click="goHome">✕</button>
      <span class="mode-badge">🗣️ Free Speaking</span>
    </header>

    <div v-if="loading" class="center">불러오는 중...</div>
    <div v-else-if="error" class="center error">
      <p>{{ error }}</p>
      <button @click="goHome">홈으로</button>
    </div>

    <template v-else>
      <section class="cue-card">
        <p class="cue-label">주제</p>
        <p class="cue-text">{{ currentPrompt.cue }}</p>
        <p class="instruction">정답은 없습니다. 아래 추천 패턴을 참고해서 자유롭게 소리 내어 말해보세요.</p>
      </section>

      <section class="recommended-section">
        <h2 class="section-title">추천 패턴</h2>
        <ul class="pattern-list">
          <li v-for="p in recommendedPatterns" :key="p.id" class="pattern-row">
            <div class="pattern-main">
              <span class="pattern-text">{{ p.pattern }}</span>
              <button class="icon-btn" aria-label="발음 듣기" @click="speak(p.examples[0]?.english ?? p.pattern)">🔊</button>
            </div>
            <p class="pattern-meaning">{{ p.koreanMeaning }}</p>
          </li>
        </ul>
      </section>

      <footer class="next-bar">
        <button class="next-btn" @click="nextPrompt">다른 주제 ▶</button>
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
  font-size: 1.1rem;
  color: inherit;
  cursor: pointer;
}
.mode-badge {
  font-size: 0.8rem;
  opacity: 0.6;
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
.cue-card {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1.1rem;
  border-radius: 14px;
  background: rgba(0, 255, 65, 0.12);
  border: 1px solid rgba(0, 255, 65, 0.35);
}
.cue-label {
  font-size: 0.7rem;
  opacity: 0.6;
  margin: 0;
}
.cue-text {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  line-height: 1.4;
}
.instruction {
  font-size: 0.75rem;
  opacity: 0.6;
  margin: 0;
}
.section-title {
  font-size: 0.85rem;
  opacity: 0.6;
  margin: 0 0 0.5rem;
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
  padding: 0.7rem 0.9rem;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.pattern-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}
.pattern-text {
  font-weight: 600;
  font-size: 0.9rem;
}
.pattern-meaning {
  font-size: 0.78rem;
  opacity: 0.65;
  margin: 0.2rem 0 0;
}
.next-bar {
  padding-top: 0.5rem;
}
.next-btn {
  width: 100%;
  padding: 1rem;
  border-radius: 999px;
  border: none;
  background: #00ff41;
  box-shadow: 0 0 14px rgba(0, 255, 65, 0.55);
  color: #04120a;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
}
button {
  cursor: pointer;
}
</style>
