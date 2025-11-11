import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const apiProxyTarget = env.VITE_API_PROXY_TARGET || env.VITE_API_URL || 'http://localhost:8000';

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'pwa-icon.svg', 'robots.txt', 'offline.html'],
        manifest: {
          name: 'Virtual Pet App',
          short_name: 'VirtualPet',
          description: 'Care for your virtual companion, manage finances, and explore AI-driven adventures.',
          theme_color: '#ffffff',
          background_color: '#ffffff',
          display: 'standalone',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: 'pwa-icon.svg',
              sizes: '192x192',
              type: 'image/svg+xml',
            },
            {
              src: 'pwa-icon.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
            },
          ],
        },
        workbox: {
          cleanupOutdatedCaches: true,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,mp3}'],
          navigateFallback: '/offline.html',
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.mode === 'navigate',
              handler: 'NetworkFirst',
              options: {
                cacheName: 'companion-pages',
                networkTimeoutSeconds: 4,
                expiration: {
                  maxEntries: 32,
                  maxAgeSeconds: 60 * 60 * 24,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/(.+\.)?supabase\.co\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'supabase-data',
                expiration: {
                  maxEntries: 64,
                  maxAgeSeconds: 60 * 60 * 24,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https?:\/\/localhost:8000\/api\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-data',
                expiration: {
                  maxEntries: 64,
                  maxAgeSeconds: 60 * 60,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      sourcemap: true,
      outDir: 'dist',
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('scheduler')) {
                return 'react-vendors';
              }
              if (id.includes('recharts')) {
                return 'recharts';
              }
              if (id.includes('@supabase')) {
                return 'supabase';
              }
              if (id.includes('framer-motion')) {
                return 'framer-motion';
              }
              if (id.includes('lucide-react')) {
                return 'icons';
              }
            }
            return undefined;
          },
        },
      },
      chunkSizeWarningLimit: 600,
    },
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/setupTests.ts',
      css: true,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'lcov', 'html'],
        reportsDirectory: './coverage/frontend',
        include: [
          'src/pages/budget/**/*',
          'src/pages/feed/FeedScreen.tsx',
          'src/pages/minigames/FetchGame.tsx',
          'src/services/profileService.ts',
        ],
        exclude: ['**/__tests__/**'],
        thresholds: {
          statements: 85,
          branches: 80,
          functions: 85,
          lines: 85,
        },
      },
    },
  };
});

