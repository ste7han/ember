import { site } from '../data/site'
import { ownedTotal, overallPct, targetTotal } from '../lib/collection'
import { num } from '../lib/format'
import { Mosaic, MosaicLegend } from './Mosaic'
import { Section } from './ui/Section'

/**
 * De missie als muur. Komt bewust direct na de missie-sectie: daar leg je uit
 * waar de 200 vandaan komt, hier zie je ze.
 */
export function Wall() {
  return (
    <Section
      id="wall"
      eyebrow="The wall"
      title={
        <>
          {num(targetTotal)} cards. <span className="text-flame">Every one</span>{' '}
          on this page.
        </>
      }
      lede={`One tile per card we have to find. Nothing is hidden and nothing is rounded — ${num(ownedTotal)} of them are lit, which is ${overallPct}% of the job. The empty ones are the honest part.`}
      className="relative bg-ash-900/30"
    >
      {/* Kaartsilhouetten als textuur. Decoratief, dus buiten de leesvolgorde. */}
      <div
        aria-hidden
        className="card-motif pointer-events-none absolute inset-0 opacity-60"
      />
      <Mosaic />
      <MosaicLegend />

      <a
        href={site.scope.checklistUrl}
        className="mt-8 inline-block text-sm text-ember-500 underline underline-offset-4 transition-colors hover:text-ember-400"
      >
        Open the full checklist, with set and card number
      </a>
    </Section>
  )
}
