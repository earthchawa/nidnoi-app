import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      pwaAssets: { image: 'public/icon.svg', preset: 'minimal-2023', overrideManifestIcons: true },
      manifest: {
        name: 'Nidnoi · Learn Thai daily',
        short_name: 'Nidnoi',
        description: 'Five useful Thai words a day for people living in Thailand.',
        lang: 'en',
        theme_color: '#12937A',
        background_color: '#F2F8F5',
        display: 'standalone',
        start_url: '/',
        scope: '/'
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        globIgnores: ['data/**'],
        runtimeCaching: [
          {
            // Lessons change daily: show the newest when online, the cached copy when offline.
            urlPattern: ({ url }) => url.pathname.startsWith('/data/'),
            handler: 'NetworkFirst',
            options: { cacheName: 'lessons', networkTimeoutSeconds: 4, expiration: { maxEntries: 500 } }
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'fonts', expiration: { maxEntries: 30 } }
          }
        ]
      }
    })
  ],
  test: {
    environment: 'node'
  }
});
