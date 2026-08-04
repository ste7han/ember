/**
 * Holders van één SPL-token ophalen en per eigenaar optellen.
 *
 * Bewust losgetrokken van de Vercel-handler, zodat dezelfde code lokaal in de
 * dev-server draait (zie vite.config.ts) en er dus niet één versie is die je
 * pas op productie voor het eerst echt uitprobeert.
 *
 * Twee dingen die hier gebeuren en die je makkelijk vergeet:
 *
 * 1. De chain geeft *token accounts*, geen mensen. Eén wallet kan er meerdere
 *    hebben. Niet optellen per eigenaar betekent dat zo iemand meerdere keren
 *    in de trekking zit.
 * 2. Een holderlijst bevat ook de liquidity pool, de fee-wallet en soms
 *    exchange-wallets. Die hebben enorme saldo's. Laat je ze staan, dan wint je
 *    eigen LP de eerste trekking.
 */

const TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
const TOKEN_2022_PROGRAM = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'

async function rpc(rpcUrl, method, params) {
  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 'ember', method, params }),
  })
  if (!res.ok) throw new Error(`RPC ${method}: ${res.status} ${res.statusText}`)
  const json = await res.json()
  if (json.error) throw new Error(`RPC ${method}: ${json.error.message}`)
  return json.result
}

/** Aantal decimalen, zodat we hele tokens teruggeven in plaats van base units. */
async function getDecimals(rpcUrl, mint) {
  const supply = await rpc(rpcUrl, 'getTokenSupply', [mint])
  return supply?.value?.decimals ?? 0
}

/**
 * Helius' DAS-methode. Pagineert netjes en is de enige route die bij duizenden
 * holders betrouwbaar is.
 */
async function viaGetTokenAccounts(rpcUrl, mint) {
  const rows = []
  for (let page = 1; page <= 50; page++) {
    const result = await rpc(rpcUrl, 'getTokenAccounts', {
      mint,
      page,
      limit: 1000,
      options: { showZeroBalance: false },
    })
    const accounts = result?.token_accounts ?? []
    for (const a of accounts) {
      rows.push({ owner: a.owner, raw: BigInt(a.amount ?? 0) })
    }
    if (accounts.length < 1000) break
  }
  return rows
}

/**
 * Standaard-RPC. Werkt zonder Helius, maar veel publieke endpoints weigeren
 * getProgramAccounts of kappen hem af bij grote sets — vandaar dat dit de
 * terugvaloptie is en niet de eerste keuze.
 */
async function viaGetProgramAccounts(rpcUrl, mint) {
  const rows = []
  for (const programId of [TOKEN_PROGRAM, TOKEN_2022_PROGRAM]) {
    let accounts = []
    try {
      accounts = await rpc(rpcUrl, 'getProgramAccounts', [
        programId,
        {
          encoding: 'jsonParsed',
          filters: [{ dataSize: 165 }, { memcmp: { offset: 0, bytes: mint } }],
        },
      ])
    } catch {
      continue // Token-2022 hoeft niet te bestaan voor deze mint.
    }
    for (const a of accounts ?? []) {
      const info = a?.account?.data?.parsed?.info
      if (!info?.owner) continue
      rows.push({ owner: info.owner, raw: BigInt(info.tokenAmount?.amount ?? 0) })
    }
  }
  return rows
}

export async function fetchHolders({ rpcUrl, mint, exclude = [] }) {
  if (!rpcUrl) throw new Error('No RPC URL configured.')
  if (!mint) throw new Error('No mint address configured.')

  let rows
  try {
    rows = await viaGetTokenAccounts(rpcUrl, mint)
  } catch {
    rows = await viaGetProgramAccounts(rpcUrl, mint)
  }

  const decimals = await getDecimals(rpcUrl, mint)
  const divisor = 10 ** decimals

  // Optellen per eigenaar: één wallet, één regel, ongeacht hoeveel accounts.
  const byOwner = new Map()
  for (const { owner, raw } of rows) {
    byOwner.set(owner, (byOwner.get(owner) ?? 0n) + raw)
  }

  const skip = new Set(exclude.filter(Boolean))
  const excluded = []
  const holders = []

  for (const [owner, raw] of byOwner) {
    const amount = Number(raw) / divisor
    if (amount <= 0) continue
    if (skip.has(owner)) {
      excluded.push({ owner, amount })
      continue
    }
    holders.push({ owner, amount })
  }

  holders.sort((a, b) => b.amount - a.amount)
  excluded.sort((a, b) => b.amount - a.amount)

  return { mint, decimals, holders, excluded, fetchedAt: new Date().toISOString() }
}
