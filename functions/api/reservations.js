import { json } from '../_lib/solana.js'

/**
 * GET /api/reservations — welke kaarten op dit moment vastliggen.
 *
 * Geeft per kaart de wallet en de resterende seconden, zodat de site een
 * lopende klok kan tonen zonder elke seconde te hoeven pollen.
 */
export async function onRequestGet({ env }) {
  if (!env.DB) {
    // Geen database: geen sloten. De site werkt gewoon door, alleen zonder
    // reserveerknop — vandaar 200 en geen foutcode.
    return json({ configured: false, reservations: {} })
  }

  const now = Date.now()
  const { results } = await env.DB.prepare(
    'select offer_id, wallet, expires_at from reservations where expires_at > ?',
  )
    .bind(now)
    .all()

  const reservations = {}
  for (const row of results ?? []) {
    reservations[row.offer_id] = {
      wallet: row.wallet,
      expiresIn: Math.max(0, Math.round((row.expires_at - now) / 1000)),
    }
  }

  return json(
    { configured: true, reservations },
    200,
    { 'Cache-Control': 'no-store' },
  )
}
