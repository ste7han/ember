import type { CSSProperties } from 'react'

/**
 * Opstijgende vonken achter de mascotte.
 *
 * Bewust deterministisch: de posities komen uit een vaste formule op de index,
 * niet uit Math.random(). Daardoor ziet iedereen hetzelfde beeld en verspringt
 * er niets bij een re-render. Het gouden-ratio-sprongetje (0.618) verdeelt de
 * waarden netjes over het bereik zonder dat je zichtbare rijtjes krijgt.
 */
const SPARKS = 24

const spread = (i: number, step: number) => ((i * step) % 1000) / 1000

export function Embers({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      {Array.from({ length: SPARKS }, (_, i) => {
        const a = spread(i, 618)
        const b = spread(i, 382)
        const c = spread(i, 236)

        const size = 1.5 + b * 3
        const style: CSSProperties & Record<string, string | number> = {
          left: `${6 + a * 88}%`,
          bottom: `${-4 + c * 26}%`,
          width: `${size}px`,
          height: `${size}px`,
          '--spark-duration': `${6 + b * 7}s`,
          '--spark-delay': `${-(a * 9).toFixed(2)}s`,
          '--spark-drift': `${(c * 5 - 2.5).toFixed(2)}rem`,
          '--spark-opacity': (0.35 + b * 0.45).toFixed(2),
        }

        return (
          <span
            key={i}
            style={style}
            className="ember-spark absolute rounded-full bg-ember-400 opacity-0"
          />
        )
      })}
    </div>
  )
}
