export type Holder = {
  wallet: string
  balance: number
}

export type DrawResult = {
  winner: Holder
  /** Het winnende lot, ergens tussen 0 en totalWeight. */
  ticket: number
  totalWeight: number
  /** SHA-256 van de seed, hex. Hiermee kan iedereen de trekking narekenen. */
  hashHex: string
  /** Winkans van de winnaar, als percentage. */
  oddsPct: number
}

/**
 * Leest een geplakte holderlijst. Accepteert komma's, tabs, puntkomma's of
 * spaties als scheidingsteken, negeert een eventuele header en slaat regels
 * zonder bruikbaar saldo over.
 *
 * Voorbeeld:
 *   7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU,1250000
 *   9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM  980000.5
 */
export function parseHolders(input: string): Holder[] {
  const holders: Holder[] = []

  for (const line of input.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed) continue

    const parts = trimmed.split(/[,;\t]+|\s{1,}/).filter(Boolean)
    if (parts.length < 2) continue

    const wallet = parts[0]
    // Saldo mag duizendtalscheidingen bevatten (1,250,000 of 1.250.000).
    const balance = Number(parts[parts.length - 1].replace(/[^0-9.]/g, ''))

    // Header-regels en rommel vallen hier vanzelf af.
    if (!Number.isFinite(balance) || balance <= 0) continue
    if (wallet.length < 32) continue

    holders.push({ wallet, balance })
  }

  return holders
}

/** Meerdere regels voor dezelfde wallet worden opgeteld. */
export function dedupeHolders(holders: Holder[]): Holder[] {
  const totals = new Map<string, number>()
  for (const h of holders) {
    totals.set(h.wallet, (totals.get(h.wallet) ?? 0) + h.balance)
  }
  return [...totals].map(([wallet, balance]) => ({ wallet, balance }))
}

export const totalWeight = (holders: Holder[]) =>
  holders.reduce((n, h) => n + h.balance, 0)

/**
 * Zet een seed om in een getal tussen 0 en 1 via SHA-256. Deterministisch:
 * dezelfde seed geeft altijd hetzelfde resultaat, op elke computer. Dat is het
 * hele punt — kijkers kunnen de trekking zelf narekenen.
 */
async function seedToFraction(seed: string) {
  const bytes = new TextEncoder().encode(seed)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  const view = new Uint8Array(digest)

  let n = 0n
  for (let i = 0; i < 8; i++) n = (n << 8n) | BigInt(view[i])

  const hashHex = [...view]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  // 53 bits is precies wat een double exact aankan.
  const max = 2n ** 53n
  return { fraction: Number(n % max) / Number(max), hashHex }
}

/**
 * Trekt een winnaar, gewogen op saldo. Iemand met twee keer zoveel tokens heeft
 * exact twee keer zoveel kans.
 */
export async function drawWinner(
  holders: Holder[],
  seed: string,
): Promise<DrawResult> {
  if (holders.length === 0) throw new Error('No holders to draw from')

  const total = totalWeight(holders)
  const { fraction, hashHex } = await seedToFraction(seed)
  const ticket = fraction * total

  let cumulative = 0
  let winner = holders[holders.length - 1]

  for (const h of holders) {
    cumulative += h.balance
    if (ticket < cumulative) {
      winner = h
      break
    }
  }

  return {
    winner,
    ticket,
    totalWeight: total,
    hashHex,
    oddsPct: (winner.balance / total) * 100,
  }
}

/**
 * Bouwt de strip die over het scherm rolt. Namen worden gewogen getrokken, zodat
 * grote holders zichtbaar vaker langskomen — dat maakt de weging voelbaar in
 * plaats van alleen een regel tekst. De winnaar wordt op `winnerIndex` gezet.
 */
export function buildReel(
  holders: Holder[],
  winner: Holder,
  length: number,
  winnerIndex: number,
): Holder[] {
  const total = totalWeight(holders)
  const reel: Holder[] = []

  for (let i = 0; i < length; i++) {
    if (i === winnerIndex) {
      reel.push(winner)
      continue
    }

    let r = Math.random() * total
    let picked = holders[holders.length - 1]
    for (const h of holders) {
      r -= h.balance
      if (r <= 0) {
        picked = h
        break
      }
    }
    reel.push(picked)
  }

  return reel
}

/** Kort een wallet in tot "7xKX…gAsU". */
export const shortWallet = (w: string) =>
  w.length <= 12 ? w : `${w.slice(0, 4)}…${w.slice(-4)}`
