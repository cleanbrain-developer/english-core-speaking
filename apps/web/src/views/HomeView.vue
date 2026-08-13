<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '../stores/auth';
import { apiFetch, googleLoginUrl } from '../api/client';

const auth = useAuthStore();
const { user, status } = storeToRefs(auth);

const itemCount = ref<number | null>(null);
const itemCheckError = ref<string | null>(null);

async function checkLearningItems() {
  itemCheckError.value = null;
  try {
    const res = await apiFetch<{ items: unknown[]; total: number }>('/learning-items?limit=1');
    itemCount.value = res.total;
  } catch (err) {
    itemCheckError.value = err instanceof Error ? err.message : 'Unknown error';
  }
}

onMounted(() => {
  auth.fetchCurrentUser();
});
</script>

<template>
  <main class="page">
    <h1>Speaking Core 1350</h1>

    <section v-if="status === 'loading'" class="card">
      <p>Loading session...</p>
    </section>

    <section v-else-if="user" class="card">
      <img v-if="user.profileImageUrl" :src="user.profileImageUrl" alt="" class="avatar" />
      <p>{{ user.displayName ?? user.email }}</p>
      <p class="muted">{{ user.email }}</p>
      <button @click="auth.logout()">로그아웃</button>

      <hr />
      <button @click="checkLearningItems">학습 항목 API 연결 확인</button>
      <p v-if="itemCount !== null">Learning Items total: {{ itemCount }}</p>
      <p v-if="itemCheckError" class="error">{{ itemCheckError }}</p>
    </section>

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
  gap: 1.5rem;
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
  width: 64px;
  height: 64px;
  border-radius: 50%;
}
.muted {
  opacity: 0.7;
  font-size: 0.9rem;
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
</style>
