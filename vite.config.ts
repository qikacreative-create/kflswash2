import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'prompt',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icon.svg'],
        manifest: {
          id: '/',
          name: 'Kafelas Wash',
          short_name: 'Kafelas Wash',
          description: 'Aplikasi Kasir, Antrean, dan Operasional Cuci Mobil, Motor & Auto Detailing',
          theme_color: '#800000',
          background_color: '#800000',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          globIgnores: [
            '**/*.zip',
            '**/*.af',
            '**/Paste_*',
            '**/vendor-xlsx-*.js',
            '**/vendor-pdf-*.js',
            '**/excelExport-*.js',
            '**/pdfExport-*.js',
            '**/ReportPdfModal-*.js',
            '**/purify.es-*.js',
          ],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          cleanupOutdatedCaches: true,
          navigateFallback: 'index.html',
          navigateFallbackDenylist: [
            /^\/api\//,
            /^\/assets\//,
            /^\/\.well-known\//,
            /\.(?:js|mjs|css|json|webmanifest|png|jpg|jpeg|svg|gif|webp|ico|woff2?)$/i,
          ],
          runtimeCaching: [
            {
              // Lazy-loaded JS chunks (Excel, PDF generator, secondary views)
              urlPattern: /\/assets\/.*\.js$/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'kafelas-chunks-cache',
                expiration: {
                  maxEntries: 80,
                  maxAgeSeconds: 30 * 24 * 60 * 60,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              // Aset gambar (logo, ikon PWA, favicon, foto portofolio/struk)
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'kafelas-images-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 30 * 24 * 60 * 60, // 30 hari
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              // Web Fonts (Google Fonts & CDN webfonts)
              urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'kafelas-fonts-cache',
                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 365 * 24 * 60 * 60, // 1 tahun
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': __dirname,
      },
      extensions: ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'],
    },
    build: {
      target: 'esnext',
      rollupOptions: {
        output: {
          manualChunks(id) {
            const normalizedId = id.replace(/\\/g, '/');
            if (normalizedId.includes('node_modules/firebase') || normalizedId.includes('node_modules/@firebase')) {
              return 'vendor-firebase';
            }
            if (normalizedId.includes('node_modules/react') || normalizedId.includes('node_modules/react-dom')) {
              return 'vendor-react';
            }
            if (normalizedId.includes('node_modules/lucide-react')) {
              return 'vendor-icons';
            }
            if (normalizedId.includes('node_modules/xlsx')) {
              return 'vendor-xlsx';
            }
            if (normalizedId.includes('node_modules/jspdf') || normalizedId.includes('node_modules/html2canvas')) {
              return 'vendor-pdf';
            }
          },
        },
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true as const,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
