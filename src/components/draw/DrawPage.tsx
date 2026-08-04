import { useCallback, useMemo, useRef, useState } from 'react'
import { site } from '../../data/site'
import {
  buildReel,
  dedupeHolders,
  drawWinner,
  parseHolders,
  shortWallet,
  totalWeight,
  type DrawResult,
  type Holder,
} from '../../lib/raffle'
import { num } from '../../lib/format'
import { Flame } from '../Flame'
import { CELL_W, REEL_LEN, Reel, WINNER_INDEX } from './Reel'
import { VerifyPanel } from './VerifyPanel'

const SPIN_MS = 7200

type Phase = 'setup' | 'spinning' | 'done'

type Entry = {
  prize: string
  wallet: string
  effectiveSeed: string
  hashHex: string
  oddsPct: number
}

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
      {hint && <span className="mt-1.5 block text-xs text-bone-500">{hint}</span>}
    </label>
  )
}

const inputCls =
  'mt-2 w-full rounded-lg border border-ash-700 bg-ash-900 px-4 py-3 text-sm text-bone-100 placeholder:text-bone-500/60 focus:border-ember-600 focus:outline-none'

const today = () => new Date().toISOString().slice(0, 10)

const UNLOCK_KEY = 'ember:draw-unlocked'

/**
 * Alleen onze eigen wallets mogen een trekking draaien.
 *
 * Let op wat dit is en niet is. Het houdt bezoekers uit de tool, zodat niemand
 * per ongeluk of expres een "EMBER-trekking" kan draaien die er officieel
 * uitziet. Het maakt het rekenwerk niet geheim: dat staat open in de repository
 * en hoort daar ook, want kijkers moeten onze uitslag kunnen overdoen. Daarvoor
 * is de controlemodus hieronder.
 */
function useDrawAccess() {
  const [unlocked, setUnlocked] = useState(
    () => sessionStorage.getItem(UNLOCK_KEY) === 'yes',
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const unlock = async () => {
    setError(null)
    setBusy(true)
    try {
      const w = window as unknown as Record<string, any>
      const provider = w.phantom?.solana ?? w.solflare ?? w.solana
      if (!provider) throw new Error('No browser wallet found.')

      const { publicKey } = await provider.connect()
      const wallet = publicKey.toString()
      const issuedAt = new Date().toISOString()
      const message = [
        'EMBER: unlock the draw tool',
        '',
        `Wallet: ${wallet}`,
        `Time: ${issuedAt}`,
        '',
        'Signing this proves you control this wallet.',
        'It is not a transaction and costs nothing.',
      ].join('\n')

      const { signature } = await provider.signMessage(
        new TextEncoder().encode(message),
        'utf8',
      )

      const res = await fetch('/api/draw-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet,
          issuedAt,
          signature: btoa(String.fromCharCode(...signature)),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Could not unlock.')

      sessionStorage.setItem(UNLOCK_KEY, 'yes')
      setUnlocked(true)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return { unlocked, unlock, busy, error }
}

export function DrawPage() {
  const access = useDrawAccess()
  const [prize, setPrize] = useState('')
  const [holdersText, setHoldersText] = useState('')
  const [seed, setSeed] = useState('')
  const [excludePastWinners, setExcludePastWinners] = useState(true)
  const [phase, setPhase] = useState<Phase>('setup')
  const [result, setResult] = useState<DrawResult | null>(null)
  const [reel, setReel] = useState<Holder[]>([])
  const [jitter, setJitter] = useState(0)
  /**
   * De pool zoals die was op het moment van trekken. De live berekening blijft
   * doorlopen zodra de winnaar in de historie staat, en dan zou de kop een ander
   * totaal tonen dan het bewijsblok. Die twee moeten identiek zijn.
   */
  const [drawnPoolCount, setDrawnPoolCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [history, setHistory] = useState<Entry[]>([])
  const [loadingHolders, setLoadingHolders] = useState(false)
  /** Melding bij de knop zelf. De foutregel verderop staat te ver weg om op te vallen. */
  const [loadNote, setLoadNote] = useState<{ ok: boolean; text: string } | null>(
    null,
  )

  // De reel-callback vuurt pas na de animatie; via refs blijft hij stabiel.
  const pending = useRef<{ result: DrawResult; prize: string; seed: string } | null>(
    null,
  )

  const holders = useMemo(
    () => dedupeHolders(parseHolders(holdersText)),
    [holdersText],
  )

  const wonWallets = useMemo(
    () => new Set(history.map((h) => h.wallet)),
    [history],
  )

  const eligible = useMemo(
    () =>
      excludePastWinners
        ? holders.filter((h) => !wonWallets.has(h.wallet))
        : holders,
    [holders, wonWallets, excludePastWinners],
  )

  const total = useMemo(() => totalWeight(eligible), [eligible])

  /**
   * Elke trekking krijgt zijn eigen seed door het volgnummer eraan te plakken.
   * Zonder dit zou dezelfde masterseed elke keer dezelfde winnaar opleveren, en
   * dat is precies de fout die je live niet wilt maken. Volledig verifieerbaar:
   * kijkers kennen de masterseed en zien het volgnummer op het scherm.
   */
  const drawNumber = history.length + 1
  const effectiveSeed = `${seed.trim()}#${drawNumber}`

  const canDraw = eligible.length > 0 && seed.trim().length > 0

  const start = async () => {
    setError(null)
    try {
      const drawn = await drawWinner(eligible, effectiveSeed)
      pending.current = { result: drawn, prize, seed: effectiveSeed }
      setResult(drawn)
      setReel(buildReel(eligible, drawn.winner, REEL_LEN, WINNER_INDEX))
      setJitter((Math.random() - 0.5) * CELL_W * 0.5)
      setDrawnPoolCount(eligible.length)
      setPhase('spinning')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const onSettled = useCallback(() => {
    setPhase('done')
    const p = pending.current
    if (!p) return
    pending.current = null
    setHistory((h) => [
      ...h,
      {
        prize: p.prize || 'Unnamed prize',
        wallet: p.result.winner.wallet,
        effectiveSeed: p.seed,
        hashHex: p.result.hashHex,
        oddsPct: p.result.oddsPct,
      },
    ])
  }, [])

  /** Volgende prijs: holders en masterseed blijven staan, prijsveld leeg. */
  const nextDraw = () => {
    setPhase('setup')
    setResult(null)
    setReel([])
    setPrize('')
    setCopied(null)
  }

  /**
   * Holders ophalen via /api/holders en in het tekstvak zetten.
   *
   * Bewust géén stille bron: de opgehaalde lijst landt zichtbaar in het veld,
   * je kunt hem aanpassen en je downloadt hem voordat je draait. Zou de tool
   * de holders alleen intern ophalen, dan is de momentopname na afloop weg en
   * kan niemand de uitslag nog narekenen — en dat is het enige wat deze tool
   * te bieden heeft.
   */
  const loadHolders = async () => {
    setLoadingHolders(true)
    setError(null)
    setLoadNote(null)
    try {
      const res = await fetch('/api/holders')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `${res.status} ${res.statusText}`)

      setHoldersText(
        data.holders
          .map((h: { owner: string; amount: number }) => `${h.owner},${h.amount}`)
          .join('\n'),
      )
      setLoadNote({
        ok: true,
        text:
          `${num(data.holders.length)} holders loaded` +
          (data.excluded.length
            ? ` · ${num(data.excluded.length)} wallet(s) excluded: ${data.excluded
                .map((e: { owner: string }) => shortWallet(e.owner))
                .join(', ')}`
            : ' · nothing excluded, check that the LP and fee wallet are in EMBER_EXCLUDE'),
      })
    } catch (err) {
      setLoadNote({ ok: false, text: (err as Error).message })
    } finally {
      setLoadingHolders(false)
    }
  }

  /** De snapshot als bestand bewaren. Zonder dit is de uitslag niet narekenbaar. */
  const downloadSnapshot = () => {
    const blob = new Blob([holdersText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ember-holders-${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      // Clipboard geweigerd; de tekst blijft selecteerbaar op het scherm.
    }
  }

  const sessionJson = JSON.stringify(
    history.map((h) => ({
      prize: h.prize,
      status: 'closed',
      drawnAt: today(),
      winner: h.wallet,
      txSignature: '',
    })),
    null,
    2,
  )

  return (
    <div className="min-h-screen">
      <header className="border-b border-ash-800 px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <a href="#" className="flex items-center gap-2">
            <Flame className="h-6 w-6" />
            <span className="font-display text-lg font-extrabold tracking-tight">
              {site.name}
            </span>
          </a>
          <span className="font-mono text-xs tracking-[0.18em] text-ember-500 uppercase">
            Live draw · #{drawNumber}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        {!access.unlocked ? (
          <>
            <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
              Check a draw.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-bone-300">
              Running a draw is something only we do, from the wallet that pays
              for the cards. Checking one is something anyone can do, and that is
              the part that matters. Paste the snapshot and the seed we published
              and you will land on the same winner we did.
            </p>

            <VerifyPanel />

            <div className="mt-12 border-t border-ash-800 pt-8">
              <p className="max-w-2xl text-sm leading-relaxed text-bone-500">
                Running the draws is limited to the {site.name} wallets. The
                maths is not: it is{' '}
                <span className="font-mono text-xs">SHA-256(seed)</span> over the
                weighted holder list, and that code is public. You do not need
                our permission to check us.
              </p>
              <button
                type="button"
                onClick={access.unlock}
                disabled={access.busy}
                className="mt-4 rounded-full border border-ash-600 px-5 py-2.5 text-sm font-semibold transition-colors hover:border-ember-600 hover:text-ember-400 disabled:opacity-40"
              >
                {access.busy ? 'Waiting for your wallet…' : 'Unlock with wallet'}
              </button>
              {access.error && (
                <p className="mt-3 text-sm text-ember-400">{access.error}</p>
              )}
            </div>
          </>
        ) : phase === 'setup' ? (
          <>
            <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
              {history.length === 0 ? 'Set up the draw' : `Draw #${drawNumber}`}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-bone-300">
              Paste a holder snapshot once, then run as many draws as you have
              cards to give away. The winner is picked by weight, so more tokens
              means more tickets. Every draw is reproducible from its seed, which
              means anyone watching can check the result afterwards.
            </p>

            {/*
              De tool staat open omdat kijkers onze uitslag moeten kunnen
              overdoen. Daar hoort bij dat iemand er ook een eigen uitslag mee
              kan draaien, dus zeggen we hardop wat wel en niet telt.
            */}
            <p className="mt-4 max-w-2xl rounded-xl border border-ash-700 bg-ash-900/60 p-4 text-sm leading-relaxed text-bone-300">
              <strong className="font-semibold text-bone-100">
                This page is open to everyone on purpose.
              </strong>{' '}
              It's how you check our draws: same snapshot, same seed, same
              winner. It also means anyone can spin one here, so a result only
              counts once it's published on the {site.name} site with the
              transaction that sent the card. A screenshot of this screen proves
              nothing on its own.
            </p>

            <div className="mt-10 grid gap-8 lg:grid-cols-[1.3fr_1fr]">
              <div className="space-y-6">
                <Field
                  label="Holder snapshot"
                  hint="One holder per line: wallet then balance, separated by a comma, tab or space. Paste it once at the start of the session and leave it."
                >
                  <textarea
                    value={holdersText}
                    onChange={(e) => setHoldersText(e.target.value)}
                    rows={12}
                    spellCheck={false}
                    placeholder={
                      '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU,1250000\n9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM,980500'
                    }
                    className={`${inputCls} resize-y font-mono text-xs`}
                  />
                </Field>

                <div className="-mt-3 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={loadHolders}
                    disabled={loadingHolders}
                    className="rounded-md border border-ash-600 px-3 py-1.5 text-xs font-semibold transition-colors hover:border-ember-600 hover:text-ember-400 disabled:opacity-50"
                  >
                    {loadingHolders ? 'Loading…' : 'Load holders'}
                  </button>
                  <button
                    type="button"
                    onClick={downloadSnapshot}
                    disabled={holders.length === 0}
                    className="rounded-md border border-ash-600 px-3 py-1.5 text-xs font-semibold transition-colors hover:border-ember-600 hover:text-ember-400 disabled:opacity-40"
                  >
                    Save snapshot
                  </button>
                  {loadNote && (
                    <span
                      className={`font-mono text-xs ${
                        loadNote.ok ? 'text-bone-500' : 'text-ember-400'
                      }`}
                    >
                      {loadNote.text}
                    </span>
                  )}
                </div>

                {history.length > 0 && (
                  <div className="rounded-xl border border-ash-700 bg-ash-900/60 p-5">
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-mono text-[0.65rem] tracking-[0.18em] text-bone-500 uppercase">
                        This session
                      </p>
                      <button
                        type="button"
                        onClick={() => copy('session', sessionJson)}
                        className="rounded-md border border-ash-600 px-3 py-1 text-xs font-semibold transition-colors hover:border-ember-600 hover:text-ember-400"
                      >
                        {copied === 'session' ? 'Copied' : 'Copy all as JSON'}
                      </button>
                    </div>
                    <ol className="mt-4 space-y-2 text-sm">
                      {history.map((h, i) => (
                        <li
                          key={`${h.wallet}-${i}`}
                          className="flex items-baseline justify-between gap-4 border-b border-ash-800 pb-2 last:border-0"
                        >
                          <span className="truncate">
                            <span className="font-mono text-xs text-bone-500">
                              #{i + 1}
                            </span>{' '}
                            {h.prize}
                          </span>
                          <span className="shrink-0 font-mono text-xs text-ember-400">
                            {shortWallet(h.wallet)}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <Field label="Prize">
                  <input
                    value={prize}
                    onChange={(e) => setPrize(e.target.value)}
                    placeholder="PSA 9 Blastoise, Base Set"
                    className={inputCls}
                  />
                </Field>

                <Field
                  label="Master seed"
                  hint="Set this once per session. Use something nobody could predict, like the hash of a Solana block you announce on stream. Each draw appends its number, so draw 2 uses seed#2."
                >
                  <input
                    value={seed}
                    onChange={(e) => setSeed(e.target.value)}
                    placeholder="Solana blockhash, or any public value"
                    className={`${inputCls} font-mono text-xs`}
                  />
                </Field>

                {seed.trim() && (
                  <p className="-mt-3 font-mono text-xs break-all text-bone-500">
                    This draw uses{' '}
                    <span className="text-ember-400">{effectiveSeed}</span>
                  </p>
                )}

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-ash-700 bg-ash-900/60 p-4">
                  <input
                    type="checkbox"
                    checked={excludePastWinners}
                    onChange={(e) => setExcludePastWinners(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-ember-600"
                  />
                  <span className="text-sm">
                    <span className="font-semibold">
                      One prize per wallet
                    </span>
                    <span className="mt-0.5 block text-xs text-bone-500">
                      Wallets that already won this session are removed from the
                      pool.
                    </span>
                  </span>
                </label>

                <div className="rounded-xl border border-ash-700 bg-ash-900/60 p-5">
                  <p className="font-mono text-[0.65rem] tracking-[0.18em] text-bone-500 uppercase">
                    Pool
                  </p>
                  <dl className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-bone-500">Eligible holders</dt>
                      <dd className="tnum font-semibold">
                        {num(eligible.length)}
                        {eligible.length !== holders.length && (
                          <span className="text-bone-500">
                            {' '}
                            of {num(holders.length)}
                          </span>
                        )}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-bone-500">Total weight</dt>
                      <dd className="tnum font-semibold">
                        {total.toLocaleString('en-US', {
                          maximumFractionDigits: 0,
                        })}
                      </dd>
                    </div>
                  </dl>
                </div>

                {error && <p className="text-sm text-ember-400">{error}</p>}

                <button
                  type="button"
                  onClick={start}
                  disabled={!canDraw}
                  className="w-full rounded-full bg-ember-600 px-7 py-4 font-display text-base font-bold text-ash-950 transition-colors hover:bg-ember-500 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  {canDraw
                    ? `Spin for draw #${drawNumber}`
                    : holders.length === 0
                      ? 'Paste holders first'
                      : eligible.length === 0
                        ? 'Everyone has won already'
                        : 'Enter a seed'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-4xl">
                {prize || 'Drawing now'}
              </h1>
              <p className="tnum font-mono text-xs text-bone-500">
                {num(drawnPoolCount)} holders ·{' '}
                {(result?.totalWeight ?? 0).toLocaleString('en-US', {
                  maximumFractionDigits: 0,
                })}{' '}
                weight
              </p>
            </div>

            <div className="mt-8">
              <Reel
                reel={reel}
                spinning
                durationMs={SPIN_MS}
                jitterPx={jitter}
                onSettled={onSettled}
              />
            </div>

            {phase === 'done' && result && (
              <div className="mt-10 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
                <div className="rounded-2xl border border-ember-700/60 bg-ember-600/5 p-8">
                  <p className="font-mono text-xs tracking-[0.2em] text-ember-500 uppercase">
                    Winner
                  </p>
                  <p className="mt-4 font-display text-3xl font-extrabold tracking-tight break-all sm:text-4xl">
                    {shortWallet(result.winner.wallet)}
                  </p>
                  <p className="mt-3 font-mono text-xs break-all text-bone-500">
                    {result.winner.wallet}
                  </p>
                  <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-ember-700/30 pt-5 text-sm">
                    <div>
                      <dt className="text-bone-500">Held</dt>
                      <dd className="tnum mt-0.5 font-semibold">
                        {result.winner.balance.toLocaleString('en-US', {
                          maximumFractionDigits: 0,
                        })}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-bone-500">Odds</dt>
                      <dd className="tnum mt-0.5 font-semibold text-ember-400">
                        {result.oddsPct.toFixed(2)}%
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-ash-800 bg-ash-900/50 p-6">
                    <p className="font-mono text-[0.65rem] tracking-[0.18em] text-bone-500 uppercase">
                      Proof
                    </p>
                    <dl className="mt-4 space-y-3 text-xs">
                      <div>
                        <dt className="text-bone-500">Seed</dt>
                        <dd className="mt-0.5 font-mono break-all text-bone-100">
                          {history[history.length - 1]?.effectiveSeed ??
                            effectiveSeed}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-bone-500">SHA-256</dt>
                        <dd className="mt-0.5 font-mono break-all text-bone-100">
                          {result.hashHex}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-bone-500">Winning ticket</dt>
                        <dd className="tnum mt-0.5 font-mono text-bone-100">
                          {result.ticket.toLocaleString('en-US', {
                            maximumFractionDigits: 0,
                          })}{' '}
                          of{' '}
                          {result.totalWeight.toLocaleString('en-US', {
                            maximumFractionDigits: 0,
                          })}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <button
                    type="button"
                    onClick={nextDraw}
                    className="w-full rounded-full bg-ember-600 px-5 py-3.5 text-sm font-bold text-ash-950 transition-colors hover:bg-ember-500"
                  >
                    Next prize
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
