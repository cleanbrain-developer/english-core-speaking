<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useSpeakingPatternStore } from '../stores/speakingPattern';
import { speakingIntentLabel } from '../constants/speakingIntent';

const router = useRouter();
const store = useSpeakingPatternStore();

const loading = ref(true);
const error = ref<string | null>(null);

onMounted(async () => {
  loading.value = true;
  error.value = null;
  try {
    await store.loadIntents();
  } catch (err) {
    error.value = err instanceof Error ? err.message : '목록을 불러오지 못했습니다.';
  } finally {
    loading.value = false;
  }
});

function openIntent(intent: string) {
  router.push({ path: '/speaking-patterns/list', query: { intent } });
}
</script>

<template>
  <main class="page">
    <header class="topbar">
      <button class="icon-btn" aria-label="닫기" @click="router.push('/')">✕</button>
      <h1>Speaking Pattern Core</h1>
    </header>

    <p class="intro">
      문법 용어가 아니라 "무엇을 말하고 싶은지"로 찾아보세요. 하나의 문장 골격을 통째로 외워두면
      매번 문장을 처음부터 조립하지 않고 바로 말할 수 있어요.
    </p>

    <div v-if="loading" class="center">불러오는 중...</div>
    <div v-else-if="error" class="center error">
      <p>{{ error }}</p>
      <button @click="router.go(0)">다시 시도</button>
    </div>

    <ul v-else class="intent-list">
      <li v-for="item in store.intents" :key="item.speakingIntent" class="intent-row" @click="openIntent(item.speakingIntent)">
        <span class="intent-label">{{ speakingIntentLabel(item.speakingIntent) }}</span>
        <span class="intent-count">{{ item.total }}개</span>
      </li>
    </ul>
  </main>
</template>

<style scoped>
.page {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem 1rem 2rem;
  max-width: 480px;
  margin: 0 auto;
}
.topbar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.topbar h1 {
  font-size: 1.1rem;
  margin: 0;
}
.icon-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: inherit;
  cursor: pointer;
  padding: 0.25rem;
}
.intro {
  font-size: 0.85rem;
  opacity: 0.75;
  line-height: 1.5;
  margin: 0;
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
.intent-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.intent-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-radius: 14px;
  background: rgba(249, 115, 22, 0.12);
  border: 1px solid rgba(249, 115, 22, 0.35);
  cursor: pointer;
}
.intent-label {
  font-weight: 600;
}
.intent-count {
  font-size: 0.8rem;
  opacity: 0.65;
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
