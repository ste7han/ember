import { fetchHolders } from '../_lib/holders.js'
import { json } from '../_lib/solana.js'

/**
 * GET /api/holders — de holderlijst voor onze eigen token.
 *
 * De mint komt uit een secret en niet uit de query, zodat niemand dit endpoint
 * kan gebruiken om op onze rekening willekeurige tokens op te vragen. De
 * RPC-sleutel blijft aan de serverkant; zet je die in de frontend, dan staat
 * hij publiek in je JavaScript.
 *
 * Instellen met:
 *   npx wrangler pages secret put SOLANA_RPC_URL
 *   npx wrangler pages secret put EMBER_MINT
 *   npx wrangler pages secret put EMBER_EXCLUDE
 */
export async function onRequestGet({ env }) {
  const rpcUrl = env.SOLANA_RPC_URL
  const mint = env.EMBER_MINT
  const exclude = (env.EMBER_EXCLUDE ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  if (!rpcUrl || !mint) {
    return json(
      {
        error:
          'Not configured yet — set SOLANA_RPC_URL and EMBER_MINT as Pages secrets.',
      },
      503,
    )
  }

  try {
    const data = await fetchHolders({ rpcUrl, mint, exclude })
    // Kort cachen: tijdens een sessie klik je dit een paar keer aan, maar een
    // snapshot van een uur oud wil je juist niet.
    return json(data, 200, {
      'Cache-Control': 's-maxage=30, stale-while-revalidate=30',
    })
  } catch (err) {
    return json({ error: err.message }, 502)
  }
}
