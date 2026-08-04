import { useEffect, useState } from 'react'

export type Pot = { sol: number; usd: number | null }

export type Treasury = {
  hunt: Pot
  rips: Pot
  dev: Pot
  solPriceUsd: number | null
  fetchedAt: string
}

type Status = 'loading' | 'live' | 'unavailable'

/** Zelfde ritme als de prijsdata, zodat de pagina niet twee klokken heeft. */
const POLL_MS = 45_000

/**
 * Wat er nu in de twee fee-wallets staat.
 *
 * Mislukt het ophalen, dan blijft `status` op 'unavailable' en toont de sectie
 * niets in plaats van een nul. Een nul zou een bewering zijn — en een onjuiste,
 * want we wéten het dan niet.
 */
export function useTreasury() {
  const [data, setData] = useState<Treasury | null>(null)
  const [status, setStatus] = useState<Status>('loading')

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>

    async function load() {
      try {
        const res = await fetch('/api/treasury')
        if (!res.ok) throw new Error(String(res.status))
        const body = (await res.json()) as Treasury
        if (cancelled) return
        setData(body)
        setStatus('live')
      } catch {
        if (!cancelled) setStatus((s) => (s === 'live' ? 'live' : 'unavailable'))
      } finally {
        if (!cancelled) timer = setTimeout(load, POLL_MS)
      }
    }

    load()
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [])

  return { treasury: data, status }
}
