import { existsSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Draait alles in `api/` ook tijdens `npm run dev`.
 *
 * Zonder dit bestaan die routes alleen op Vercel, en dan test je ze pas voor
 * het eerst op productie — precies het moment waarop je er niet achter wilt
 * komen dat een sleutel niet klopt.
 *
 * Lokaal lees je de variabelen uit je shell:
 *   SOLANA_RPC_URL=... EMBER_MINT=... KV_REST_API_URL=... npm run dev
 */
function apiRoutes(): Plugin {
  return {
    name: 'ember-api-routes',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const path = (req.url ?? '').split('?')[0]
        if (!path.startsWith('/api/')) return next()

        const name = path.slice('/api/'.length)
        // Bestanden met een underscore zijn hulpmodules, geen routes — zelfde
        // regel als Vercel hanteert.
        if (!/^[\w-]+$/.test(name) || name.startsWith('_')) return next()

        const file = `api/${name}.js`
        if (!existsSync(file)) return next()

        // Body inlezen; Vercel doet dit zelf, de dev-server niet.
        const chunks: Buffer[] = []
        for await (const chunk of req) chunks.push(chunk as Buffer)
        const raw = Buffer.concat(chunks).toString('utf8')

        const shim = {
          status(code: number) {
            res.statusCode = code
            return shim
          },
          setHeader(k: string, v: string) {
            res.setHeader(k, v)
            return shim
          },
          json(body: unknown) {
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(body))
          },
        }

        try {
          const { default: handler } = await server.ssrLoadModule(`/${file}`)
          await handler({ method: req.method, body: raw || undefined }, shim)
        } catch (err) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: (err as Error).message }))
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), apiRoutes()],
})
