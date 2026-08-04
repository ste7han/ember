import { site } from '../data/site'
import {
  collection,
  currentSetGoesToHolder,
  isComplete,
  overallPct,
  ownedTotal,
  pct,
  stages,
  stagesComplete,
  targetTotal,
} from '../lib/collection'
import { useCountUp } from '../hooks/useCountUp'
import { useTokenStats } from '../hooks/useTokenStats'
import { compactUsd, num, shortDate, usd } from '../lib/format'
import { Embers } from './Embers'
import { Flame } from './Flame'
import { Mascot } from './Mascot'

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono text-[0.65rem] tracking-[0.18em] text-bone-500 uppercase">
        {label}
      </span>
      <span className="tnum font-display text-xl font-bold sm:text-2xl">
        {value}
      </span>
    </div>
  )
}

/**
 * Eén regel per fase. Alle drie even prominent: er is geen "actieve" fase,
 * omdat we niet op volgorde verzamelen.
 */
function StageRow({
  stage,
  pokemon,
  owned,
  total,
  done,
}: {
  stage: string
  pokemon: string
  owned: number
  total: number
  done: boolean
}) {
  const started = owned > 0

  return (
    <li className="flex items-center gap-3 py-2">
      <Flame
        className={`h-3.5 w-3.5 shrink-0 ${started ? '' : 'opacity-25 grayscale'}`}
      />
      <span
        className={`w-16 shrink-0 font-display text-sm font-bold ${
          done ? 'text-ember-400' : 'text-bone-300'
        }`}
      >
        {stage}
      </span>
      <span className="hidden w-24 shrink-0 text-xs text-bone-500 sm:inline">
        {pokemon}
      </span>
      <div className="h-1 flex-1 overflow-hidden rounded-full bg-ash-800">
        <div
          className={`h-full rounded-full ${done ? 'bg-ember-400' : 'bg-ember-600'}`}
          style={{ width: `${pct(owned, total)}%` }}
        />
      </div>
      <span className="tnum w-16 shrink-0 text-right font-mono text-xs text-bone-500">
        {num(owned)}/{num(total)}
      </span>
    </li>
  )
}

export function Hero() {
  const owned = useCountUp(ownedTotal)
  const { stats, status } = useTokenStats()

  return (
    <section id="top" className="relative overflow-hidden">
      <div className="glow-ember pointer-events-none absolute inset-x-0 top-0 h-[36rem]" />

      {/*
        De mascotte staat achter de tekst en schaalt mee met het scherm. Op
        mobiel zou hij de kolom platdrukken, dus daar tonen we hem niet — de
        vonken blijven wel, die kosten geen ruimte.
      */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-20 -right-20 hidden w-[24rem] opacity-[0.16] blur-[0.5px] lg:block xl:-right-8 xl:w-[28rem]"
      >
        <Mascot className="h-auto w-full" silhouette />
      </div>
      <Embers className="h-[42rem]" />

      <div className="relative mx-auto max-w-5xl px-5 pt-16 pb-20 sm:px-8 sm:pt-24 sm:pb-28">
        <div className="inline-flex items-center gap-2 rounded-full border border-ash-700 bg-ash-900/60 px-4 py-1.5">
          <Flame className="h-3.5 w-3.5" />
          <span className="text-xs font-medium text-bone-300">
            {site.feeSplit.hunt + site.feeSplit.rips}% of creator fees buy cards
          </span>
        </div>

        <div className="mt-10 sm:mt-14">
          <p className="tnum font-display text-[4.5rem] leading-[0.82] font-extrabold tracking-[-0.04em] text-flame sm:text-[7.5rem] lg:text-[9rem]">
            {num(owned)}
            <span className="text-bone-500/40"> / {num(targetTotal)}</span>
          </p>
          <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight uppercase sm:text-4xl">
            The Charmander line
          </h1>

          <p
            className={`mt-4 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold ${
              currentSetGoesToHolder
                ? 'border-ember-700/60 bg-ember-600/10 text-ember-400'
                : 'border-ash-700 bg-ash-900/60 text-bone-300'
            }`}
          >
            Set {String(collection.currentSet).padStart(2, '0')}
            <span className="font-normal text-bone-500">
              {currentSetGoesToHolder
                ? 'goes to a holder when it’s done'
                : 'ours to keep'}
            </span>
          </p>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-bone-300 sm:text-lg">
            Charmander, Charmeleon and Charizard, all three at once. We buy
            whatever we can get, in whatever order it turns up, and a pack picks
            for itself. When the last card lands we start the set again.{' '}
            <span className="text-ember-400">
              {overallPct}% of the way there.
            </span>
          </p>

          {/*
            Het eerbetoon. Doet bewust dubbel werk: het zegt waar dit vandaan
            komt én dat we niets officieels zijn — de warme tegenhanger van de
            juridische disclaimer in de footer.
          */}
          <p className="mt-8 max-w-md border-l-2 border-ember-700/70 pl-4 text-sm leading-relaxed text-bone-300">
            <span className="font-display font-bold tracking-tight text-bone-100 uppercase">
              Made by fans, not by anyone official.
            </span>{' '}
            A tribute to the first fire lizard, and to the kid we named after it.
          </p>
        </div>

        <ul className="mt-10 max-w-2xl divide-y divide-ash-800 border-y border-ash-800">
          {stages.map((s) => (
            <StageRow
              key={s.key}
              stage={s.stage}
              pokemon={s.pokemon}
              owned={s.owned}
              total={s.total}
              done={isComplete(s)}
            />
          ))}
        </ul>

        <dl className="mt-12 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-ash-800 pt-8 sm:grid-cols-4">
          <Stat
            label="Stages complete"
            value={`${num(stagesComplete)}/${num(stages.length)}`}
          />
          <Stat label="Fees deployed" value={usd(collection.feesSpentUsd)} />
          <Stat label="This week" value={`+${num(collection.weeklyDelta)}`} />
          <Stat
            label="Market cap"
            value={
              status === 'live' && stats?.marketCapUsd
                ? compactUsd(stats.marketCapUsd)
                : status === 'prelaunch'
                  ? 'Pre-launch'
                  : '—'
            }
          />
        </dl>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <a
            href="#buy"
            className="rounded-full bg-ember-600 px-7 py-3.5 text-sm font-semibold text-ash-950 transition-colors hover:bg-ember-500"
          >
            Buy ${site.ticker}
          </a>
          <a
            href="#/how"
            className="rounded-full border border-ash-600 px-7 py-3.5 text-sm font-semibold transition-colors hover:border-ember-600 hover:text-ember-400"
          >
            How this works
          </a>
        </div>

        <p className="mt-6 font-mono text-xs text-bone-500">
          Last updated {shortDate(collection.lastUpdated)} · Scope:{' '}
          {site.scope.label}, per {site.scope.source}
        </p>
      </div>
    </section>
  )
}
