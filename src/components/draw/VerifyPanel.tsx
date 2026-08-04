import { useState } from 'react'
import { site } from '../../data/site'
import { dedupeHolders, drawWinner, parseHolders } from '../../lib/raffle'
import { num } from '../../lib/format'

/**
 * Een gepubliceerde trekking overdoen.
 *
 * Dit is wat een kijker nodig heeft en verder niets: de snapshot die wij
 * publiceerden, de seed die wij noemden, en dan het antwoord. Geen rol die
 * draait, geen sessie, geen prijzenlijst — dat is gereedschap voor degene die
 * de trekking hóudt.
 *
 * Het rekenwerk is exact hetzelfde als in de tool zelf: dezelfde functie,
 * dezelfde bestanden. Zou hier iets anders staan, dan bewees het niets.
 */
export function VerifyPanel() {
  const [holdersText, setHoldersText] = useState('')
  const [seed, setSeed] = useState('')
  const [result, setResult] = useState<{
    wallet: string
    hashHex: string
    oddsPct: number
    pool: number
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const run = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setResult(null)
    setBusy(true)
    try {
      const holders = dedupeHolders(parseHolders(holdersText))
      if (holders.length === 0) throw new Error('No holders found in that list.')
      const drawn = await drawWinner(holders, seed.trim())
      setResult({
        wallet: drawn.winner.wallet,
        hashHex: drawn.hashHex,
        oddsPct: drawn.oddsPct,
        pool: holders.length,
      })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const inputCls =
    'mt-2 w-full rounded-lg border border-ash-700 bg-ash-900 px-4 py-3 text-sm outline-none transition-colors focus:border-ember-600'

  return (
    <form onSubmit={run} className="mt-8 max-w-2xl space-y-5">
      <label className="block">
        <span className="font-mono text-[0.65rem] tracking-[0.18em] text-bone-500 uppercase">
          The snapshot we published
        </span>
        <textarea
          value={holdersText}
          onChange={(e) => setHoldersText(e.target.value)}
          rows={8}
          spellCheck={false}
          placeholder={'wallet,balance\nwallet,balance'}
          className={`${inputCls} resize-y font-mono text-xs`}
        />
      </label>

      <label className="block">
        <span className="font-mono text-[0.65rem] tracking-[0.18em] text-bone-500 uppercase">
          The seed we announced
        </span>
        <input
          value={seed}
          onChange={(e) => setSeed(e.target.value)}
          spellCheck={false}
          placeholder="blockhash#1"
          className={`${inputCls} font-mono text-xs`}
        />
        <span className="mt-1.5 block text-xs text-bone-500">
          Include the draw number, so the second draw of a session is
          <span className="font-mono"> seed#2</span>.
        </span>
      </label>

      <button
        type="submit"
        disabled={busy || !holdersText.trim() || !seed.trim()}
        className="rounded-full bg-ember-600 px-7 py-3 font-display text-sm font-bold text-ash-950 transition-colors hover:bg-ember-500 disabled:cursor-not-allowed disabled:opacity-30"
      >
        {busy ? 'Working…' : 'Work out the winner'}
      </button>

      {error && <p className="text-sm text-ember-400">{error}</p>}

      {result && (
        <div className="rounded-2xl border border-ember-700/60 bg-ember-600/5 p-6">
          <p className="font-mono text-[0.65rem] tracking-[0.18em] text-bone-500 uppercase">
            Winner
          </p>
          <p className="mt-2 font-mono text-sm break-all text-bone-100">
            {result.wallet}
          </p>
          <dl className="mt-5 space-y-2 font-mono text-xs text-bone-500">
            <div className="flex justify-between gap-4">
              <dt>Pool</dt>
              <dd className="tnum">{num(result.pool)} wallets</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Odds for this wallet</dt>
              <dd className="tnum">{result.oddsPct.toFixed(2)}%</dd>
            </div>
            <div>
              <dt>SHA-256 of the seed</dt>
              <dd className="tnum mt-1 break-all text-bone-300">
                {result.hashHex}
              </dd>
            </div>
          </dl>
          <p className="mt-5 text-sm leading-relaxed text-bone-300">
            If that matches what {site.name} published, the draw was honest. It
            will match on any computer, because nothing here is random once the
            seed is fixed.
          </p>
        </div>
      )}
    </form>
  )
}
