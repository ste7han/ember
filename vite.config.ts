import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * De API-endpoints draaien als Cloudflare Pages Functions en hebben een
 * Worker-omgeving nodig (D1, WebCrypto met Ed25519). Die kan Vite niet
 * nabootsen, dus `npm run dev` serveert alleen de site.
 *
 * Wil je de endpoints erbij, gebruik dan:
 *
 *   npm run dev:full
 *
 * Dat bouwt de site en start hem via Wrangler, inclusief een lokale D1. Trager
 * dan `npm run dev` — geen hot reload — maar het is wél dezelfde omgeving als
 * op Cloudflare, en dat is precies waar je de laatste verrassingen wilt
 * uitsluiten.
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],

  build: {
    /*
     * Een lijstje van bronbestand naar uitgerold bestand, als /manifest.json.
     *
     * Nodig omdat de kaartfoto's een hash in hun naam krijgen. De Telegram-bot
     * draait als Worker en kan niet in de map kijken, dus die zoekt hier op
     * welke foto bij welke checklist-id hoort. Zonder dit zou de bot de
     * bestandsnamen moeten raden, of zouden we de foto's een tweede keer
     * zonder hash moeten neerzetten en daarmee de cache-busting weggooien.
     */
    manifest: 'manifest.json',
  },
})
