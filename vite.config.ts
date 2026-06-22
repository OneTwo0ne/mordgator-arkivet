import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// "Arkivet" hostas på GitHub Pages som projektsajt:
// OneTwo0ne.github.io/mordgator-arkivet/
// base måste därför matcha repo-namnet. Hash-routing används så att djuplänkar funkar.
const BASE = '/mordgator-arkivet/'

// https://vite.dev/config/
export default defineConfig({
  base: BASE,
  plugins: [
    vue(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // Offline behövs inte. Vi precachar därför INGET och kör "nätverket först"
      // för allt — så att en ny deploy alltid slår igenom direkt vid laddning
      // (ingen gammal cachad version). Appen förblir installerbar via manifestet
      // och fetch-hanteraren nedan. Cache används bara som reserv om nätet fallerar.
      workbox: {
        globPatterns: [],
        navigateFallback: null,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'arkivet-runtime',
              networkTimeoutSeconds: 4,
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 7,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Arkivet — Mordgåtor',
        short_name: 'Arkivet',
        description:
          'Ett digitalt utredningsarkiv för mordgåtor och detektivfall. Spelledare och spelare analyserar dokument, foton och förhör för att lösa fallet.',
        lang: 'sv',
        theme_color: '#15120c',
        background_color: '#15120c',
        display: 'standalone',
        start_url: BASE,
        scope: BASE,
        icons: [
          {
            src: 'pwa-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
    }),
  ],
})
