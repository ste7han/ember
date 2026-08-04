import { useState } from 'react'
import { site } from '../data/site'

/**
 * Vaste strip onder de nav. De ticker EMBER is niet uniek op Solana — er staan
 * al dode tokens met dezelfde naam. Deze balk maakt het echte contract address
 * onmogelijk te missen, en waarschuwt expliciet zolang we nog niet gelanceerd zijn.
 */
export function ContractBar() {
  const [copied, setCopied] = useState(false)

  if (!site.tokenAddress) {
    return (
      <div className="border-b border-ash-800 bg-ash-900/60 px-5 py-2 sm:px-8">
        <p className="mx-auto max-w-5xl text-center text-xs leading-relaxed text-bone-500">
          <span className="font-semibold text-ember-500">Not launched yet.</span>{' '}
          No ${site.ticker} contract exists. Any token trading under this name
          right now isn't us.
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
      // Clipboard geweigerd — het adres blijft gewoon leesbaar en selecteerbaar.
    }
  }

  return (
    <div className="border-b border-ash-800 bg-ash-900/60 px-5 py-2 sm:px-8">
      <div className="mx-auto flex max-w-5xl items-center justify-center gap-3">
        <span className="hidden shrink-0 font-mono text-[0.65rem] tracking-[0.15em] text-bone-500 uppercase sm:inline">
          Official CA
        </span>
        <code className="min-w-0 truncate font-mono text-xs text-bone-100">
          {site.tokenAddress}
        </code>
        <button
          type="button"
          onClick={copy}
          className="shrink-0 rounded border border-ash-600 px-2 py-0.5 text-[0.65rem] font-semibold transition-colors hover:border-ember-600 hover:text-ember-400"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  )
}
