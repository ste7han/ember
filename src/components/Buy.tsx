import { useState } from 'react'
import { site } from '../data/site'
import { useTokenStats } from '../hooks/useTokenStats'
import { compactUsd } from '../lib/format'
import { Flame } from './Flame'
import { Button } from './ui/Button'
import { Section } from './ui/Section'

function ContractAddress() {
  const [copied, setCopied] = useState(false)

  if (!site.tokenAddress) {
    return (
      <div className="rounded-xl border border-dashed border-ash-700 px-5 py-4">
        <p className="font-mono text-xs tracking-[0.15em] text-bone-500 uppercase">
          Contract address
        </p>
        <p className="mt-2 text-sm text-bone-300">
          Published here the moment we launch. Anything circulating before then
          isn't us.
        </p>
      </div>
    )
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(site.tokenAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard geweigerd (bv. onveilige context) — adres blijft leesbaar.
    }
  }

  return (
    <div className="rounded-xl border border-ash-700 bg-ash-900/60 px-5 py-4">
      <p className="font-mono text-xs tracking-[0.15em] text-bone-500 uppercase">
        Contract address
      </p>
      <div className="mt-2 flex items-center gap-3">
        <code className="min-w-0 flex-1 truncate font-mono text-sm text-bone-100">
          {site.tokenAddress}
        </code>
        <button
          type="button"
          onClick={copy}
          className="shrink-0 rounded-md border border-ash-600 px-3 py-1.5 text-xs font-semibold transition-colors hover:border-ember-600 hover:text-ember-400"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  )
}

export function Buy() {
  const { stats, status } = useTokenStats()

  return (
    <Section
      id="buy"
      eyebrow="Join in"
      title={
        <>
          Buy <span className="text-flame">${site.ticker}</span>
        </>
      }
      lede={
        status === 'live' && stats?.marketCapUsd
          ? `Currently ${compactUsd(stats.marketCapUsd)} market cap. Every trade feeds the vault.`
          : "Not launched yet. Follow on X or join the Telegram to get the contract address the second it goes live, and don't trust it from anywhere else."
      }
    >
      <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-4">
          <ContractAddress />
          <div className="flex flex-wrap gap-3">
            <Button href={site.links.pumpfun || undefined}>
              <Flame className="h-4 w-4" />
              pump.fun
            </Button>
            <Button href={site.links.dexscreener || undefined} variant="ghost">
              DexScreener
            </Button>
            <Button href={site.links.x || undefined} variant="ghost">
              Follow on X
            </Button>
            {site.links.telegram && (
              <Button href={site.links.telegram} variant="ghost">
                Telegram
              </Button>
            )}
            {site.links.youtube && (
              <Button href={site.links.youtube} variant="ghost">
                YouTube
              </Button>
            )}
          </div>
        </div>

        <aside className="rounded-2xl border border-ash-800 bg-ash-900/50 p-6">
          <h3 className="font-display text-lg font-bold">Before you buy</h3>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-bone-300">
            <li className="flex gap-3">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ember-600" />
              This is a memecoin. It's speculative and you can lose everything you
              put in.
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ember-600" />
              We promise cards and receipts, never a price or a return.
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ember-600" />
              Only ever buy from the address published on this page.
            </li>
          </ul>
        </aside>
      </div>
    </Section>
  )
}
