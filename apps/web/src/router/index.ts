import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import StudyView from '../views/StudyView.vue';
import BrowseView from '../views/BrowseView.vue';
import ChunkDrillView from '../views/ChunkDrillView.vue';
import SpeakingPatternIntentView from '../views/SpeakingPatternIntentView.vue';
import SpeakingPatternListView from '../views/SpeakingPatternListView.vue';
import SpeakingPatternDetailView from '../views/SpeakingPatternDetailView.vue';
import SpeakingPatternDrillView from '../views/SpeakingPatternDrillView.vue';
import SpeakingPatternExpansionDrillView from '../views/SpeakingPatternExpansionDrillView.vue';
import { useAuthStore } from '../stores/auth';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/study/:mode', name: 'study', component: StudyView, meta: { requiresAuth: true } },
    { path: '/browse', name: 'browse', component: BrowseView, meta: { requiresAuth: true } },
    { path: '/chunk-drill', name: 'chunk-drill', component: ChunkDrillView, meta: { requiresAuth: true } },
    {
      path: '/speaking-patterns',
      name: 'speaking-patterns',
      component: SpeakingPatternIntentView,
      meta: { requiresAuth: true },
    },
    {
      path: '/speaking-patterns/list',
      name: 'speaking-patterns-list',
      component: SpeakingPatternListView,
      meta: { requiresAuth: true },
    },
    {
      path: '/speaking-patterns/pattern/:id',
      name: 'speaking-pattern-detail',
      component: SpeakingPatternDetailView,
      meta: { requiresAuth: true },
    },
    {
      path: '/speaking-patterns/drill',
      name: 'speaking-pattern-drill',
      component: SpeakingPatternDrillView,
      meta: { requiresAuth: true },
    },
    {
      path: '/speaking-patterns/drill/expansion/:id',
      name: 'speaking-pattern-expansion-drill',
      component: SpeakingPatternExpansionDrillView,
      meta: { requiresAuth: true },
    },
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
