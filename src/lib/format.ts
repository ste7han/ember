const nf = new Intl.NumberFormat('en-US')

export const num = (n: number) => nf.format(n)

/** $1.9 → "$1.90", en zonder decimalen boven de 100. */
export function usd(n: number, opts: { decimals?: number } = {}) {
  const decimals = opts.decimals ?? (n < 100 ? 2 : 0)
  return `$${n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`
}

/** 1_250_000 → "$1.25M" */
export function compactUsd(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`
  return usd(n)
}

/** "2026-08-01" → "Aug 1, 2026" */
export function shortDate(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/** Lange wallet/tx string inkorten tot "7xKX…8Wga". */
export const truncate = (s: string, head = 4, tail = 4) =>
  s.length <= head + tail + 1 ? s : `${s.slice(0, head)}…${s.slice(-tail)}`
