import { json } from '../_lib/solana.js'
import { checkOperator } from '../_lib/operators.js'

/**
 * POST /api/draw-auth — mag deze wallet de trekkingstool openen?
 *
 * Houdt bezoekers uit de tool, zodat niemand een "EMBER-trekking" kan draaien
 * die er officieel uitziet. Het maakt het rekenwerk niet geheim: dat staat open
 * in de repository en hoort daar ook, want kijkers moeten onze uitslag kunnen
 * overdoen. Het slot zit op de tool, niet op de wiskunde.
 */
export async function onRequestPost({ request }) {
  let body
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Malformed request.' }, 400)
  }

  const { wallet, issuedAt, signature } = body ?? {}
  const bad = await checkOperator({
    purpose: 'unlock the draw tool',
    wallet,
    issuedAt,
    signature,
  })
  if (bad) return json({ error: bad.error }, bad.status)

  return json({ ok: true, wallet })
}
