import { useMemo, useState } from 'react'
import furnaceData from '../../data/furnace.json'
import giveawayData from '../../data/giveaways.json'
import { site } from '../../data/site'
import type { FurnaceOffer, Giveaway } from '../../data/types'
import { num, shortDate, truncate } from '../../lib/format'
import { photoUrl } from '../../lib/photos'
import { Flame } from '../Flame'

const offers = furnaceData as FurnaceOffer[]
const giveaways = giveawayData as Giveaway[]

/**
 * Opzoeken wat één wallet heeft binnengehaald.
 *
 * Alles komt uit dezelfde bestanden die de rest van de site gebruikt, dus wat
 * je hier ziet is exact wat er op de Giveaways- en Furnace-secties staat. Zou
 * dit een aparte lijst zijn, dan konden ze uit elkaar lopen en bewees het niets.
 *
 * Adressen zijn hoofdlettergevoelig: base58 kent zowel `A` als `a`. Vergelijken
 * we ongevoelig, dan zou een bijna-gelijk adres andermans prijzen tonen.
 */
const looksLikeWallet = (s: string) => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s)

export function WalletPage() {
  const [input, setInput] = useState('')
  const [query, setQuery] = useState<string | null>(null)

  const found = useMemo(() => {
    if (!query) return null
    const won = giveaways.filter((g) => g.winner === query)
    const burned = offers.filter((o) => o.claim?.wallet === query)
    const spent = burned.reduce((n, o) => n + (o.burnAmount ?? 0), 0)
    return { won, burned, spent }
  }, [query])

  const valid = looksLikeWallet(input.trim())

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
            Wallet
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
          What has this wallet got?
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-bone-300">
          Paste any Solana address, yours or someone else's, and see every card
          it has won in a draw and every card it has claimed by burning. Each one
          links to the transaction, so you are not taking our word for it.
        </p>

        <form
          className="mt-8 flex flex-wrap gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            setQuery(input.trim())
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            placeholder="7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
            className="min-w-0 flex-1 rounded-lg border border-ash-700 bg-ash-900 px-4 py-3 font-mono text-xs outline-none transition-colors focus:border-ember-600"
          />
          <button
            type="submit"
            disabled={!valid}
            className="rounded-full bg-ember-600 px-6 py-3 text-sm font-semibold text-ash-950 transition-colors hover:bg-ember-500 disabled:cursor-not-allowed disabled:opacity-30"
          >
            Look it up
          </button>
        </form>

        {input.trim() && !valid && (
          <p className="mt-3 text-sm text-ember-400">
            That does not look like a Solana address.
          </p>
        )}

        {found && (
          <div className="mt-12 space-y-12">
            <section>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-ash-800 pb-3">
                <h2 className="font-display text-xl font-extrabold tracking-tight">
                  Won in a draw
                </h2>
                <p className="tnum font-mono text-xs text-bone-500">
                  {num(found.won.length)}
                </p>
              </div>
              {found.won.length === 0 ? (
                <p className="mt-4 text-sm text-bone-500">
                  Nothing yet for this wallet.
                </p>
              ) : (
                <ul className="mt-2">
                  {found.won.map((g, i) => (
                    <li
                      key={`${g.prize}-${i}`}
                      className="flex flex-wrap items-baseline justify-between gap-x-4 border-b border-ash-800/60 py-3 text-sm last:border-0"
                    >
                      <span className="text-bone-100">{g.prize}</span>
                      <span className="flex items-baseline gap-3 font-mono text-xs text-bone-500">
                        {g.drawnAt && shortDate(g.drawnAt)}
                        {g.txSignature && (
                          <a
                            href={`https://solscan.io/tx/${g.txSignature}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-ember-500 underline underline-offset-4 hover:text-ember-400"
                          >
                            {truncate(g.txSignature)}
                          </a>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-ash-800 pb-3">
                <h2 className="font-display text-xl font-extrabold tracking-tight">
                  Claimed by burning
                </h2>
                <p className="tnum font-mono text-xs text-bone-500">
                  {num(found.burned.length)}
                  {found.spent > 0 &&
                    ` · ${num(found.spent)} $${site.ticker} burned`}
                </p>
              </div>
              {found.burned.length === 0 ? (
                <p className="mt-4 text-sm text-bone-500">
                  This wallet has not burned for a card.
                </p>
              ) : (
                <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {found.burned.map((o) => {
                    const image = photoUrl(o.image ?? o.id)
                    return (
                      <li
                        key={o.id}
                        className="overflow-hidden rounded-2xl border border-ash-800 bg-ash-900/40"
                      >
                        <div className="relative aspect-[63/88] bg-ash-800">
                          {image ? (
                            <img
                              src={image}
                              alt={o.card}
                              loading="lazy"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <Flame className="h-8 w-8 opacity-40" />
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <p className="text-sm font-semibold">{o.card}</p>
                          {o.burnAmount !== undefined && (
                            <p className="tnum mt-1 font-mono text-xs text-ember-400">
                              {num(o.burnAmount)} burned
                            </p>
                          )}
                          {o.claim && (
                            <a
                              href={`https://solscan.io/tx/${o.claim.txSignature}`}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2 inline-block font-mono text-xs text-ember-500 underline underline-offset-4 hover:text-ember-400"
                            >
                              {shortDate(o.claim.at)}
                            </a>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>

            {found.won.length === 0 && found.burned.length === 0 && (
              <p className="text-sm leading-relaxed text-bone-500">
                Nothing on record for{' '}
                <span className="font-mono text-xs">{truncate(query!, 6, 6)}</span>
                . Either it has not won or claimed anything yet, or you are
                looking at a different address than you think.
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
