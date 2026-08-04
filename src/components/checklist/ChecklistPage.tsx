import { useMemo, useState } from 'react'
import { site } from '../../data/site'
import type { StageKey } from '../../data/types'
import { checklist, isOwned, stages } from '../../lib/collection'
import { num, shortDate } from '../../lib/format'
import { Flame } from '../Flame'
import { Mosaic, MosaicLegend } from '../Mosaic'

/**
 * De volledige noemer, uitgeschreven. Zolang deze lijst er niet staat is
 * "34 / 207" een bewering; met de lijst erbij is het een verwijzing naar iets
 * dat iedereen regel voor regel kan narekenen.
 *
 * Bewust niet in de nav, wel publiek bereikbaar — net als de trekkingstool.
 */
export function ChecklistPage() {
  const [query, setQuery] = useState('')

  const term = query.trim().toLowerCase()

  const groups = useMemo(
    () =>
      stages.map((stage) => {
        const all = checklist.rows.filter((r) => r.stage === stage.key)
        const shown = term
          ? all.filter((r) =>
              `${r.card} ${r.set} ${r.number ?? ''}`.toLowerCase().includes(term),
            )
          : all
        return { stage, all, shown }
      }),
    [term],
  )

  const shownTotal = groups.reduce((n, g) => n + g.shown.length, 0)

  return (
    <div className="min-h-screen">
      <header className="border-b border-ash-800 px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <a href="#" className="flex items-center gap-2">
            <Flame className="h-6 w-6" />
            <span className="font-display text-lg font-extrabold tracking-tight">
              {site.name}
            </span>
          </a>
          <span className="font-mono text-xs tracking-[0.18em] text-ember-500 uppercase">
            The checklist
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
          Every card we have to find.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-bone-300">
          All {num(checklist.rows.length)} of them, generated straight from{' '}
          {checklist.source} on {shortDate(checklist.snapshotDate)}. Our scope is{' '}
          {site.scope.label}. {site.scope.detail}
        </p>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-bone-300">
          This is the denominator of every number on the site. It is locked. If a
          new set adds cards to it, we say so out loud before the total changes.
          To regenerate this exact list from the source yourself, run{' '}
          <code className="rounded bg-ash-800 px-1.5 py-0.5 font-mono text-xs text-bone-200">
            npm run verify-totals
          </code>
        </p>

        <div className="mt-10">
          <Mosaic />
          <MosaicLegend />
        </div>

        <div className="mt-14 border-t border-ash-800 pt-10">
          <label className="block">
            <span className="block font-mono text-[0.65rem] tracking-[0.18em] text-bone-500 uppercase">
              Filter
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Base Set, Charizard ex, 4/102…"
              className="mt-2 w-full rounded-lg border border-ash-700 bg-ash-900 px-4 py-3 text-sm outline-none transition-colors focus:border-ember-600 sm:max-w-md"
            />
          </label>
          {term && (
            <p className="mt-2 font-mono text-xs text-bone-500">
              {num(shownTotal)} of {num(checklist.rows.length)} shown
            </p>
          )}
        </div>

        <div className="mt-12 space-y-14">
          {groups.map(({ stage, all, shown }) => (
            <section key={stage.key}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-ash-800 pb-3">
                <h2 className="font-display text-xl font-extrabold tracking-tight">
                  {stage.stage}
                  <span className="ml-2 text-bone-500">{stage.pokemon}</span>
                </h2>
                <p className="tnum font-mono text-xs text-bone-500">
                  {num(stage.owned)} of {num(all.length)} owned
                </p>
              </div>

              {shown.length === 0 ? (
                <p className="mt-4 text-sm text-bone-500">
                  Nothing in this stage matches that filter.
                </p>
              ) : (
                <ol className="mt-1">
                  {shown.map((row) => {
                    const have = isOwned(row)
                    return (
                      <li
                        key={row.id}
                        className="flex flex-wrap items-baseline gap-x-3 border-b border-ash-800/60 py-2.5 text-sm last:border-0"
                      >
                        <span
                          aria-hidden
                          className={`h-2 w-2 shrink-0 self-center rounded-full ${
                            have ? 'bg-ember-500' : 'bg-ash-700'
                          }`}
                        />
                        <span className={have ? 'text-bone-100' : 'text-bone-400'}>
                          {row.card}
                          <span className="text-bone-500"> · {row.set}</span>
                          {row.japaneseOnly && (
                            <span
                              title="Never released in English, so this one counts in Japanese"
                              className="ml-2 rounded bg-ash-700 px-1.5 py-0.5 font-mono text-[0.6rem] text-bone-300"
                            >
                              JP only
                            </span>
                          )}
                        </span>
                        <span className="tnum ml-auto font-mono text-xs text-bone-500">
                          {row.number ?? '—'}
                        </span>
                      </li>
                    )
                  })}
                </ol>
              )}

              <a
                href={site.scope.sourceUrls[stage.key as StageKey]}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-block text-xs text-ember-500 underline underline-offset-4 transition-colors hover:text-ember-400"
              >
                Check {stage.pokemon} against {checklist.source}
              </a>
            </section>
          ))}
        </div>
      </main>
    </div>
  )
}
