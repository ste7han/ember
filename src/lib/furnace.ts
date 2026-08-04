import raw from '../data/furnace.json'
import type { FurnaceOffer } from '../data/types'

export const furnace = raw as FurnaceOffer[]

/**
 * In welke toestand een aanbod zich bevindt. Afgeleid, nooit ingetypt — anders
 * kan de site iets anders beweren dan de datum en de claim aangeven.
 *
 * - `claimed`  — iemand heeft verbrand en de kaart gehad
 * - `open`     — te claimen, geen deadline
 * - `closing`  — te claimen, de klok loopt
 * - `expired`  — het venster is verlopen zonder claim, gaat naar de trekking
 * - `giveaway` — nooit claimbaar geweest, gaat rechtstreeks naar de trekking
 */
export type OfferPhase = 'claimed' | 'open' | 'closing' | 'expired' | 'giveaway'

export function phaseOf(offer: FurnaceOffer, now: number): OfferPhase {
  if (offer.claim) return 'claimed'
  if (offer.mode === 'giveaway') return 'giveaway'
  if (!offer.burnDeadline) return 'open'
  return Date.parse(offer.burnDeadline) > now ? 'closing' : 'expired'
}

/** Milliseconden tot het venster sluit, of null als er geen venster is. */
export function msLeft(offer: FurnaceOffer, now: number): number | null {
  if (!offer.burnDeadline) return null
  return Math.max(0, Date.parse(offer.burnDeadline) - now)
}

/** "2d 04:11" — kort genoeg voor naast een kaart, precies genoeg om te vertrouwen. */
export function countdown(ms: number): string {
  const total = Math.floor(ms / 1000)
  const d = Math.floor(total / 86400)
  const h = Math.floor((total % 86400) / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return d > 0 ? `${d}d ${pad(h)}:${pad(m)}` : `${pad(h)}:${pad(m)}:${pad(s)}`
}

/** Alles wat nu nog te claimen is. */
export const claimable = (now: number) =>
  furnace.filter((o) => {
    const p = phaseOf(o, now)
    return p === 'open' || p === 'closing'
  })
