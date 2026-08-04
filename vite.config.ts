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
})
