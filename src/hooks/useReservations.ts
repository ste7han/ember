import { useCallback, useEffect, useState } from 'react'

export type Reservation = { wallet: string; expiresIn: number }

type State = {
  /** Per kaart-id wie hem vasthoudt en hoeveel seconden nog. */
  reservations: Record<string, Reservation>
  /** Is er überhaupt een database ingesteld? Zonder KV geen sloten. */
  configured: boolean
  loading: boolean
}

const POLL_MS = 20_000

/** Onthoudt in deze browser welke kaarten jij hebt gereserveerd. */
const MINE_KEY = 'ember:my-reservations'

function readMine(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(MINE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

/**
 * Houdt bij welke kaarten vastliggen.
 *
 * Het echte slot zit in Redis (`SET ... NX`, atomisch). Deze hook is alleen de
 * weergave ervan: hij pollt de stand en telt er lokaal per seconde vanaf, zodat
 * de klok loopt zonder dat we elke seconde het netwerk op moeten.
 */
export function useReservations() {
  const [state, setState] = useState<State>({
    reservations: {},
    configured: false,
    loading: true,
  })
  const [mine, setMine] = useState<Record<string, string>>(() =>
    typeof window === 'undefined' ? {} : readMine(),
  )

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/reservations')
      const data = await res.json()
      setState({
        reservations: data.reservations ?? {},
        configured: Boolean(data.configured),
        loading: false,
      })
    } catch {
      setState((s) => ({ ...s, loading: false }))
    }
  }, [])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, POLL_MS)
    return () => clearInterval(id)
  }, [refresh])

  // Lokaal aftellen tussen twee pollrondes door, zodat de klok niet stilstaat.
  useEffect(() => {
    const id = setInterval(() => {
      setState((s) => {
        const next: Record<string, Reservation> = {}
        let changed = false
        for (const [key, r] of Object.entries(s.reservations)) {
          const expiresIn = r.expiresIn - 1
          if (expiresIn <= 0) {
            changed = true
            continue
          }
          next[key] = { ...r, expiresIn }
          changed = true
        }
        return changed ? { ...s, reservations: next } : s
      })
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const reserve = useCallback(
    async (offerId: string, wallet: string) => {
      const res = await fetch('/api/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId, wallet }),
      })
      const data = await res.json()

      if (res.ok) {
        const updated = { ...readMine(), [offerId]: wallet }
        localStorage.setItem(MINE_KEY, JSON.stringify(updated))
        setMine(updated)
        setState((s) => ({
          ...s,
          reservations: {
            ...s.reservations,
            [offerId]: { wallet, expiresIn: data.expiresIn },
          },
        }))
        return { ok: true as const }
      }

      // 409 = iemand was eerder. Meteen de stand bijwerken, anders blijft de
      // knop uitnodigend staan terwijl hij niets meer kan doen.
      if (data.wallet) {
        setState((s) => ({
          ...s,
          reservations: {
            ...s.reservations,
            [offerId]: { wallet: data.wallet, expiresIn: data.expiresIn },
          },
        }))
      }
      return { ok: false as const, error: data.error as string | undefined }
    },
    [],
  )

  return { ...state, mine, reserve }
}
