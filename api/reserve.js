import {
  isSafeId,
  isSafeWallet,
  kv,
  kvConfigured,
  RESERVE_PREFIX,
  RESERVE_TTL_SECONDS,
} from './_kv.js'

/**
 * POST /api/reserve — leg een kaart 15 minuten vast voor één wallet.
 *
 * Het slot is `SET ... NX`: die zet de sleutel alleen als hij nog niet bestaat,
 * en dat gebeurt atomisch in Redis. Twee mensen die op dezelfde seconde
 * klikken kunnen dus niet allebei slagen — precies één krijgt 'OK', de ander
 * krijgt 409 met wie hem heeft en hoe lang nog.
 *
 * Dit sluit het gat niet volledig. Iemand kan nog steeds branden zónder te
 * reserveren, en die transactie kan niemand tegenhouden. Daarom staat op de
 * site de regel welke burn wint: die van de wallet die het slot had.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Use POST.' })
    return
  }
  if (!kvConfigured()) {
    res.status(503).json({
      error:
        'Reservations are not configured — set KV_REST_API_URL and KV_REST_API_TOKEN.',
    })
    return
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  const offerId = body?.offerId
  const wallet = body?.wallet

  if (!isSafeId(offerId)) {
    res.status(400).json({ error: 'Invalid card id.' })
    return
  }
  if (!isSafeWallet(wallet)) {
    res.status(400).json({ error: 'That does not look like a Solana address.' })
    return
  }

  const key = RESERVE_PREFIX + offerId

  try {
    const set = await kv([
      'SET',
      key,
      wallet,
      'NX',
      'EX',
      String(RESERVE_TTL_SECONDS),
    ])

    if (set === 'OK') {
      res.status(200).json({ wallet, expiresIn: RESERVE_TTL_SECONDS, mine: true })
      return
    }

    // Al bezet. Vertel wie, zodat de klikker ziet dat het niet aan hem ligt.
    const [holder, ttl] = await Promise.all([kv(['GET', key]), kv(['TTL', key])])

    // Zeldzaam: het slot verliep tussen SET en GET. Dan mag hij het opnieuw
    // proberen in plaats van een verwarrende foutmelding te krijgen.
    if (holder === null) {
      res.status(409).json({ error: 'Just missed it — try again.' })
      return
    }

    res.status(409).json({
      wallet: holder,
      expiresIn: Math.max(0, ttl ?? 0),
      mine: holder === wallet,
    })
  } catch (err) {
    res.status(502).json({ error: err.message })
  }
}
