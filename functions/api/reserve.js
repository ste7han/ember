import {
  isSafeId,
  isSafeWallet,
  json,
  RESERVE_TTL_MS,
} from '../_lib/solana.js'

/**
 * POST /api/reserve — leg een kaart 15 minuten vast voor één wallet.
 *
 * Het slot is de primaire sleutel op `offer_id`: `insert or ignore` maakt
 * hooguit één rij aan, hoeveel mensen er ook tegelijk klikken. Dat is een
 * garantie van de database en niet van onze timing.
 *
 * Dit sluit het gat niet volledig. Iemand kan nog steeds branden zónder te
 * reserveren, en die transactie kan niemand tegenhouden. Daarom staat op de
 * site de regel welke burn wint: die van de wallet die het slot had.
 */
export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: 'Storage is not configured yet.' }, 503)

  let body
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Malformed request.' }, 400)
  }

  const { offerId, wallet } = body ?? {}
  if (!isSafeId(offerId)) return json({ error: 'Invalid card id.' }, 400)
  if (!isSafeWallet(wallet))
    return json({ error: 'That does not look like a Solana address.' }, 400)

  const now = Date.now()

  // Verlopen reserveringen opruimen, anders blokkeert een oude rij de kaart
  // voor altijd. Goedkoper dan een achtergrondtaak die kan uitvallen.
  await env.DB.prepare('delete from reservations where expires_at <= ?')
    .bind(now)
    .run()

  const expiresAt = now + RESERVE_TTL_MS
  const inserted = await env.DB.prepare(
    'insert or ignore into reservations (offer_id, wallet, expires_at) values (?, ?, ?)',
  )
    .bind(offerId, wallet, expiresAt)
    .run()

  if (inserted.meta.changes === 1) {
    return json({ wallet, expiresIn: Math.round(RESERVE_TTL_MS / 1000), mine: true })
  }

  // Al bezet. Vertel wie, zodat de klikker ziet dat het niet aan hem ligt.
  const row = await env.DB.prepare(
    'select wallet, expires_at from reservations where offer_id = ?',
  )
    .bind(offerId)
    .first()

  // Zeldzaam: verlopen tussen het opruimen en nu. Dan mag hij het opnieuw
  // proberen in plaats van een verwarrende melding te krijgen.
  if (!row) return json({ error: 'Just missed it — try again.' }, 409)

  return json(
    {
      wallet: row.wallet,
      expiresIn: Math.max(0, Math.round((row.expires_at - now) / 1000)),
      mine: row.wallet === wallet,
    },
    409,
  )
}
