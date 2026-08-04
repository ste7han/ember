import { mascotStage } from '../lib/collection'
import type { StageKey } from '../data/types'

/**
 * De mascotte in drie gedaantes. Eigen vorm, bewust geen Nintendo-artwork — het
 * is één vlam die groeit, geen Pokémon.
 *
 * Welke gedaante je ziet hangt af van de voortgang over de héle collectie, niet
 * van welke fase "aan de beurt" is: er is geen volgorde. Zie `mascotStage` in
 * src/lib/collection.ts.
 *
 * De tongen zijn dezelfde vorm, geschaald en verplaatst. Dat houdt de drie
 * gedaantes herkenbaar als familie zonder drie keer handmatig bezierwerk.
 */
const TONGUE =
  'M12 1.4c3.6 4.3 6.6 7.6 6.6 11.9a6.6 6.6 0 0 1-13.2 0c0-2.5 1.1-4.5 2.7-6.4.5 1 1.1 1.9 2 2.5.4-3.2 1-5.6 1.9-8z'

const CORE =
  'M12 12.6c1.5 1.8 2.5 3 2.5 4.6a2.5 2.5 0 0 1-5 0c0-1.6 1-2.8 2.5-4.6z'

/**
 * Elke gedaante is een lijstje transforms. De eerste is de hoofdvlam en krijgt
 * ook de lichte kern; de rest zijn kleinere tongen eromheen. De tongen staan
 * bewust ver genoeg opzij, anders vallen ze achter de hoofdvlam en zie je op
 * klein formaat geen verschil tussen de drie gedaantes.
 */
const SHAPES: Record<StageKey, string[]> = {
  ember: [''],
  flame: ['translate(-1.4 0) scale(0.9)', 'translate(13.6 9.6) scale(0.42)'],
  inferno: [
    'translate(-1.6 -0.6) scale(0.86)',
    'translate(13.8 8.4) scale(0.46)',
    'translate(1.6 11.4) scale(0.34)',
  ],
}

export function Mascot({
  className = 'h-10 w-10',
  stage = mascotStage.key,
  silhouette = false,
}: {
  className?: string
  /** Overschrijf de gedaante, bv. om alle drie naast elkaar te tonen. */
  stage?: StageKey
  /**
   * Vlakke vulling zonder lichte kern, voor gebruik als achtergrondvorm. Op
   * lage dekking wordt die kern anders een grauwe vlek in plaats van vuur.
   */
  silhouette?: boolean
}) {
  const [main, ...tongues] = SHAPES[stage]
  const fill = silhouette ? 'var(--color-ember-600)' : 'url(#mascotOuter)'

  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      role="img"
      aria-label={`Ember mascot, ${stage} form`}
    >
      {tongues.map((transform) => (
        <path
          key={transform}
          d={TONGUE}
          transform={transform}
          fill={fill}
          opacity={silhouette ? 1 : 0.8}
        />
      ))}
      <path d={TONGUE} transform={main} fill={fill} />
      {!silhouette && (
        <path d={CORE} transform={main} fill="url(#mascotInner)" />
      )}
      {!silhouette && (
        <defs>
          <linearGradient id="mascotOuter" x1="12" y1="1.4" x2="12" y2="20">
            <stop stopColor="#ffb347" />
            <stop offset="0.55" stopColor="#ff6b1a" />
            <stop offset="1" stopColor="#e0530a" />
          </linearGradient>
          <linearGradient id="mascotInner" x1="12" y1="12.6" x2="12" y2="20">
            <stop stopColor="#fff6e0" />
            <stop offset="1" stopColor="#ffb347" />
          </linearGradient>
        </defs>
      )}
    </svg>
  )
}
