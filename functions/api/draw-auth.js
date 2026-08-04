import {
  isFresh,
  isSafeWallet,
  json,
  verifySignature,
} from '../_lib/solana.js'

/**
 * POST /api/draw-auth — mag deze wallet een trekking draaien?
 *
 * Alleen onze eigen wallets. De aanvrager ondertekent een bericht, wij
 * controleren de handtekening en of het adres in de lijst staat.
 *
 * Wat dit wél doet: voorkomen dat een willekeurige bezoeker de trekkingstool
 * gebruikt alsof hij namens EMBER iets weggeeft.
 *
 * Wat dit níet doet: het rekenwerk geheim maken. De winnaar volgt uit
 * SHA-256(seed) over de gewogen holderlijst, en die code staat open in de
 * repository. Dat is met opzet: kijkers moeten onze uitslag kunnen overdoen.
 * Het slot zit op de tool, niet op de wiskunde.
 */
const OPERATORS = [
  '9buyzGoxoN2HQdtdueVdfbNPF5f9eboFcF4GfSzZEaLG',
  'AhjomZS8EPnY8vMVcWDehAF4NZxi7Y6Panr6f4K5oGUK',
]

export const authMessage = (wallet, issuedAt) =>
  [
    'EMBER: unlock the draw tool',
    '',
    `Wallet: ${wallet}`,
    `Time: ${issuedAt}`,
    '',
    'Signing this proves you control this wallet.',
    'It is not a transaction and costs nothing.',
  ].join('\n')

export async function onRequestPost({ request }) {
  let body
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Malformed request.' }, 400)
  }

  const { wallet, issuedAt, signature } = body ?? {}

  if (!isSafeWallet(wallet))
    return json({ error: 'That does not look like a Solana address.' }, 400)
  if (typeof issuedAt !== 'string' || !isFresh(issuedAt))
    return json({ error: 'Signature expired, please sign again.' }, 400)
  if (typeof signature !== 'string')
    return json({ error: 'Malformed request.' }, 400)

  if (!OPERATORS.includes(wallet)) {
    return json(
      { error: 'That wallet does not run the draws for this project.' },
      403,
    )
  }

  let ok = false
  try {
    ok = await verifySignature(wallet, authMessage(wallet, issuedAt), signature)
  } catch {
    ok = false
  }
  if (!ok) return json({ error: 'Signature did not match that wallet.' }, 401)

  return json({ ok: true, wallet })
}
