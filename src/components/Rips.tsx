import { site } from '../data/site'
import type { Rip } from '../data/types'
import { collection, packsOpened, rips, ripsFilmed } from '../lib/collection'
import { num, shortDate, usd } from '../lib/format'
import { Flame } from './Flame'
import { Section } from './ui/Section'

/**
 * Waar een video staat, afgeleid uit de link zelf.
 *
 * Bewust geen los veld in de data. Eén ding minder om verkeerd in te vullen, en
 * een link naar TikTok die zegt dat hij van YouTube is kan niet bestaan.
 */
function platform(url?: string) {
  if (!url) return null
  if (/tiktok\.com/i.test(url)) return 'TikTok'
  if (/(?:x|twitter)\.com/i.test(url)) return 'X'
  if (/youtu\.?be/i.test(url)) return 'YouTube'
  if (/instagram\.com/i.test(url)) return 'Instagram'
  return 'Watch'
}

/*
 * Geen ingesloten speler. TikTok en X willen daar hun eigen script voor
 * laden, en dan haalt elke bezoeker van de homepage code op bij een derde
 * partij die meekijkt wie er langskomt. Een link kost ons niets en hen niets.
 */
function RipCard({ rip }: { rip: Rip }) {
  const where = platform(rip.url)

  return (
    <li className="flex flex-col rounded-2xl border border-ash-800 bg-ash-900/40 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="font-display text-base font-bold">{rip.title}</h3>
        <p className="tnum font-mono text-xs text-bone-500">
          {shortDate(rip.date)}
          {rip.packs ? ` · ${num(rip.packs)} pack${rip.packs === 1 ? '' : 's'}` : ''}
        </p>
      </div>

      {rip.pulls && rip.pulls.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {rip.pulls.map((pull) => (
            <li key={pull} className="flex items-baseline gap-2 text-sm text-bone-300">
              <Flame className="h-3 w-3 shrink-0 translate-y-0.5" />
              {pull}
            </li>
          ))}
        </ul>
      )}

      {rip.note && (
        <p className="mt-4 text-xs leading-relaxed text-bone-400">{rip.note}</p>
      )}

      {rip.url ? (
        <a
          href={rip.url}
          target="_blank"
          rel="noreferrer"
          className="mt-auto inline-block pt-4 text-sm text-ember-500 underline underline-offset-4 transition-colors hover:text-ember-400"
        >
          Watch it on {where} →
        </a>
      ) : (
        <p className="mt-auto pt-4 text-xs text-bone-500">Opened off camera.</p>
      )}
    </li>
  )
}

export function Rips() {
  // Nieuwste eerst. De volgorde in het bestand is die van de adminpagina en
  // daar wil de site niet van afhangen.
  const recent = [...rips]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6)

  return (
    <Section
      id="rips"
      eyebrow="The rips"
      title="What came out of the packs"
      lede={`${site.feeSplit.rips}% of creator fees goes to sealed product. It gets opened on camera, and anything that comes out which is not on our checklist goes to the furnace or a giveaway. We keep the doubles out of the collection on purpose.`}
    >
      {recent.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ash-700 px-6 py-16 text-center">
          <Flame className="mx-auto h-8 w-8 opacity-40" />
          <p className="mt-5 font-display text-xl font-bold">Nothing opened yet</p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-bone-300">
            The first packs go on camera as soon as fees come in. Every one of
            them ends up here, good pulls and bad.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {recent.map((rip) => (
            <RipCard key={rip.id} rip={rip} />
          ))}
        </ul>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-bone-500">
        <span className="tnum">
          <span className="font-semibold text-bone-100">{num(packsOpened)}</span>{' '}
          packs opened ·{' '}
          <span className="font-semibold text-bone-100">{num(ripsFilmed)}</span>{' '}
          filmed ·{' '}
          <span className="font-semibold text-bone-100">
            {usd(collection.rips.spentUsd)}
          </span>{' '}
          spent
        </span>
        <a
          href={site.links.telegram}
          target="_blank"
          rel="noreferrer"
          className="text-ember-500 underline underline-offset-4 transition-colors hover:text-ember-400"
        >
          Get told the moment one goes up →
        </a>
      </div>
    </Section>
  )
}
