import {
  isFresh,
  isSafeWallet,
  json,
  signingMessage,
  verifySignature,
} from '../_lib/solana.js'

/**
 * POST /api/address — een verzendadres opslaan bij een wallet.
 *
 * De server ziet het adres nooit: wat hier binnenkomt is al versleuteld in de
 * browser met de publieke sleutel uit `site.ts`. Wij bewaren die onleesbare
 * blob en verder niets. Zie scripts/read-addresses.mjs om ze te openen.
 *
 * Wat we wél controleren is dat de indiener over de wallet beschikt, via een
 * ondertekend bericht. Zonder die controle kan iedereen het adres van een
 * ander overschrijven met het zijne en zo prijzen onderscheppen.
 */
export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: 'Storage is not configured yet.' }, 503)

  let body
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Malformed request.' }, 400)
  }

  const { wallet, issuedAt, signature, envelope } = body ?? {}

  if (!isSafeWallet(wallet))
    return json({ error: 'That does not look like a Solana address.' }, 400)
  if (typeof issuedAt !== 'string' || !isFresh(issuedAt))
    return json({ error: 'Signature expired — please sign again.' }, 400)
  if (typeof signature !== 'string' || !envelope || envelope.v !== 1)
    return json({ error: 'Malformed request.' }, 400)

  const blob = JSON.stringify(envelope)
  // Een adres is nooit megabytes groot; dit houdt de opslag schoon.
  if (blob.length > 8000) return json({ error: 'That address is too long.' }, 413)

  let ok = false
  try {
    ok = await verifySignature(wallet, signingMessage(wallet, issuedAt), signature)
  } catch {
    ok = false
  }
  if (!ok) return json({ error: 'Signature did not match that wallet.' }, 401)

  await env.DB.prepare(
    `insert into addresses (wallet, envelope, saved_at) values (?, ?, ?)
     on conflict (wallet) do update set envelope = excluded.envelope, saved_at = excluded.saved_at`,
  )
    .bind(wallet, blob, new Date().toISOString())
    .run()

  return json({ ok: true })
}
