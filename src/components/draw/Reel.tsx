import { useEffect, useRef, useState } from 'react'
import type { Holder } from '../../lib/raffle'
import { shortWallet } from '../../lib/raffle'

export const CELL_W = 208
export const REEL_LEN = 80
export const WINNER_INDEX = 71

type Props = {
  reel: Holder[]
  /** Zet op true om de rol te laten lopen. */
  spinning: boolean
  /** Hoe lang de rol doorloopt, in ms. */
  durationMs: number
  /** Kleine afwijking binnen de cel zodat hij niet altijd exact centraal stopt. */
  jitterPx: number
  onSettled: () => void
}

export function Reel({
  reel,
  spinning,
  durationMs,
  jitterPx,
  onSettled,
}: Props) {
  const [offset, setOffset] = useState(-0.5 * CELL_W)
  const settledRef = useRef(false)

  // Via een ref, zodat een nieuwe callback-identiteit de animatie niet herstart.
  const onSettledRef = useRef(onSettled)
  onSettledRef.current = onSettled

  useEffect(() => {
    if (!spinning) {
      settledRef.current = false
      setOffset(-0.5 * CELL_W)
      return
    }

    // Eén frame wachten zodat de browser de starttoestand vastlegt voordat de
    // transitie begint; anders springt de rol er meteen heen.
    const frame = requestAnimationFrame(() => {
      setOffset(-((WINNER_INDEX + 0.5) * CELL_W) + jitterPx)
    })

    const timer = setTimeout(() => {
      if (!settledRef.current) {
        settledRef.current = true
        onSettledRef.current()
      }
    }, durationMs)

    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(timer)
    }
  }, [spinning, durationMs, jitterPx])

  return (
    <div className="relative overflow-hidden rounded-2xl border border-ash-700 bg-ash-900/70 py-8">
      {/* Vervaging aan beide randen, zodat de rol uit het niets lijkt te komen. */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-24 bg-gradient-to-r from-ash-950 to-transparent sm:w-40" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-24 bg-gradient-to-l from-ash-950 to-transparent sm:w-40" />

      {/* De middenmarkering waar de winnaar landt. */}
      <div className="pointer-events-none absolute inset-y-0 left-1/2 z-30 w-px -translate-x-1/2 bg-ember-500" />
      <div className="pointer-events-none absolute top-2 left-1/2 z-30 h-0 w-0 -translate-x-1/2 border-x-6 border-t-8 border-x-transparent border-t-ember-500" />
      <div className="pointer-events-none absolute bottom-2 left-1/2 z-30 h-0 w-0 -translate-x-1/2 border-x-6 border-b-8 border-x-transparent border-b-ember-500" />

      <div
        className="relative left-1/2 flex"
        style={{
          transform: `translateX(${offset}px)`,
          transition: spinning
            ? `transform ${durationMs}ms cubic-bezier(0.12, 0.75, 0.12, 1)`
            : 'none',
        }}
      >
        {reel.map((h, i) => (
          <div
            key={`${h.wallet}-${i}`}
            className="flex shrink-0 flex-col items-center justify-center gap-1 px-3"
            style={{ width: CELL_W }}
          >
            <div className="w-full rounded-xl border border-ash-700 bg-ash-800/70 px-4 py-5 text-center">
              <p className="font-mono text-base font-semibold text-bone-100">
                {shortWallet(h.wallet)}
              </p>
              <p className="tnum mt-1 font-mono text-xs text-bone-500">
                {h.balance.toLocaleString('en-US', {
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
