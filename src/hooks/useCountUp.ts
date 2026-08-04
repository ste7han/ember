import { useEffect, useState } from 'react'

const prefersReducedMotion = () =>
  typeof matchMedia !== 'undefined' &&
  matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Telt op naar `target`. Puur cosmetisch.
 *
 * Met `enabled: false` blijft de teller op nul staan tot je hem aanzet — zo kun
 * je hem laten meelopen op het moment dat de sectie in beeld scrollt in plaats
 * van bij het laden van de pagina, waar niemand hem ziet.
 */
export function useCountUp(target: number, durationMs = 1600, enabled = true) {
  const [value, setValue] = useState(() =>
    prefersReducedMotion() ? target : 0,
  )

  useEffect(() => {
    if (!enabled) return
    if (prefersReducedMotion() || target === 0) {
      setValue(target)
      return
    }

    let frame = 0
    const start = performance.now()

    const tick = (now: number) => {
      const t = Math.min((now - start) / durationMs, 1)
      // easeOutExpo — snel op gang, zacht landend.
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
      setValue(Math.round(target * eased))
      if (t < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, durationMs, enabled])

  return value
}
