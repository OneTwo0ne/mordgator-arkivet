import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Repo hostas på GitHub Pages som projektsajt: OneTwo0ne.github.io/mordgator-pwa/
// base måste därför matcha repo-namnet. Hash-routing används så att djuplänkar funkar.
const BASE = '/mordgator-pwa/'

// https://vite.dev/config/
export default defineConfig({
  base: BASE,
  plugins: [
    vue(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // Offline behövs inte i nuläget. Vi gör appen installerbar och låter
      // service workern hålla app-skalet uppdaterat, men cachar inte aggressivt.
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        navigateFallback: null,
        cleanupOutdatedCaches: true,
      },
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Mordgåtor — Digitalt utredningsarkiv',
        short_name: 'Mordgåtor',
        description:
          'Ett digitalt utredningsarkiv för mordgåtor och detektivfall. Spelledare och spelare analyserar dokument, foton och förhör för att lösa fallet.',
        lang: 'sv',
        theme_color: '#2b2b28',
        background_color: '#e8e6e0',
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
