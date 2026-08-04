import { json } from '../_lib/solana.js'

/**
 * GET /api/treasury — wat er op dit moment in de twee potten zit.
 *
 * De adressen staan publiek in site.ts; alleen de RPC-sleutel is een secret,
 * dus die aanroep moet hier gebeuren en niet in de browser.
 *
 * Dit toont het saldo dat er nú staat, dus wat nog uitgegeven moet worden. Wat
 * al besteed is staat los in collection.json. Die twee samen vertellen het hele
 * verhaal: dit ligt klaar, dat is er gekocht.
 */

const WALLETS = {
  hunt: '9buyzGoxoN2HQdtdueVdfbNPF5f9eboFcF4GfSzZEaLG',
  rips: 'AhjomZS8EPnY8vMVcWDehAF4NZxi7Y6Panr6f4K5oGUK',
}

const LAMPORTS_PER_SOL = 1_000_000_000

async function rpc(rpcUrl, method, params) {
  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 'ember', method, params }),
  })
  if (!res.ok) throw new Error(`RPC ${method}: ${res.status} ${res.statusText}`)
  const body = await res.json()
  if (body.error) throw new Error(`RPC ${method}: ${body.error.message}`)
  return body.result
}

/** Wrapped SOL — de mint waar DexScreener de koers van kent. */
const WSOL = 'So11111111111111111111111111111111111111112'

/**
 * De SOL-koers, zodat we er een bedrag naast kunnen zetten.
 *
 * Via DexScreener, dat de site al gebruikt voor de tokenprijs. CoinGecko werkte
 * hier niet: dat weigert verzoeken vanuit een Worker. Eén bron minder is
 * bovendien één afhankelijkheid minder die stuk kan.
 *
 * Mislukt het alsnog, dan tonen we gewoon alleen SOL — een ontbrekende koers
 * mag de hele sectie niet onderuit halen.
 */
async function solPriceUsd() {
  try {
    const res = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${WSOL}`,
    )
    if (!res.ok) return null
    const body = await res.json()
    const pairs = body?.pairs ?? []
    if (pairs.length === 0) return null
    // Diepste liquiditeit is de betrouwbaarste koers.
    const best = pairs.reduce((a, b) =>
      (b.liquidity?.usd ?? 0) > (a.liquidity?.usd ?? 0) ? b : a,
    )
    const price = Number(best.priceUsd)
    return Number.isFinite(price) ? price : null
  } catch {
    return null
  }
}

export async function onRequestGet({ env }) {
  const rpcUrl = env.SOLANA_RPC_URL
  if (!rpcUrl) {
    return json({ error: 'Not configured yet — set SOLANA_RPC_URL.' }, 503)
  }

  try {
    const [huntLamports, ripsLamports, price] = await Promise.all([
      rpc(rpcUrl, 'getBalance', [WALLETS.hunt]),
      rpc(rpcUrl, 'getBalance', [WALLETS.rips]),
      solPriceUsd(),
    ])

    const pot = (result) => {
      const sol = (result?.value ?? 0) / LAMPORTS_PER_SOL
      return { sol, usd: price === null ? null : sol * price }
    }

    return json(
      {
        hunt: pot(huntLamports),
        rips: pot(ripsLamports),
        solPriceUsd: price,
        fetchedAt: new Date().toISOString(),
      },
      200,
      // Kort cachen: elke bezoeker hoeft niet zijn eigen RPC-aanroep te kosten,
      // maar een saldo van een uur oud wil je ook niet tonen.
      { 'Cache-Control': 's-maxage=30, stale-while-revalidate=60' },
    )
  } catch (err) {
    return json({ error: err.message }, 502)
  }
}
