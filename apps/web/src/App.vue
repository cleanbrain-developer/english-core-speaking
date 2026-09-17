<script setup lang="ts">
import AppHeader from './components/AppHeader.vue';
</script>

<template>
  <AppHeader />
  <router-view />
</template>

<style>
:root {
  color-scheme: dark;
  background-color: #1c1917;
  color: #f8fafc;
  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
}
body {
  margin: 0;
}
</style>
