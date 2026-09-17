<script setup lang="ts">
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { useSpeakingPatternStore } from '../stores/speakingPattern';
import { speak } from '../composables/useSpeech';

const router = useRouter();
const store = useSpeakingPatternStore();
const { currentDrillItem, drillIndex, drillTotal, isDrillDone, drillMode, advancing, completing, finishError } =
  storeToRefs(store);

const revealed = ref(false);
const filledSentence = ref<string | null>(null);

function goHome() {
  store.resetDrill();
  router.push('/');
}

function onSpeak() {
  if (!currentDrillItem.value) return;
  speak(currentDrillItem.value.examples[0]?.english ?? currentDrillItem.value.pattern);
}

// The primary slot (first one) is what the learner is actively drilling --
// tapping a chip fills it in. Any OTHER slots on a multi-slot pattern (e.g.
// "It was difficult for [PERSON] to [ACTION].") are auto-filled with that
// slot's own first example so the resulting sentence is always a complete,
// grammatical one to say out loud, never left with a literal "[ACTION]" in
// it -- which is what a naive single-bracket replace produced before.
function fillPattern(item: NonNullable<typeof currentDrillItem.value>, primaryValue: string): string {
  let result = item.pattern;
  item.slots.forEach((slot, i) => {
    const value = i === 0 ? primaryValue : (slot.examples?.[0] ?? slot.placeholder ?? slot.key);
    result = result.replace(`[${slot.key}]`, value);
  });
  return result;
}

function pickSlotExample(value: string) {
  if (!currentDrillItem.value) return;
  const sentence = fillPattern(currentDrillItem.value, value);
  filledSentence.value = sentence;
  speak(sentence);
}

async function onNext() {
  revealed.value = false;
  filledSentence.value = null;
  await store.nextDrillItem();
}

const firstSlot = computed(() => currentDrillItem.value?.slots[0] ?? null);
</script>

<template>
  <main class="drill-page">
    <header class="topbar">
      <button class="icon-btn" aria-label="닫기" @click="goHome">✕</button>
      <span v-if="drillTotal > 0" class="progress-label">{{ Math.min(drillIndex + 1, drillTotal) }} / {{ drillTotal }}</span>
    </header>

    <div v-if="drillTotal === 0" class="center">
      <p>진행할 드릴이 없습니다.</p>
      <button @click="goHome">홈으로</button>
    </div>

    <section v-else-if="isDrillDone" class="center summary">
      <h2>드릴 완료!</h2>
      <p>{{ drillTotal }}개 패턴을 연습했습니다.</p>
      <template v-if="finishError">
        <p class="error">저장에 실패했습니다: {{ finishError }}</p>
        <button :disabled="completing" @click="store.finishDrill()">
          {{ completing ? '재시도 중...' : '다시 저장' }}
        </button>
      </template>
      <button @click="goHome">홈으로</button>
    </section>

    <template v-else-if="currentDrillItem">
      <section class="card-area">
        <p class="mode-badge">{{ drillMode === 'slot' ? '🧩 Slot Replacement' : '🇰🇷 Korean Cue' }}</p>

        <template v-if="drillMode === 'cue'">
          <div class="card">
            <p class="korean-cue">{{ currentDrillItem.koreanMeaning }}</p>
            <p class="instruction">먼저 소리 내어 영어로 말해본 다음 확인하세요.</p>
            <template v-if="revealed">
              <p class="pattern-text">{{ currentDrillItem.pattern }}</p>
              <p v-if="currentDrillItem.examples[0]" class="example-text">{{ currentDrillItem.examples[0].english }}</p>
              <button class="icon-btn" aria-label="발음 듣기" @click="onSpeak">🔊</button>
            </template>
            <button v-else class="reveal-btn" @click="revealed = true">정답 확인</button>
          </div>
        </template>

        <template v-else>
          <div class="card">
            <p class="korean-cue small">{{ currentDrillItem.koreanMeaning }}</p>
            <p class="pattern-text">{{ currentDrillItem.pattern }}</p>
            <p class="instruction">빈칸을 채워서 소리 내어 말해보세요.</p>
            <p v-if="filledSentence" class="filled-preview">{{ filledSentence }}</p>
            <div v-if="firstSlot?.examples?.length" class="slot-chips">
              <button v-for="opt in firstSlot.examples" :key="opt" class="slot-chip" @click="pickSlotExample(opt)">
                {{ opt }}
              </button>
            </div>
            <button class="icon-btn" aria-label="원문 발음 듣기" @click="onSpeak">🔊 예문 듣기</button>
          </div>
        </template>
      </section>

      <footer class="next-bar">
        <button class="next-btn" :disabled="advancing" @click="onNext">
          {{ advancing ? '...' : '따라 말했어요, 다음 ▶' }}
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
.card {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.9rem;
}
.korean-cue {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
}
.korean-cue.small {
  font-size: 1rem;
  font-weight: 500;
  opacity: 0.7;
}
.instruction {
  font-size: 0.75rem;
  opacity: 0.55;
  margin: 0;
}
.pattern-text {
  font-size: 1.4rem;
  font-weight: 700;
  margin: 0;
  color: #f97316;
}
.example-text {
  opacity: 0.75;
  margin: 0;
}
.filled-preview {
  font-size: 1.1rem;
  font-weight: 600;
  opacity: 0.9;
  margin: 0;
}
.reveal-btn {
  align-self: flex-start;
  padding: 0.7rem 1.4rem;
  border-radius: 999px;
  border: 1px solid #f97316;
  background: transparent;
  color: inherit;
  cursor: pointer;
}
.slot-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}
.slot-chip {
  padding: 0.5rem 0.9rem;
  border-radius: 999px;
  border: 1px solid rgba(249, 115, 22, 0.5);
  background: rgba(249, 115, 22, 0.1);
  color: inherit;
  font-size: 0.85rem;
  cursor: pointer;
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
.next-btn:disabled {
  opacity: 0.6;
  cursor: default;
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
