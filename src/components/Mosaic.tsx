import type { CSSProperties } from 'react'
import type { ChecklistRow, StageKey } from '../data/types'
import { useReveal } from '../hooks/useReveal'
import { isOwned, photoFor, rowsFor, stages } from '../lib/collection'
import { num } from '../lib/format'

/**
 * Eén vakje per druk, vormgegeven als een ruilkaart.
 *
 * Let op wat hier bewust NIET gebeurt: dit is niet het Pokémon-kaarttemplate.
 * Dat ontwerp — de gele rand, de HP-plaatsing, de attack-boxen, de
 * energiesymbolen — is beschermd werk, net als de illustratie erop. Wat je hier
 * ziet is de algemene bouw die élke ruilkaart deelt: rand, art window,
 * tekstbalk. Die structuur is van het genre, niet van één uitgever, en de
 * uitvoering is ons eigen palet.
 *
 * Zodra we een kaart écht bezitten kan er een eigen foto in het art window.
 * Dat is de enige echte kaart die hier ooit te zien is, en die mag, omdat het
 * onze eigen kaart is.
 *
 * `title` doet het tooltipwerk. Bewust geen eigen tooltip-component: 200 stuks
 * met eigen state en positionering is veel machinerie voor iets dat de browser
 * gratis en toegankelijk doet.
 */
function Slot({ row, index }: { row: ChecklistRow; index: number }) {
  const have = isOwned(row)
  const photo = have ? photoFor(row) : undefined
  const label = `${row.card} · ${row.set}${row.number ? ` · ${row.number}` : ''}`

  return (
    <li
      title={`${label}${have ? '' : ' — still missing'}`}
      aria-label={`${label}, ${have ? 'owned' : 'missing'}`}
      // --i bepaalt wanneer dit vakje in de golf meedoet.
      style={{ '--i': index } as CSSProperties}
      className={`mosaic-tile group relative aspect-[63/88] overflow-hidden rounded-[3px] p-[0.1rem] transition-colors ${
        have
          ? 'bg-ember-500 shadow-[0_0_10px_-2px_var(--color-ember-600)]'
          : 'bg-ash-700/70 hover:bg-ash-600'
      }`}
    >
      {/* Art window: het bovenste vlak, waar bij een echte kaart de illustratie zit. */}
      <span
        className={`block h-[62%] w-full overflow-hidden rounded-[1px] ${
          have ? 'bg-ember-700/70' : 'bg-ash-900'
        }`}
      >
        {photo && (
          <img
            src={photo}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
          />
        )}
      </span>

      {/* Tekstbalk: de onderste strook van een kaart. */}
      <span
        className={`mt-[0.1rem] block h-[calc(38%-0.1rem)] w-full rounded-[1px] ${
          have ? 'bg-ember-600/60' : 'bg-ash-900/70'
        }`}
      />
    </li>
  )
}

function StageBand({
  stageKey,
  offset,
}: {
  stageKey: StageKey
  /** Doorlopend volgnummer over alle fases, zodat de golf niet per band herstart. */
  offset: number
}) {
  const stage = stages.find((s) => s.key === stageKey)!
  const rows = rowsFor(stageKey)

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="font-display text-sm font-bold tracking-tight">
          {stage.stage}
          <span className="ml-2 font-sans font-normal text-bone-500">
            {stage.pokemon}
          </span>
        </h3>
        <p className="tnum font-mono text-xs text-bone-500">
          {num(stage.owned)}/{num(stage.total)}
        </p>
      </div>

      <ul className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(1.15rem,1fr))] gap-1.5 sm:grid-cols-[repeat(auto-fill,minmax(1.6rem,1fr))]">
        {rows.map((row, i) => (
          <Slot key={row.id} row={row} index={offset + i} />
        ))}
      </ul>
    </div>
  )
}

/**
 * Alle 200 drukken als muur. Dit is dezelfde informatie als de
 * voortgangsbalken, maar dan zo dat je in één oogopslag ziet hoe groot de
 * opgave werkelijk is — en hoe ver we zijn.
 */
export function Mosaic() {
  // Eigen waarnemer: de golf moet starten als de vákjes in beeld komen, niet
  // als de sectiekop dat doet — die staat honderden pixels hoger.
  const wave = useReveal<HTMLDivElement>()

  let offset = 0
  return (
    <div
      ref={wave.ref}
      className={`space-y-8 ${wave.shown ? 'mosaic-wave mosaic-wave-in' : 'mosaic-wave'}`}
    >
      {stages.map((s) => {
        const start = offset
        offset += s.total
        return <StageBand key={s.key} stageKey={s.key} offset={start} />
      })}
    </div>
  )
}

/** Legenda, los zodat we hem alleen tonen waar hij iets toevoegt. */
export function MosaicLegend() {
  return (
    <p className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-xs text-bone-500">
      <span className="flex items-center gap-2">
        <span className="h-4 w-[0.65rem] rounded-[2px] bg-ember-500 p-[0.05rem]">
          <span className="block h-[62%] w-full rounded-[1px] bg-ember-700/70" />
        </span>
        In the binder
      </span>
      <span className="flex items-center gap-2">
        <span className="h-4 w-[0.65rem] rounded-[2px] bg-ash-700/70 p-[0.05rem]">
          <span className="block h-[62%] w-full rounded-[1px] bg-ash-900" />
        </span>
        Still missing
      </span>
      <span className="text-bone-500/70">Hover a tile for the card.</span>
    </p>
  )
}
