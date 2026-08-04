import { kvConfigured, kvPipeline, kv, RESERVE_PREFIX } from './_kv.js'

/**
 * GET /api/reservations — welke kaarten op dit moment vastliggen.
 *
 * Geeft per kaart de wallet en de resterende seconden terug, zodat de site een
 * lopende klok kan tonen zonder elke seconde te hoeven pollen.
 *
 * `KEYS` is normaal een slecht idee in Redis, maar hier gaat het om hooguit een
 * handvol sleutels die bovendien vanzelf verlopen. Een index bijhouden zou meer
 * code zijn die kan gaan afwijken van de werkelijkheid.
 */
export default async function handler(_req, res) {
  if (!kvConfigured()) {
    // Geen database ingesteld: geen reserveringen. De site werkt dan gewoon
    // door, alleen zonder slot — vandaar 200 en niet een foutcode.
    res.status(200).json({ configured: false, reservations: {} })
    return
  }

  try {
    const keys = (await kv(['KEYS', `${RESERVE_PREFIX}*`])) ?? []
    if (keys.length === 0) {
      res.status(200).json({ configured: true, reservations: {} })
      return
    }

    const values = await kvPipeline(keys.map((k) => ['GET', k]))
    const ttls = await kvPipeline(keys.map((k) => ['TTL', k]))

    const reservations = {}
    keys.forEach((key, i) => {
      const wallet = values[i]
      const ttl = ttls[i]
      if (!wallet || typeof ttl !== 'number' || ttl <= 0) return
      reservations[key.slice(RESERVE_PREFIX.length)] = {
        wallet,
        expiresIn: ttl,
      }
    })

    res.setHeader('Cache-Control', 'no-store')
    res.status(200).json({ configured: true, reservations })
  } catch (err) {
    res.status(502).json({ error: err.message })
  }
}
