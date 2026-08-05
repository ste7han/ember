import { useState } from 'react'
import contentData from '../../data/content.json'
import furnaceData from '../../data/furnace.json'
import giveawayData from '../../data/giveaways.json'
import { site } from '../../data/site'
import type { FurnaceOffer, Giveaway, Rip } from '../../data/types'
import { Flame } from '../Flame'
import { useOperator } from './useOperator'

/**
 * De adminpagina.
 *
 * Publiceren gaat via een commit in de repository, niet via een database. Dat
 * is trager (ongeveer een minuut voordat het live staat) maar het levert iets
 * op wat een tabel niet kan: elke wijziging heeft een datum en is terug te
 * lezen. Voor een project dat draait op "reken het zelf na" is dat het
 * verschil tussen bewijs en belofte.
 */

const inputCls =
  'mt-1.5 w-full rounded-lg border border-ash-700 bg-ash-900 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-ember-600'

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="font-mono text-[0.65rem] tracking-[0.18em] text-bone-500 uppercase">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-bone-500">{hint}</span>}
    </label>
  )
}

/** Lokale tijd naar een ISO-tijd in UTC, want daar rekent de site mee. */
const toIso = (localValue: string) =>
  localValue ? new Date(localValue).toISOString() : undefined

type Status = { kind: 'idle' | 'busy' | 'ok' | 'error'; text?: string; url?: string }

export function AdminPage() {
  const op = useOperator()
  const [tab, setTab] = useState<'furnace' | 'giveaways' | 'rips'>('furnace')
  const [furnace, setFurnace] = useState<FurnaceOffer[]>(
    furnaceData as FurnaceOffer[],
  )
  const [giveaways, setGiveaways] = useState<Giveaway[]>(
    giveawayData as Giveaway[],
  )
  const [rips, setRips] = useState<Rip[]>(contentData as Rip[])
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  const publish = async (
    file: string,
    value: unknown,
    summary: string,
  ) => {
    setStatus({ kind: 'busy', text: 'Waiting for your wallet…' })
    try {
      const signed = await op.sign('publish a change')
      setStatus({ kind: 'busy', text: 'Publishing…' })

      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file,
          content: JSON.stringify(value, null, 2) + '\n',
          summary,
          ...signed,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Could not publish.')

      setStatus({
        kind: 'ok',
        text: 'Committed. Live in about a minute.',
        url: data.url,
      })
    } catch (err) {
      setStatus({ kind: 'error', text: (err as Error).message })
    }
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-ash-800 px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <a href="#" className="flex items-center gap-2">
            <Flame className="h-6 w-6" />
            <span className="font-display text-lg font-extrabold tracking-tight">
              {site.name}
            </span>
          </a>
          <span className="font-mono text-xs tracking-[0.18em] text-ember-500 uppercase">
            Admin
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          Run the thing.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-bone-300">
          Every change here becomes a commit in the public repository, signed off
          by your wallet. That is slower than a database and it is the point: a
          published result has a date on it and cannot be quietly edited later.
        </p>

        <div className="mt-8 flex gap-2">
          {(['furnace', 'giveaways', 'rips'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                tab === t
                  ? 'bg-ember-600 text-ash-950'
                  : 'border border-ash-700 text-bone-300 hover:border-ember-600'
              }`}
            >
              {t === 'furnace'
                ? 'Burn events'
                : t === 'giveaways'
                  ? 'Giveaways'
                  : 'Rips'}
            </button>
          ))}
        </div>

        {tab === 'furnace' && (
          <FurnaceTab
            offers={furnace}
            setOffers={setFurnace}
            onPublish={(v, s) => publish('src/data/furnace.json', v, s)}
          />
        )}
        {tab === 'giveaways' && (
          <GiveawayTab
            items={giveaways}
            setItems={setGiveaways}
            onPublish={(v, s) => publish('src/data/giveaways.json', v, s)}
          />
        )}
        {tab === 'rips' && (
          <RipsTab
            items={rips}
            setItems={setRips}
            onPublish={(v, s) => publish('src/data/content.json', v, s)}
          />
        )}

        {status.kind !== 'idle' && (
          <p
            className={`mt-6 text-sm ${
              status.kind === 'error' ? 'text-ember-400' : 'text-bone-300'
            }`}
          >
            {status.text}{' '}
            {status.url && (
              <a
                href={status.url}
                target="_blank"
                rel="noreferrer"
                className="text-ember-500 underline underline-offset-4"
              >
                See the commit
              </a>
            )}
          </p>
        )}
      </main>
    </div>
  )
}

function FurnaceTab({
  offers,
  setOffers,
  onPublish,
}: {
  offers: FurnaceOffer[]
  setOffers: (v: FurnaceOffer[]) => void
  onPublish: (value: unknown, summary: string) => void
}) {
  const [draft, setDraft] = useState({
    id: '',
    card: '',
    burnAmount: '',
    deadline: '',
    note: '',
    mode: 'burn' as 'burn' | 'giveaway',
  })

  const add = () => {
    const offer: FurnaceOffer = {
      id: draft.id.trim(),
      card: draft.card.trim(),
      mode: draft.mode,
      ...(draft.mode === 'burn' && draft.burnAmount
        ? { burnAmount: Number(draft.burnAmount) }
        : {}),
      ...(draft.deadline ? { burnDeadline: toIso(draft.deadline) } : {}),
      ...(draft.note.trim() ? { note: draft.note.trim() } : {}),
    }
    setOffers([...offers, offer])
    setDraft({ id: '', card: '', burnAmount: '', deadline: '', note: '', mode: 'burn' })
  }

  const valid =
    /^[\w-]+$/.test(draft.id.trim()) &&
    draft.card.trim().length > 0 &&
    !offers.some((o) => o.id === draft.id.trim())

  return (
    <div className="mt-8 space-y-8">
      <section className="rounded-2xl border border-ash-800 bg-ash-900/50 p-6">
        <h2 className="font-display text-lg font-bold">Offer a card</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Card" hint="Shown on the site.">
            <input
              value={draft.card}
              onChange={(e) => setDraft({ ...draft, card: e.target.value })}
              placeholder="Blastoise — Base Set #2"
              className={inputCls}
            />
          </Field>
          <Field label="Id" hint="Lowercase, no spaces. Also the photo filename.">
            <input
              value={draft.id}
              onChange={(e) => setDraft({ ...draft, id: e.target.value })}
              placeholder="blastoise-base-2"
              className={`${inputCls} font-mono text-xs`}
            />
          </Field>
          <Field label="What happens to it">
            <select
              value={draft.mode}
              onChange={(e) =>
                setDraft({ ...draft, mode: e.target.value as 'burn' | 'giveaway' })
              }
              className={inputCls}
            >
              <option value="burn">Claimable by burning</option>
              <option value="giveaway">Draw only</option>
            </select>
          </Field>
          {draft.mode === 'burn' && (
            <Field label={`${site.ticker} to burn`}>
              <input
                value={draft.burnAmount}
                onChange={(e) =>
                  setDraft({ ...draft, burnAmount: e.target.value })
                }
                inputMode="numeric"
                placeholder="250000"
                className={`${inputCls} tnum font-mono text-sm`}
              />
            </Field>
          )}
          {draft.mode === 'burn' && (
            <Field
              label="Burn window closes"
              hint="Optional. Your local time. Leave empty and it stays open."
            >
              <input
                type="datetime-local"
                value={draft.deadline}
                onChange={(e) => setDraft({ ...draft, deadline: e.target.value })}
                className={inputCls}
              />
            </Field>
          )}
          <Field label="Note" hint="Optional, one line.">
            <input
              value={draft.note}
              onChange={(e) => setDraft({ ...draft, note: e.target.value })}
              className={inputCls}
            />
          </Field>
        </div>
        <button
          type="button"
          onClick={add}
          disabled={!valid}
          className="mt-5 rounded-full bg-ember-600 px-6 py-2.5 text-sm font-semibold text-ash-950 transition-colors hover:bg-ember-500 disabled:opacity-30"
        >
          Add to the list
        </button>
      </section>

      <OfferList offers={offers} setOffers={setOffers} />

      <button
        type="button"
        onClick={() => onPublish(offers, `Furnace: ${offers.length} card(s) listed`)}
        className="w-full rounded-full bg-ember-600 px-7 py-3.5 font-display text-base font-bold text-ash-950 transition-colors hover:bg-ember-500"
      >
        Publish the furnace
      </button>
    </div>
  )
}

function OfferList({
  offers,
  setOffers,
}: {
  offers: FurnaceOffer[]
  setOffers: (v: FurnaceOffer[]) => void
}) {
  const [claimFor, setClaimFor] = useState<string | null>(null)
  const [claim, setClaim] = useState({ wallet: '', txSignature: '' })

  if (offers.length === 0) {
    return (
      <p className="text-sm text-bone-500">
        Nothing listed. The furnace shows "cold" on the site.
      </p>
    )
  }

  return (
    <ul className="space-y-3">
      {offers.map((o) => (
        <li
          key={o.id}
          className="rounded-xl border border-ash-800 bg-ash-900/40 p-4"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">{o.card}</p>
              <p className="font-mono text-xs text-bone-500">
                {o.id} · {o.mode}
                {o.burnAmount ? ` · ${o.burnAmount.toLocaleString()}` : ''}
                {o.claim ? ' · claimed' : ''}
              </p>
            </div>
            <div className="flex gap-2">
              {!o.claim && o.mode === 'burn' && (
                <button
                  type="button"
                  onClick={() => setClaimFor(claimFor === o.id ? null : o.id)}
                  className="rounded-md border border-ash-600 px-3 py-1 text-xs font-semibold transition-colors hover:border-ember-600 hover:text-ember-400"
                >
                  Mark claimed
                </button>
              )}
              <button
                type="button"
                onClick={() => setOffers(offers.filter((x) => x.id !== o.id))}
                className="rounded-md border border-ash-600 px-3 py-1 text-xs font-semibold text-bone-500 transition-colors hover:border-ember-600 hover:text-ember-400"
              >
                Remove
              </button>
            </div>
          </div>

          {claimFor === o.id && (
            <div className="mt-4 grid gap-3 border-t border-ash-800 pt-4 sm:grid-cols-2">
              <Field label="Winner wallet">
                <input
                  value={claim.wallet}
                  onChange={(e) => setClaim({ ...claim, wallet: e.target.value })}
                  className={`${inputCls} font-mono text-xs`}
                />
              </Field>
              <Field label="Burn transaction">
                <input
                  value={claim.txSignature}
                  onChange={(e) =>
                    setClaim({ ...claim, txSignature: e.target.value })
                  }
                  className={`${inputCls} font-mono text-xs`}
                />
              </Field>
              <button
                type="button"
                disabled={!claim.wallet.trim() || !claim.txSignature.trim()}
                onClick={() => {
                  setOffers(
                    offers.map((x) =>
                      x.id === o.id
                        ? {
                            ...x,
                            claim: {
                              wallet: claim.wallet.trim(),
                              txSignature: claim.txSignature.trim(),
                              at: new Date().toISOString().slice(0, 10),
                            },
                          }
                        : x,
                    ),
                  )
                  setClaimFor(null)
                  setClaim({ wallet: '', txSignature: '' })
                }}
                className="rounded-full bg-ember-600 px-5 py-2 text-sm font-semibold text-ash-950 disabled:opacity-30 sm:col-span-2"
              >
                Record the claim
              </button>
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}

function GiveawayTab({
  items,
  setItems,
  onPublish,
}: {
  items: Giveaway[]
  setItems: (v: Giveaway[]) => void
  onPublish: (value: unknown, summary: string) => void
}) {
  const [draft, setDraft] = useState({
    prize: '',
    howToEnter: '',
    winner: '',
    txSignature: '',
    status: 'live' as 'live' | 'closed',
  })

  const add = () => {
    const item: Giveaway =
      draft.status === 'live'
        ? {
            prize: draft.prize.trim(),
            status: 'live',
            ...(draft.howToEnter.trim()
              ? { howToEnter: draft.howToEnter.trim() }
              : {}),
          }
        : {
            prize: draft.prize.trim(),
            status: 'closed',
            drawnAt: new Date().toISOString().slice(0, 10),
            winner: draft.winner.trim(),
            txSignature: draft.txSignature.trim(),
          }
    setItems([item, ...items])
    setDraft({ prize: '', howToEnter: '', winner: '', txSignature: '', status: 'live' })
  }

  const valid =
    draft.prize.trim().length > 0 &&
    (draft.status === 'live' ||
      (draft.winner.trim().length > 0 && draft.txSignature.trim().length > 0))

  return (
    <div className="mt-8 space-y-8">
      <section className="rounded-2xl border border-ash-800 bg-ash-900/50 p-6">
        <h2 className="font-display text-lg font-bold">Add a giveaway</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Prize">
            <input
              value={draft.prize}
              onChange={(e) => setDraft({ ...draft, prize: e.target.value })}
              placeholder="PSA 9 Blastoise, Base Set"
              className={inputCls}
            />
          </Field>
          <Field label="Status">
            <select
              value={draft.status}
              onChange={(e) =>
                setDraft({ ...draft, status: e.target.value as 'live' | 'closed' })
              }
              className={inputCls}
            >
              <option value="live">Running now</option>
              <option value="closed">Already drawn</option>
            </select>
          </Field>
          {draft.status === 'live' ? (
            <Field label="How to enter" hint="Shown on the card.">
              <input
                value={draft.howToEnter}
                onChange={(e) =>
                  setDraft({ ...draft, howToEnter: e.target.value })
                }
                placeholder="Hold $EMBER at the snapshot. Drawn live on stream Friday."
                className={inputCls}
              />
            </Field>
          ) : (
            <>
              <Field label="Winner wallet">
                <input
                  value={draft.winner}
                  onChange={(e) => setDraft({ ...draft, winner: e.target.value })}
                  className={`${inputCls} font-mono text-xs`}
                />
              </Field>
              <Field label="Send transaction" hint="Links to Solscan. This is the proof.">
                <input
                  value={draft.txSignature}
                  onChange={(e) =>
                    setDraft({ ...draft, txSignature: e.target.value })
                  }
                  className={`${inputCls} font-mono text-xs`}
                />
              </Field>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={add}
          disabled={!valid}
          className="mt-5 rounded-full bg-ember-600 px-6 py-2.5 text-sm font-semibold text-ash-950 transition-colors hover:bg-ember-500 disabled:opacity-30"
        >
          Add to the list
        </button>
      </section>

      {items.length === 0 ? (
        <p className="text-sm text-bone-500">Nothing listed yet.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((g, i) => (
            <li
              key={`${g.prize}-${i}`}
              className="flex flex-wrap items-baseline justify-between gap-3 rounded-xl border border-ash-800 bg-ash-900/40 p-4"
            >
              <div>
                <p className="text-sm font-semibold">{g.prize}</p>
                <p className="font-mono text-xs text-bone-500">
                  {g.status}
                  {g.drawnAt ? ` · ${g.drawnAt}` : ''}
                  {g.winner ? ` · ${g.winner.slice(0, 6)}…` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setItems(items.filter((_, x) => x !== i))}
                className="rounded-md border border-ash-600 px-3 py-1 text-xs font-semibold text-bone-500 transition-colors hover:border-ember-600 hover:text-ember-400"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => onPublish(items, `Giveaways: ${items.length} entr(y/ies)`)}
        className="w-full rounded-full bg-ember-600 px-7 py-3.5 font-display text-base font-bold text-ash-950 transition-colors hover:bg-ember-500"
      >
        Publish the giveaways
      </button>
    </div>
  )
}

/**
 * Rips en video's. Eén lijst voor allebei, want een gefilmde rip is niet twee
 * gebeurtenissen. Zet je hier een link bij een rip die er nog geen had, dan
 * kondigt de bot dat alsnog aan: dan is de video het nieuws.
 */
function RipsTab({
  items,
  setItems,
  onPublish,
}: {
  items: Rip[]
  setItems: (v: Rip[]) => void
  onPublish: (value: unknown, summary: string) => void
}) {
  const today = new Date().toISOString().slice(0, 10)
  const empty = { date: today, title: '', url: '', packs: '', pulls: '', note: '' }
  const [draft, setDraft] = useState(empty)

  const add = () => {
    const title = draft.title.trim()
    const pulls = draft.pulls
      .split('\n')
      .map((p) => p.trim())
      .filter(Boolean)

    const item: Rip = {
      // Datum plus een stukje van de titel: leesbaar en uniek genoeg om op
      // af te vinken, ook als er twee rips op dezelfde dag zijn.
      id: `${draft.date}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)}`,
      date: draft.date,
      title,
      ...(draft.url.trim() ? { url: draft.url.trim() } : {}),
      ...(draft.packs.trim() ? { packs: Number(draft.packs) } : {}),
      ...(pulls.length ? { pulls } : {}),
      ...(draft.note.trim() ? { note: draft.note.trim() } : {}),
    }

    setItems([item, ...items.filter((r) => r.id !== item.id)])
    setDraft({ ...empty, date: draft.date })
  }

  return (
    <div className="mt-8 space-y-8">
      <section className="rounded-2xl border border-ash-800 bg-ash-900/50 p-6">
        <h2 className="font-display text-lg font-bold">Log a rip or a video</h2>
        <p className="mt-2 text-sm text-bone-400">
          A rip without a link is one we opened but did not film. Add the link
          later and the bot posts it then, because at that point the video is
          the news.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Date">
            <input
              type="date"
              value={draft.date}
              onChange={(e) => setDraft({ ...draft, date: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="What it was">
            <input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="Three Phantasmal Flames packs"
              className={inputCls}
            />
          </Field>
          <Field label="Link" hint="TikTok, X, YouTube or Instagram. Leave empty if it was not filmed.">
            <input
              value={draft.url}
              onChange={(e) => setDraft({ ...draft, url: e.target.value })}
              placeholder="https://www.tiktok.com/@…/video/…"
              className={inputCls}
            />
          </Field>
          <Field label="Packs" hint="How many went open.">
            <input
              type="number"
              min="0"
              value={draft.packs}
              onChange={(e) => setDraft({ ...draft, packs: e.target.value })}
              className={inputCls}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field
              label="Note"
              hint="Only if the money did not come straight out of the rips wallet. Say so here rather than nowhere."
            >
              <input
                value={draft.note}
                onChange={(e) => setDraft({ ...draft, note: e.target.value })}
                placeholder="$11 came out of the rips wallet, the rest out of my own pocket."
                className={inputCls}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Pulls" hint="One per line. Only worth listing if it was any good.">
              <textarea
                rows={3}
                value={draft.pulls}
                onChange={(e) => setDraft({ ...draft, pulls: e.target.value })}
                placeholder={'Charmeleon 012/094\nBlastoise ex 200/191'}
                className={inputCls}
              />
            </Field>
          </div>
        </div>
        <button
          type="button"
          onClick={add}
          disabled={draft.title.trim().length === 0}
          className="mt-5 rounded-full bg-ember-600 px-6 py-2.5 text-sm font-semibold text-ash-950 transition-colors hover:bg-ember-500 disabled:opacity-30"
        >
          Add to the list
        </button>
      </section>

      {items.length === 0 ? (
        <p className="text-sm text-bone-500">Nothing logged yet.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((r, i) => (
            <li
              key={r.id}
              className="flex flex-wrap items-baseline justify-between gap-3 rounded-xl border border-ash-800 bg-ash-900/40 p-4"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold">{r.title}</p>
                <p className="font-mono text-xs text-bone-500">
                  {r.date}
                  {r.packs ? ` · ${r.packs} packs` : ''}
                  {r.url ? ' · filmed' : ' · not filmed'}
                  {r.pulls?.length ? ` · ${r.pulls.length} pulls` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setItems(items.filter((_, x) => x !== i))}
                className="rounded-md border border-ash-600 px-3 py-1 text-xs font-semibold text-bone-500 transition-colors hover:border-ember-600 hover:text-ember-400"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => onPublish(items, `Rips: ${items.length} logged`)}
        className="w-full rounded-full bg-ember-600 px-7 py-3.5 font-display text-base font-bold text-ash-950 transition-colors hover:bg-ember-500"
      >
        Publish the rips
      </button>
    </div>
  )
}
