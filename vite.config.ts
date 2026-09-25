import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      // نخزّن كل الملفات مسبقًا ليعمل التطبيق بلا إنترنت
      workbox: { mode: 'development', globPatterns: ['**/*.{js,css,html,json,png,svg,mp3}'] },
      manifest: {
        name: 'أذان وأذكار',
        short_name: 'أذان',
        lang: 'ar',
        dir: 'rtl',
        start_url: '/',
        display: 'standalone',
        background_color: '#f3f6f4',
        theme_color: '#17263a',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      }
    })
  ],
  test: { environment: 'node' }
});
