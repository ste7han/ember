import type { ReactNode } from 'react'
import { site } from '../../data/site'
import { targetTotal } from '../../lib/collection'
import { num, shortDate } from '../../lib/format'
import { Flame } from '../Flame'

/**
 * Alle regels op één plek.
 *
 * De homepage is de pitch en moet kort blijven; hier staat het naadje voor wie
 * het wil weten. Bewust geen samenvatting van de homepage maar de uitwerking
 * ervan — dubbele teksten gaan uit elkaar lopen en dan klopt er ergens iets
 * niet meer.
 */
function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-ash-800 py-10">
      <h2 className="font-display text-2xl font-extrabold tracking-tight">
        {title}
      </h2>
      <div className="mt-4 max-w-2xl space-y-4 text-sm leading-relaxed text-bone-300">
        {children}
      </div>
    </section>
  )
}

export function HowPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-ash-800 px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <a href="#" className="flex items-center gap-2">
            <Flame className="h-6 w-6" />
            <span className="font-display text-lg font-extrabold tracking-tight">
              {site.name}
            </span>
          </a>
          <span className="font-mono text-xs tracking-[0.18em] text-ember-500 uppercase">
            The rules
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
          How this actually works.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-bone-300">
          Everything on the front page in full. If a rule matters, it's written
          down here — and if it isn't written down here, it isn't a rule.
        </p>

        <Block title={`Where the ${num(targetTotal)} comes from`}>
          <p>
            Card counts are slippery, and not because anyone is lying.{' '}
            {site.scope.source} lists 50 Charizard cards. Only 47 of those ever
            came out in English, and those 47 were printed 113 different times.
            One source, three defensible answers.
          </p>
          <p>
            So we picked one and wrote it down:{' '}
            <span className="text-bone-100">
              {site.scope.label}, per {site.scope.source}
            </span>
            . {site.scope.detail}
          </p>
          <p>
            Counted from the source on {shortDate(site.scope.snapshotDate)} and
            locked. New sets do get printed; if one adds cards to the list, we
            say so out loud before any total changes. A denominator that moves
            quietly makes every number above it worthless.
          </p>
          <p>
            You do not have to take our word for any of it.{' '}
            <a
              href={site.scope.checklistUrl}
              className="text-ember-500 underline underline-offset-4 hover:text-ember-400"
            >
              The full list is published
            </a>
            , with the set and card number of every single one, and the counting
            script is in the repository.
          </p>
        </Block>

        <Block title="Why we buy singles instead of just opening packs">
          <p>
            Finishing a set means hunting specific cards, and pulling the exact
            one you're missing out of a random pack is close to impossible. You
            buy it as a single for a fraction of the price.
          </p>
          <p>
            So if this were only about finishing fast, every cent would go to the
            hunt. It isn't. The fees split{' '}
            <span className="text-bone-100">
              {site.feeSplit.hunt}/{site.feeSplit.rips}
            </span>
            , because half of this belongs to the people holding: everything we
            pull from a pack that isn't part of the line goes straight to them.
          </p>
          <p>
            We could finish the set roughly twice as quickly by keeping it all.
            That's the trade, and it's deliberate.
          </p>
          <p>
            Both halves sit in their own public wallet, and the front page shows
            what's in each of them right now. You don't have to believe the
            split — you can watch it.
          </p>
          <ul className="space-y-1.5 font-mono text-xs break-all text-bone-500">
            <li>
              The Hunt —{' '}
              <a
                href={`https://solscan.io/account/${site.wallets.hunt}`}
                target="_blank"
                rel="noreferrer"
                className="text-ember-500 underline underline-offset-4 hover:text-ember-400"
              >
                {site.wallets.hunt}
              </a>
            </li>
            <li>
              The Rips —{' '}
              <a
                href={`https://solscan.io/account/${site.wallets.rips}`}
                target="_blank"
                rel="noreferrer"
                className="text-ember-500 underline underline-offset-4 hover:text-ember-400"
              >
                {site.wallets.rips}
              </a>
            </li>
          </ul>
        </Block>

        <Block title="The furnace">
          <p>
            On the 1999 Base Set card, Ember reads: “Discard 1 Fire Energy card
            attached to Charmander in order to use this attack.” The move costs
            you something. That's the whole idea here too.
          </p>
          <p>
            Spare cards — duplicates, and anything we pull that isn't part of the
            line — can be claimed by burning ${site.ticker}. Send the listed
            amount to the burn address, then send us the transaction with your
            shipping details and we post the card.
          </p>
          <p className="font-mono text-xs break-all text-bone-500">
            {site.furnace.burnAddress}
          </p>
          <p>
            That address has no key, so the tokens are unrecoverable. It does not
            reduce the reported supply the way a token burn instruction would —
            it takes them out of circulation, which is a different claim, and we
            make the one that's true.
          </p>
          <p>
            <span className="text-bone-100">Reserve before you burn.</span>{' '}
            Holding a card locks it to your wallet for fifteen minutes and nobody
            else can take it. Burning without a reservation is the one way to
            lose out: if two burns land for the same card, the one from the
            reserving wallet gets it. Tokens cannot be un-burned, so whoever
            burned without holding the card picks anything else in the furnace up
            to the same amount. That is the entire remedy, which is exactly why
            the reserve button exists.
          </p>
          <p>
            Cards from the checklist are never listed in the furnace. Those make
            up the set we've promised to finish, and that counter only goes one
            way.
          </p>
        </Block>

        <Block title="The draws">
          <p>
            Anything good we pull that isn't a Charmander, Charmeleon or
            Charizard goes to holders. Entries are weighted by how much you hold,
            so a bigger holder has better odds — not a guarantee, and not a
            promise of profit.
          </p>
          <p>
            Thresholds are set in percent of supply rather than token counts,
            because at these prices a fixed number stops meaning anything within
            a week.
          </p>
          <ul className="space-y-1.5">
            {site.holderTiers.map((tier) => (
              <li key={tier.name}>
                <span className="text-bone-100">{tier.name}</span>
                {' — '}
                {tier.minSupplyPct === 0
                  ? 'any amount'
                  : `${tier.minSupplyPct}% of supply`}
                . {tier.blurb}
              </li>
            ))}
          </ul>
          <p>
            Every draw is reproducible. The winner comes from{' '}
            <span className="font-mono text-xs">SHA-256(seed)</span> mapped onto
            the weighted holder list, so the same snapshot and the same seed give
            the same winner on any computer. We publish the seed and the snapshot
            before spinning.{' '}
            <a
              href="#/draw"
              className="text-ember-500 underline underline-offset-4 hover:text-ember-400"
            >
              Run it yourself
            </a>
            .
          </p>
        </Block>

        <Block title="What happens when a set is finished">
          <p>
            The first completed set stays with us. Then we start building a
            second one, and that entire set gets raffled off to a single holder.
            Then a third. The duplicates piling up in the box aren't clutter,
            they're the next prize.
          </p>
        </Block>

        <Block title="What this is not">
          <p>
            ${site.ticker} is a memecoin. The one thing it does is the furnace:
            tokens can be burned to claim a spare card while that card is listed
            and still available. Listings are limited, first come first served,
            and we may stop offering them at any time.
          </p>
          <p>
            That is not a return, an investment, or a promise of value. There is
            no roadmap obligation and no expectation of profit. Digital assets
            are volatile and you may lose the entire value of your purchase.
            Nothing here is financial advice.
          </p>
          <p>
            {site.name} is an independent community project, not affiliated with
            or endorsed by Nintendo, Creatures Inc., GAME FREAK inc., or The
            Pokémon Company. Any card images are photographs of cards we
            personally own.
          </p>
        </Block>

        <p className="border-t border-ash-800 pt-10 text-sm text-bone-500">
          <a
            href="#"
            className="text-ember-500 underline underline-offset-4 hover:text-ember-400"
          >
            Back to the front page
          </a>
        </p>
      </main>
    </div>
  )
}
