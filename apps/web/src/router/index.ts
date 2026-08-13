import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import StudyView from '../views/StudyView.vue';
import BrowseView from '../views/BrowseView.vue';
import { useAuthStore } from '../stores/auth';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/study/:mode', name: 'study', component: StudyView, meta: { requiresAuth: true } },
    { path: '/browse', name: 'browse', component: BrowseView, meta: { requiresAuth: true } },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  if (auth.status === 'idle') {
    await auth.fetchCurrentUser();
  }
  if (to.meta.requiresAuth && !auth.user) {
    return { path: '/' };
  }
  return true;
});
