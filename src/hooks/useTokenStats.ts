import { useEffect, useState } from 'react'
import { site } from '../data/site'

export type TokenStats = {
  priceUsd: number | null
  marketCapUsd: number | null
  volume24hUsd: number | null
  change24hPct: number | null
  pairUrl: string | null
}

type Status = 'prelaunch' | 'loading' | 'live' | 'error'

type DexPair = {
  priceUsd?: string
  marketCap?: number
  fdv?: number
  liquidity?: { usd?: number }
  volume?: { h24?: number }
  priceChange?: { h24?: number }
  url?: string
}

const POLL_MS = 45_000
const ENDPOINT = 'https://api.dexscreener.com/latest/dex/tokens'

/** Kiest het pair met de diepste liquiditeit — dat is de betrouwbaarste prijsbron. */
function pickPair(pairs: DexPair[]): DexPair | null {
  if (pairs.length === 0) return null
  return pairs.reduce((best, p) =>
    (p.liquidity?.usd ?? 0) > (best.liquidity?.usd ?? 0) ? p : best,
  )
}

/**
 * Haalt live prijs- en marketcapdata op bij DexScreener (publiek, geen API key,
 * CORS-enabled). Zolang `site.tokenAddress` leeg is blijft de hook in
 * 'prelaunch' en tonen componenten een nette placeholder.
 */
export function useTokenStats() {
  const [stats, setStats] = useState<TokenStats | null>(null)
  const [status, setStatus] = useState<Status>(
    site.tokenAddress ? 'loading' : 'prelaunch',
  )

  useEffect(() => {
    if (!site.tokenAddress) return

    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout>
    let cancelled = false

    async function load() {
      try {
        const res = await fetch(`${ENDPOINT}/${site.tokenAddress}`, {
          signal: controller.signal,
        })
        if (!res.ok) throw new Error(`DexScreener returned ${res.status}`)

        const body: { pairs: DexPair[] | null } = await res.json()
        const pair = pickPair(body.pairs ?? [])
        if (cancelled) return

        if (!pair) {
          // Token bestaat, maar er is nog geen pair geïndexeerd.
          setStatus('error')
        } else {
          setStats({
            priceUsd: pair.priceUsd ? Number(pair.priceUsd) : null,
            marketCapUsd: pair.marketCap ?? pair.fdv ?? null,
            volume24hUsd: pair.volume?.h24 ?? null,
            change24hPct: pair.priceChange?.h24 ?? null,
            pairUrl: pair.url ?? null,
          })
          setStatus('live')
        }
      } catch (err) {
        if (!cancelled && (err as Error).name !== 'AbortError') {
          setStatus('error')
        }
      } finally {
        if (!cancelled) timer = setTimeout(load, POLL_MS)
      }
    }

    load()

    return () => {
      cancelled = true
      controller.abort()
      clearTimeout(timer)
    }
  }, [])

  return { stats, status }
}
