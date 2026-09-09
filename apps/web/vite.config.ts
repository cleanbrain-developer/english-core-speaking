import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'Speaking Core 1350',
        short_name: 'Speaking 1350',
        description: 'Mobile-first English speaking study app',
        theme_color: '#4f46e5',
        background_color: '#0f172a',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
        // Workbox's generated NavigationRoute defaults to allowlist: [/./],
        // denylist: [] -- i.e. it intercepts *every* navigation request
        // (request.mode === 'navigate') and serves the cached index.html,
        // regardless of path. That silently swallowed backend routes that
        // the browser navigates to directly, most importantly the Google
        // OAuth redirect chain: GET /api/auth/google (a 302 to Google) and
        // GET /api/auth/google/callback (the redirect back) were both
        // being served index.html by the service worker instead of ever
        // reaching NestJS. Denylisting the whole /api/ prefix excludes all
        // backend routes -- including /api/health and /api/auth/me, which
        // are normally fetch()'d (mode: 'cors'/'same-origin', not
        // affected) rather than navigated to, but are excluded too in case
        // they're ever opened directly in a tab (e.g. for debugging).
        navigateFallbackDenylist: [/^\/api\//],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
