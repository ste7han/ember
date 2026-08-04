import { fetchHolders } from './_holders.js'

/**
 * GET /api/holders — de holderlijst voor onze eigen token.
 *
 * De mint komt uit een environment variable en niet uit de query, zodat niemand
 * dit endpoint kan gebruiken om op onze rekening willekeurige tokens op te
 * vragen. De RPC-sleutel blijft hier aan de serverkant; zet je die in de
 * frontend, dan staat hij publiek in je JavaScript.
 *
 * In te stellen in Vercel (Settings -> Environment Variables):
 *
 *   SOLANA_RPC_URL   bv. https://mainnet.helius-rpc.com/?api-key=...
 *   EMBER_MINT       het mint address van de token
 *   EMBER_EXCLUDE    komma-gescheiden wallets die niet mogen meeloten:
 *                    de liquidity pool, de fee-wallet, exchange-wallets
 */
export default async function handler(req, res) {
  const rpcUrl = process.env.SOLANA_RPC_URL
  const mint = process.env.EMBER_MINT
  const exclude = (process.env.EMBER_EXCLUDE ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  if (!rpcUrl || !mint) {
    res.status(503).json({
      error:
        'Not configured yet — set SOLANA_RPC_URL and EMBER_MINT as environment variables.',
    })
    return
  }

  try {
    const data = await fetchHolders({ rpcUrl, mint, exclude })
    // Kort cachen: tijdens een sessie klik je dit een paar keer aan, maar een
    // snapshot van een uur oud wil je juist niet.
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=30')
    res.status(200).json(data)
  } catch (err) {
    res.status(502).json({ error: err.message })
  }
}
