import { site } from '../data/site'
import {
  isComplete,
  mascotStage,
  ownedTotal,
  pct,
  stages,
  targetTotal,
} from '../lib/collection'
import { num, shortDate } from '../lib/format'
import { useReveal } from '../hooks/useReveal'
import { Flame } from './Flame'
import { Mascot } from './Mascot'
import { Section } from './ui/Section'

export function Evolution() {
  /** Laat de balken pas vullen als je ze ziet, anders mis je de beweging. */
  const bars = useReveal<HTMLOListElement>()

  /**
   * De mascotte evolueert elke derde van de collectie. Bij 200 kaarten is dat
   * op 67 en op 134. Null zodra de laatste drempel gehaald is.
   */
  const nextEvolutionAt =
    [1, 2]
      .map((n) => Math.ceil((targetTotal * n) / stages.length))
      .find((threshold) => ownedTotal < threshold) ?? null

  return (
    <Section
      id="evolution"
      eyebrow="Evolution"
      title="Three stages. One finish line."
      lede="Three groups, filled at the same time. No order, no priority — we buy what we can get, and a pack decides for itself. The mascot evolves every third of the way through, and nothing here unlocks on a market cap."
    >
      <div className="mb-8 flex items-center gap-5 rounded-2xl border border-ash-800 bg-ash-900/40 p-6">
        <Mascot className="h-14 w-14 shrink-0" />
        <div>
          <p className="font-display text-lg font-bold tracking-tight">
            {mascotStage.stage} form
          </p>
          <p className="mt-1 text-sm leading-relaxed text-bone-300">
            {nextEvolutionAt === null
              ? 'Fully evolved. Every card from here on is the last stretch.'
              : `Evolves at ${num(nextEvolutionAt)} cards — ${num(nextEvolutionAt - ownedTotal)} to go.`}
          </p>
        </div>
      </div>

      <ol ref={bars.ref} className="space-y-4">
        {stages.map((s) => {
          const done = isComplete(s)
          const started = s.owned > 0
          const progress = pct(s.owned, s.total)

          return (
            <li
              key={s.key}
              className={`rounded-2xl border p-6 transition-colors sm:p-7 ${
                done
                  ? 'border-ember-700/60 bg-ember-600/5'
                  : started
                    ? 'border-ash-600 bg-ash-900/70'
                    : 'border-ash-800 bg-ash-900/40'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Flame
                    className={`h-5 w-5 ${started ? '' : 'opacity-30 grayscale'}`}
                  />
                  <h3 className="font-display text-xl font-bold tracking-tight">
                    {s.stage}
                  </h3>
                  <span className="text-sm text-bone-500">{s.pokemon}</span>
                </div>
                <span
                  className={`tnum rounded-full px-3 py-1 font-mono text-xs font-semibold ${
                    done
                      ? 'bg-ember-600 text-ash-950'
                      : started
                        ? 'bg-ash-700 text-ember-400'
                        : 'bg-ash-800 text-bone-500'
                  }`}
                >
                  {done ? 'Complete' : started ? 'In progress' : 'Nothing yet'}
                </span>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-bone-300">
                {s.blurb}
              </p>

              <div className="mt-5">
                <div
                  className="h-1.5 overflow-hidden rounded-full bg-ash-800"
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${s.stage} progress`}
                >
                  {/*
                    Vanaf nul laten lopen zodra de sectie in beeld komt. Zet je
                    de breedte meteen goed, dan is er niets te zien: de
                    transitie heeft geen beginwaarde om vanaf te vertrekken.
                  */}
                  <div
                    className="h-full rounded-full bg-ember-600 transition-[width] duration-1000 ease-out"
                    style={{ width: bars.shown ? `${progress}%` : '0%' }}
                  />
                </div>
                <p className="tnum mt-2 font-mono text-xs text-bone-500">
                  {num(s.owned)} of {num(s.total)} · {progress}%
                  {!done && ` · ${num(s.total - s.owned)} to go`}
                </p>
              </div>
            </li>
          )
        })}
      </ol>

      <p className="mt-8 text-xs leading-relaxed text-bone-500">
        Counted from {site.scope.source} on{' '}
        {shortDate(site.scope.snapshotDate)} and locked.{' '}
        <a
          href={site.scope.checklistUrl}
          className="text-ember-500 underline underline-offset-4 transition-colors hover:text-ember-400"
        >
          See all {num(targetTotal)}
        </a>
        .
      </p>
    </Section>
  )
}
