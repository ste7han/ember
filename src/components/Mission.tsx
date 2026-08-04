import { site } from '../data/site'
import { collection, ownedTotal, targetTotal } from '../lib/collection'
import { num, truncate, usd } from '../lib/format'
import { useTreasury, type Pot } from '../hooks/useTreasury'
import { Section } from './ui/Section'

/**
 * Kort houden. De volledige uitleg staat op /#/how — twee keer hetzelfde
 * schrijven betekent dat het op een dag uit elkaar loopt en er ergens iets
 * staat dat niet meer klopt.
 */
const steps = [
  {
    n: '01',
    title: 'Fees come in',
    body: `Every trade generates a creator fee. It splits three ways into public wallets you can watch, and nothing moves without leaving a trace.`,
  },
  {
    n: '02',
    title: 'Cards get crossed off',
    body: 'That wallet buys the exact cards still missing. Every one counted and photographed.',
  },
  {
    n: '03',
    title: 'The line gets finished',
    body: 'There is a last card, and most collections never have one. Then we start the set again, and that one goes to a holder.',
  },
]

/** Het saldo dat er nú staat, met een link om het zelf na te kijken. */
function PotBalance({
  pot,
  wallet,
  status,
}: {
  pot?: Pot
  wallet: string
  status: string
}) {
  return (
    <div className="mt-4 border-t border-ash-800 pt-4">
      <p className="font-mono text-[0.65rem] tracking-[0.18em] text-bone-500 uppercase">
        In the pot
      </p>
      {status === 'live' && pot ? (
        <>
          <p className="tnum mt-1 font-display text-2xl font-bold text-ember-400">
            {pot.sol.toLocaleString('en-US', { maximumFractionDigits: 2 })}{' '}
            <span className="font-sans text-sm font-normal text-bone-500">
              SOL
            </span>
          </p>
          {pot.usd !== null && (
            <p className="tnum font-display text-lg font-bold text-bone-100">
              {usd(pot.usd)}
            </p>
          )}
        </>
      ) : (
        <p className="tnum mt-1 font-mono text-sm text-bone-500">
          {status === 'loading' ? 'Checking…' : 'Unavailable'}
        </p>
      )}
      <a
        href={`https://solscan.io/account/${wallet}`}
        target="_blank"
        rel="noreferrer"
        className="mt-1.5 inline-block font-mono text-[0.7rem] text-ember-500 underline underline-offset-4 transition-colors hover:text-ember-400"
      >
        {truncate(wallet, 6, 6)} · check it on Solscan
      </a>
    </div>
  )
}

/** De twee potten, met de vraag die iedereen stelt als kop. */
function Engines() {
  const { treasury, status } = useTreasury()

  return (
    <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div className="rounded-2xl border border-ember-700/50 bg-ember-600/5 p-6">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-display text-lg font-bold">The Hunt</h3>
          <span className="tnum font-mono text-sm font-semibold text-ember-400">
            {site.feeSplit.hunt}%
          </span>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-bone-300">
          Singles off the checklist. The only thing that moves the counter.
        </p>
        <p className="tnum mt-4 font-mono text-xs text-bone-500">
          {num(ownedTotal)} of {num(targetTotal)} secured
        </p>
        <PotBalance
          pot={treasury?.hunt}
          wallet={site.wallets.hunt}
          status={status}
        />
      </div>

      <div className="rounded-2xl border border-ash-700 bg-ash-800/40 p-6">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-display text-lg font-bold">The Rips</h3>
          <span className="tnum font-mono text-sm font-semibold text-bone-300">
            {site.feeSplit.rips}%
          </span>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-bone-300">
          Packs opened on camera. Everything we pull outside the line goes to
          holders, drawn in giveaways or claimable by burning ${site.ticker}.
        </p>
        <p className="tnum mt-4 font-mono text-xs text-bone-500">
          {num(collection.rips.packsOpened)} packs opened
        </p>
        <PotBalance
          pot={treasury?.rips}
          wallet={site.wallets.rips}
          status={status}
        />
      </div>

      {/*
        De dev-pot krijgt bewust dezelfde behandeling als de andere twee: eigen
        kaart, live saldo, Solscan-link. Wegmoffelen in een voetnoot zou de hele
        opzet ondermijnen, want dit is nu juist het cijfer waar mensen naar
        zoeken.
      */}
      <div className="rounded-2xl border border-ash-700 bg-ash-800/40 p-6">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-display text-lg font-bold">Dev</h3>
          <span className="tnum font-mono text-sm font-semibold text-bone-300">
            {site.feeSplit.dev}%
          </span>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-bone-300">
          What it costs to run this: listings, tools, hosting, and packs I buy
          for my own collecting. My cut, stated out loud.
        </p>
        <PotBalance
          pot={treasury?.dev}
          wallet={site.wallets.dev}
          status={status}
        />
      </div>
    </div>
  )
}

export function Mission() {
  return (
    <Section
      id="mission"
      eyebrow="The mission"
      title={
        <>
          The whole line, <span className="text-flame">or nothing.</span>
        </>
      }
      lede={
        <>
          Every card in the Charmander line, 1999 to last month.{' '}
          {num(targetTotal)} of them. Most collectors chase whatever's hot. We
          picked the boring, countable, finishable thing instead.
        </>
      }
    >
      <ol className="grid gap-4 sm:grid-cols-3">
        {steps.map((s) => (
          <li
            key={s.n}
            className="rounded-2xl border border-ash-800 bg-ash-900/50 p-6"
          >
            <span className="font-mono text-xs tracking-[0.2em] text-ember-600">
              {s.n}
            </span>
            <h3 className="mt-4 font-display text-lg font-bold">{s.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-bone-300">
              {s.body}
            </p>
          </li>
        ))}
      </ol>

      <Engines />

      <p className="mt-10 max-w-2xl text-sm leading-relaxed text-bone-500">
        Why {num(targetTotal)} and not some other number? Why singles instead of
        packs?{' '}
        <a
          href="#/how"
          className="text-ember-500 underline underline-offset-4 transition-colors hover:text-ember-400"
        >
          Every rule is written down
        </a>
        .
      </p>
    </Section>
  )
}
