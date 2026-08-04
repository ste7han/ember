import giveaways from '../data/giveaways.json'
import { site } from '../data/site'
import type { Giveaway } from '../data/types'
import { collection } from '../lib/collection'
import { shortDate, truncate } from '../lib/format'
import { Flame } from './Flame'
import { Section } from './ui/Section'

const all = giveaways as Giveaway[]
const live = all.filter((g) => g.status === 'live')
const closed = all.filter((g) => g.status === 'closed')

function LiveCard({ g }: { g: Giveaway }) {
  return (
    <div className="rounded-2xl border border-ember-700/60 bg-ember-600/5 p-7">
      <span className="inline-flex items-center gap-2 font-mono text-xs tracking-[0.18em] text-ember-500 uppercase">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ember-500" />
        Live now
      </span>
      <h3 className="mt-4 font-display text-2xl font-extrabold tracking-tight">
        {g.prize}
      </h3>
      {g.howToEnter && (
        <p className="mt-4 text-sm leading-relaxed text-bone-300">
          {g.howToEnter}
        </p>
      )}
      {g.drawnAt && (
        <p className="mt-4 font-mono text-xs text-bone-500">
          Drawn {shortDate(g.drawnAt)}
        </p>
      )}
    </div>
  )
}

/** De verdeelregel. Dit is wat holders daadwerkelijk terugkrijgen. */
function Tiers() {
  return (
    <div className="mb-12">
      <div className="rounded-2xl border border-ash-800 bg-ash-900/50 p-6 sm:p-8">
        <h3 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
          The rule is simple
        </h3>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-bone-300">
          Charmander, Charmeleon and Charizard stay with us. Everything else of
          value goes to holders, weighted by how much you hold.
        </p>

        <div className="mt-6 rounded-xl border border-ember-700/50 bg-ember-600/5 p-6">
          <h4 className="font-display text-lg font-bold">
            And then the big one
          </h4>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-bone-300">
            The first finished set stays with us. The second one gets raffled
            off whole, to a single holder. Then a third. The duplicates piling up
            in the box aren't clutter. They're the next prize.
          </p>
          <p className="tnum mt-4 font-mono text-xs text-bone-500">
            Currently building set{' '}
            {String(collection.currentSet).padStart(2, '0')} ·{' '}
            {collection.setsAwarded === 0
              ? 'none awarded yet'
              : `${collection.setsAwarded} awarded so far`}
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {site.holderTiers.map((tier, i) => (
            <div
              key={tier.name}
              className={`rounded-xl border p-6 ${
                i === site.holderTiers.length - 1
                  ? 'border-ember-700/50 bg-ember-600/5'
                  : 'border-ash-700 bg-ash-800/40'
              }`}
            >
              <div className="flex items-center gap-2">
                <Flame
                  className={`h-4 w-4 ${i === 0 ? 'opacity-50' : ''}`}
                />
                <h4 className="font-display text-lg font-bold">{tier.name}</h4>
              </div>
              <p className="tnum mt-2 font-mono text-xs text-ember-400">
                {tier.minSupplyPct === 0
                  ? 'Any amount'
                  : `${tier.minSupplyPct}%+ of supply`}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-6 text-sm leading-relaxed text-bone-300">
          <strong className="font-semibold text-bone-100">
            Leave an address and we don't have to chase you.
          </strong>{' '}
          <a
            href="#/shipping"
            className="text-ember-500 underline underline-offset-4 transition-colors hover:text-ember-400"
          >
            Save one against your wallet
          </a>{' '}
          and anything it wins goes out straight away. It's encrypted in your
          browser, so nobody can read it but us.
        </p>

        <p className="mt-4 text-xs leading-relaxed text-bone-500">
          Want to see what a wallet has already won?{' '}
          <a
            href="#/wallet"
            className="text-ember-500 underline underline-offset-4 transition-colors hover:text-ember-400"
          >
            Look one up
          </a>
          . Better odds, not a guarantee, and never a promise of profit.{' '}
          <a
            href="#/how"
            className="text-ember-500 underline underline-offset-4 transition-colors hover:text-ember-400"
          >
            How the draws work
          </a>
          .
        </p>
      </div>
    </div>
  )
}

export function Giveaways() {
  return (
    <Section
      id="giveaways"
      eyebrow="Giveaways"
      title="The good ones go to holders"
      lede={`This is what The Rips are for. Winners are drawn from ${site.ticker} holders, and every send is a public transaction you can check yourself.`}
      className="bg-ash-900/30"
    >
      <Tiers />

      {live.length > 0 && (
        <div className="mb-10 grid gap-4 sm:grid-cols-2">
          {live.map((g) => (
            <LiveCard key={g.prize} g={g} />
          ))}
        </div>
      )}

      {closed.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-ash-700">
                {['Prize', 'Drawn', 'Winner', 'Proof'].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="pb-3 font-mono text-[0.65rem] font-medium tracking-[0.15em] text-bone-500 uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {closed.map((g, i) => (
                <tr key={`${g.prize}-${i}`} className="border-b border-ash-800">
                  <td className="py-4 pr-4 font-medium">{g.prize}</td>
                  <td className="py-4 pr-4 font-mono text-xs text-bone-500">
                    {g.drawnAt ? shortDate(g.drawnAt) : '—'}
                  </td>
                  <td className="py-4 pr-4 font-mono text-xs text-bone-300">
                    {g.winner ? truncate(g.winner) : '—'}
                  </td>
                  <td className="py-4">
                    {g.txSignature ? (
                      <a
                        href={`https://solscan.io/tx/${g.txSignature}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-xs text-ember-500 underline underline-offset-4 hover:text-ember-400"
                      >
                        {truncate(g.txSignature)}
                      </a>
                    ) : (
                      <span className="text-bone-500">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        live.length === 0 && (
          <div className="rounded-2xl border border-dashed border-ash-700 px-6 py-16 text-center">
            <p className="font-display text-xl font-bold">No giveaways yet</p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-bone-300">
              The first one goes live once ${site.ticker} launches and we've
              pulled something worth giving away. Follow on X or join the Telegram so
              you don't miss it.
            </p>
          </div>
        )
      )}

      {/*
        De trekkingstool staat bewust niet in de nav — hij is voor ons, niet
        voor bezoekers. Maar "iedereen kan het narekenen" is een lege belofte
        als het adres nergens staat, dus hier wel een ingang. Onder de uitslagen,
        want dat is het moment waarop iemand wil controleren.
      */}
      <p className="mt-10 max-w-2xl text-xs leading-relaxed text-bone-500">
        Every draw is reproducible. Take the snapshot and the seed we published,
        put them into the checker, and you land on the same winner we did. On any
        computer.{' '}
        <a
          href="#/draw"
          className="text-ember-500 underline underline-offset-4 transition-colors hover:text-ember-400"
        >
          Check one yourself
        </a>
        .
      </p>
    </Section>
  )
}
