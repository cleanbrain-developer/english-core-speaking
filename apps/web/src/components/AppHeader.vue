<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { fetchAllTimeCount, fetchTodayCount, recordVisitOnce } from '../lib/visitorCounter';

const todayCount = ref<number | null>(null);
const allTimeCount = ref<number | null>(null);

onMounted(async () => {
  await recordVisitOnce();
  todayCount.value = await fetchTodayCount();
  allTimeCount.value = await fetchAllTimeCount();
});
</script>

<template>
  <header class="app-header">
    <span class="brand">Speaking Core 1350</span>
    <span class="visitor-count">
      <template v-if="todayCount !== null">Today · {{ todayCount }}</template>
      <template v-if="todayCount !== null && allTimeCount !== null"> · </template>
      <template v-if="allTimeCount !== null">All · {{ allTimeCount }}</template>
    </span>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.25rem;
  border-bottom: 1px solid rgba(248, 250, 252, 0.1);
}

.brand {
  font-weight: 600;
  font-size: 0.95rem;
}

.visitor-count {
  font-size: 0.8rem;
  color: rgba(248, 250, 252, 0.7);
}
</style>
