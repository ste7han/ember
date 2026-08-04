import { creatorWalletUrl, site } from '../data/site'
import type { Pickup } from '../data/types'
import { collection, ownedTotal, targetTotal } from '../lib/collection'
import { num, shortDate, usd } from '../lib/format'
import { photoUrl } from '../lib/photos'
import { Flame } from './Flame'
import { Section } from './ui/Section'

const stageLabel: Record<Pickup['stage'], string> = {
  ember: 'Ember',
  flame: 'Flame',
  inferno: 'Inferno',
}

function PickupCard({ pickup }: { pickup: Pickup }) {
  const image = photoUrl(pickup.image)

  return (
    <figure className="overflow-hidden rounded-2xl border border-ash-800 bg-ash-900/50">
      <div className="relative aspect-[63/88] bg-ash-800">
        {image ? (
          <img
            src={image}
            alt={pickup.label}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          // Nog geen foto geüpload — toon een nette kaartvormige placeholder.
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-bone-500">
            <Flame className="h-8 w-8 opacity-40" />
            <span className="font-mono text-[0.65rem] tracking-[0.15em] uppercase">
              Photo soon
            </span>
          </div>
        )}
        <span className="absolute top-3 right-3 rounded-full bg-ash-950/85 px-2.5 py-1 font-mono text-[0.65rem] font-semibold text-ember-400">
          {stageLabel[pickup.stage]}
        </span>
      </div>
      <figcaption className="p-4">
        <p className="truncate text-sm font-semibold">{pickup.label}</p>
        <p className="tnum mt-1 font-mono text-xs text-bone-500">
          {shortDate(pickup.date)}
          {pickup.paidUsd !== undefined && ` · ${usd(pickup.paidUsd)}`}
        </p>
      </figcaption>
    </figure>
  )
}

export function Vault() {
  const walletUrl = creatorWalletUrl()

  return (
    <Section
      id="vault"
      eyebrow="The vault"
      title="Every card we own"
      lede="Proof, not promises. Each card below is a real purchase paid for with creator fees, crossed off a public checklist. If it isn't photographed here, it doesn't count."
      className="bg-ash-900/30"
    >
      {collection.recentPickups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ash-700 px-6 py-16 text-center">
          <Flame className="mx-auto h-8 w-8 opacity-40" />
          <p className="mt-5 font-display text-xl font-bold">
            The vault is empty
          </p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-bone-300">
            ${site.ticker} hasn't launched yet. The moment the first fees come in,
            the first card gets bought, photographed and crossed off right here.
          </p>
          <a
            href={site.scope.checklistUrl}
            className="mt-5 inline-block text-sm text-ember-500 underline underline-offset-4 transition-colors hover:text-ember-400"
          >
            See the checklist we're working from
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {collection.recentPickups.map((p, i) => (
            <PickupCard key={`${p.date}-${i}`} pickup={p} />
          ))}
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-bone-500">
        <span className="tnum">
          <span className="font-semibold text-bone-100">
            {num(ownedTotal)}/{num(targetTotal)}
          </span>{' '}
          cards ·{' '}
          <span className="font-semibold text-bone-100">
            {usd(collection.feesSpentUsd)}
          </span>{' '}
          deployed
        </span>
        {walletUrl && (
          <a
            href={walletUrl}
            target="_blank"
            rel="noreferrer"
            className="text-ember-500 underline underline-offset-4 transition-colors hover:text-ember-400"
          >
            Verify the fee wallet on Solscan →
          </a>
        )}
      </div>
    </Section>
  )
}
