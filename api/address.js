import { isSafeWallet, kv, kvConfigured } from './_kv.js'
import { isFresh, signingMessage, verifySignature } from './_solana.js'

const KEY = (wallet) => `ember:addr:${wallet}`

/**
 * POST /api/address — een verzendadres opslaan bij een wallet.
 *
 * De server ziet het adres nooit: wat hier binnenkomt is al versleuteld in de
 * browser met de publieke sleutel uit `site.ts`. Wij bewaren die onleesbare
 * blob en verder niets. Zie scripts/read-addresses.mjs om ze te openen.
 *
 * Wat we wél controleren is dat de indiener over de wallet beschikt, via een
 * ondertekend bericht. Zonder die controle kan iedereen het adres van een
 * ander overschrijven met het zijne.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Use POST.' })
    return
  }
  if (!kvConfigured()) {
    res.status(503).json({ error: 'Storage is not configured yet.' })
    return
  }

  let body
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  } catch {
    res.status(400).json({ error: 'Malformed request.' })
    return
  }

  const { wallet, issuedAt, signature, envelope } = body ?? {}

  if (!isSafeWallet(wallet)) {
    res.status(400).json({ error: 'That does not look like a Solana address.' })
    return
  }
  if (typeof issuedAt !== 'string' || !isFresh(issuedAt)) {
    res.status(400).json({ error: 'Signature expired — please sign again.' })
    return
  }
  if (typeof signature !== 'string' || !envelope || envelope.v !== 1) {
    res.status(400).json({ error: 'Malformed request.' })
    return
  }
  // Een adres is nooit megabytes groot; dit houdt de opslag schoon.
  if (JSON.stringify(envelope).length > 8000) {
    res.status(413).json({ error: 'That address is too long.' })
    return
  }

  let ok = false
  try {
    ok = verifySignature(wallet, signingMessage(wallet, issuedAt), signature)
  } catch {
    ok = false
  }
  if (!ok) {
    res.status(401).json({ error: 'Signature did not match that wallet.' })
    return
  }

  try {
    await kv([
      'SET',
      KEY(wallet),
      JSON.stringify({ envelope, savedAt: new Date().toISOString() }),
    ])
    res.status(200).json({ ok: true })
  } catch (err) {
    res.status(502).json({ error: err.message })
  }
}
