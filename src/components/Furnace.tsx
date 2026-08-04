import { useEffect, useState } from 'react'
import { site } from '../data/site'
import type { FurnaceOffer } from '../data/types'
import {
  countdown,
  furnace,
  msLeft,
  phaseOf,
  type OfferPhase,
} from '../lib/furnace'
import { num, shortDate, truncate, usd } from '../lib/format'
import { photoUrl } from '../lib/photos'
import { useTokenStats } from '../hooks/useTokenStats'
import { useReservations, type Reservation } from '../hooks/useReservations'
import { Flame } from './Flame'
import { Section } from './ui/Section'

/**
 * Eén tik per seconde, gedeeld door de hele sectie. Elke kaart zijn eigen timer
 * geven zou hetzelfde doen, maar dan tien keer.
 */
function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [active])
  return now
}

const BADGE: Record<OfferPhase, { label: string; className: string }> = {
  open: { label: 'Open to claim', className: 'bg-ember-600 text-ash-950' },
  closing: { label: 'Burn window open', className: 'bg-ember-600 text-ash-950' },
  expired: {
    label: 'Goes to the draw',
    className: 'bg-ash-700 text-bone-300',
  },
  giveaway: { label: 'Draw only', className: 'bg-ash-700 text-bone-300' },
  claimed: { label: 'Claimed', className: 'bg-ash-800 text-bone-500' },
}

/** mm:ss — voor de reserveringsklok, die altijd onder een kwartier blijft. */
const mmss = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(
    seconds % 60,
  ).padStart(2, '0')}`

function ReserveBox({
  reservation,
  mineWallet,
  onReserve,
}: {
  reservation?: Reservation
  mineWallet?: string
  onReserve: (wallet: string) => Promise<{ ok: boolean; error?: string }>
}) {
  const [open, setOpen] = useState(false)
  const [wallet, setWallet] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isMine = Boolean(
    reservation && mineWallet && reservation.wallet === mineWallet,
  )

  if (reservation) {
    return (
      <div
        className={`mt-4 rounded-lg border px-3 py-2.5 ${
          isMine
            ? 'border-ember-600 bg-ember-600/10'
            : 'border-ash-700 bg-ash-900/60'
        }`}
      >
        <p className="tnum font-mono text-xs font-semibold text-ember-400">
          {isMine ? 'Yours for' : 'Reserved'} · {mmss(reservation.expiresIn)}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-bone-500">
          {isMine
            ? 'Burn from this wallet before the clock runs out.'
            : 'Someone else is claiming this one. If they let the clock run out it opens up again.'}
        </p>
      </div>
    )
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 w-full rounded-full bg-ember-600 px-4 py-2.5 text-sm font-semibold text-ash-950 transition-colors hover:bg-ember-500"
      >
        Reserve for 15 min
      </button>
    )
  }

  return (
    <form
      className="mt-4 space-y-2"
      onSubmit={async (e) => {
        e.preventDefault()
        setBusy(true)
        setError(null)
        const result = await onReserve(wallet.trim())
        setBusy(false)
        if (!result.ok) setError(result.error ?? 'Someone else got there first.')
      }}
    >
      <input
        value={wallet}
        onChange={(e) => setWallet(e.target.value)}
        placeholder="Your Solana wallet"
        spellCheck={false}
        className="w-full rounded-lg border border-ash-700 bg-ash-900 px-3 py-2 font-mono text-xs outline-none transition-colors focus:border-ember-600"
      />
      <button
        type="submit"
        disabled={busy || wallet.trim().length === 0}
        className="w-full rounded-full bg-ember-600 px-4 py-2.5 text-sm font-semibold text-ash-950 transition-colors hover:bg-ember-500 disabled:opacity-40"
      >
        {busy ? 'Holding…' : 'Hold it for me'}
      </button>
      {error && <p className="text-xs text-ember-400">{error}</p>}
      <p className="text-[0.7rem] leading-relaxed text-bone-500">
        You must burn from this exact wallet. That is how we know the claim is
        yours.
      </p>
    </form>
  )
}

function OfferCard({
  offer,
  now,
  priceUsd,
  reservation,
  mineWallet,
  canReserve,
  onReserve,
}: {
  offer: FurnaceOffer
  now: number
  priceUsd: number | null
  reservation?: Reservation
  mineWallet?: string
  canReserve: boolean
  onReserve: (wallet: string) => Promise<{ ok: boolean; error?: string }>
}) {
  const phase = phaseOf(offer, now)
  const left = msLeft(offer, now)
  const badge = BADGE[phase]
  const live = phase === 'open' || phase === 'closing'
  // Naam uit src/assets/vault/, of een letterlijk pad als het met / begint.
  const image = photoUrl(offer.image ?? offer.id)

  return (
    <li
      className={`overflow-hidden rounded-2xl border ${
        live
          ? 'border-ember-700/60 bg-ember-600/5'
          : 'border-ash-800 bg-ash-900/40'
      }`}
    >
      <div className="relative aspect-[63/88] bg-ash-800">
        {image ? (
          <img
            src={image}
            alt={offer.card}
            loading="lazy"
            className={`h-full w-full object-cover ${live ? '' : 'opacity-40 grayscale'}`}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-bone-500">
            <Flame className="h-8 w-8 opacity-40" />
            <span className="font-mono text-[0.65rem] tracking-[0.15em] uppercase">
              Photo soon
            </span>
          </div>
        )}
        <span
          className={`absolute top-3 right-3 rounded-full px-2.5 py-1 font-mono text-[0.65rem] font-semibold ${badge.className}`}
        >
          {badge.label}
        </span>
      </div>

      <div className="p-5">
        <p className="text-sm font-semibold">{offer.card}</p>
        {offer.note && (
          <p className="mt-1.5 text-xs leading-relaxed text-bone-500">
            {offer.note}
          </p>
        )}

        {live && offer.burnAmount !== undefined && (
          <div className="mt-4 border-t border-ash-800 pt-4">
            <p className="tnum font-display text-lg font-bold text-ember-400">
              {num(offer.burnAmount)}{' '}
              <span className="font-sans text-xs font-normal text-bone-500">
                ${site.ticker} to burn
              </span>
            </p>
            {priceUsd !== null && (
              <p className="tnum mt-1 font-mono text-xs text-bone-500">
                ≈ {usd(offer.burnAmount * priceUsd)} at today's price
              </p>
            )}
          </div>
        )}

        {phase === 'closing' && left !== null && (
          <p className="tnum mt-3 font-mono text-xs text-ember-400">
            {countdown(left)} left
          </p>
        )}

        {live && canReserve && (
          <ReserveBox
            reservation={reservation}
            mineWallet={mineWallet}
            onReserve={onReserve}
          />
        )}

        {phase === 'expired' && (
          <p className="mt-3 text-xs leading-relaxed text-bone-500">
            Nobody burned for it before{' '}
            {shortDate(offer.burnDeadline!.slice(0, 10))}, so it joins the next
            draw instead.
          </p>
        )}

        {offer.claim && (
          <div className="mt-4 border-t border-ash-800 pt-4">
            <p className="font-mono text-xs text-bone-500">
              Burned by {truncate(offer.claim.wallet)} ·{' '}
              {shortDate(offer.claim.at)}
            </p>
            <a
              href={`https://solscan.io/tx/${offer.claim.txSignature}`}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block font-mono text-xs text-ember-500 underline underline-offset-4 hover:text-ember-400"
            >
              {truncate(offer.claim.txSignature)}
            </a>
          </div>
        )}
      </div>
    </li>
  )
}

export function Furnace() {
  const hasTimers = furnace.some((o) => o.burnDeadline && !o.claim)
  const now = useNow(hasTimers)
  const { stats } = useTokenStats()
  const { reservations, configured, mine, reserve } = useReservations()

  return (
    <Section
      id="furnace"
      eyebrow="The furnace"
      title={
        <>
          Ember <span className="text-flame">costs you something.</span>
        </>
      }
      lede="Spare cards from the packs: duplicates, and anything outside the line. Burn the listed amount and the card is yours. Some have a clock, and when it runs out they go to the draw instead."
    >
      {/*
        De aanval waar de token naar vernoemd is heeft een prijs, en die staat
        letterlijk op de kaart. Dat is geen woordspeling achteraf maar precies
        hetzelfde mechanisme: je levert iets in om iets te krijgen.
      */}
      <blockquote className="mb-10 max-w-2xl border-l-2 border-ember-600 pl-5">
        <p className="font-display text-lg leading-snug font-bold text-bone-100 sm:text-xl">
          “Discard 1 Fire Energy card attached to Charmander in order to use
          this attack.”
        </p>
        <footer className="mt-2 font-mono text-xs text-bone-500">
          Ember · Charmander, Base Set 46/102 · 30 damage
        </footer>
        <p className="mt-4 text-sm leading-relaxed text-bone-300">
          The move this token is named after has always had a cost. You give
          something up to make it work. Same here. Burn ${site.ticker}, take a card
          off the pile.
        </p>
      </blockquote>
      {furnace.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ash-700 px-6 py-16 text-center">
          <Flame className="mx-auto h-8 w-8 opacity-40" />
          <p className="mt-5 font-display text-xl font-bold">
            The furnace is cold
          </p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-bone-300">
            Nothing to claim yet. The first cards land here once we've opened
            enough packs to have spares worth passing on.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {furnace.map((offer) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              now={now}
              priceUsd={stats?.priceUsd ?? null}
              reservation={reservations[offer.id]}
              mineWallet={mine[offer.id]}
              canReserve={configured}
              onReserve={(wallet) => reserve(offer.id, wallet)}
            />
          ))}
        </ul>
      )}

      <div className="mt-10 max-w-2xl border-l-2 border-ember-600 pl-5">
        <p className="text-sm leading-relaxed text-bone-300">
          <strong className="font-semibold text-bone-100">Reserve first.</strong>{' '}
          Holding a card locks it to your wallet for fifteen minutes. Burn
          without a reservation and someone else may have already taken it. Tokens
          can't be un-burned, so don't skip this step.
        </p>
        <p className="mt-3 font-mono text-xs break-all text-bone-500">
          {site.furnace.burnAddress}
        </p>
        <p className="mt-4 text-xs leading-relaxed text-bone-500">
          Checklist cards are never listed here.{' '}
          <a
            href="#/how"
            className="text-ember-500 underline underline-offset-4 transition-colors hover:text-ember-400"
          >
            Full furnace rules
          </a>
          .
        </p>
      </div>
    </Section>
  )
}
