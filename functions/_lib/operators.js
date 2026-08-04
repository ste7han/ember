import { isFresh, isSafeWallet, verifySignature } from './solana.js'

/**
 * De wallets die namens EMBER mogen handelen: trekkingen draaien, aanbod
 * publiceren, uitslagen vastleggen.
 *
 * Bewust dezelfde twee als waar de fees binnenkomen. Wie de kaarten betaalt is
 * wie ze weggeeft, en dat is op Solscan te volgen.
 */
export const OPERATORS = [
  '9buyzGoxoN2HQdtdueVdfbNPF5f9eboFcF4GfSzZEaLG',
  'AhjomZS8EPnY8vMVcWDehAF4NZxi7Y6Panr6f4K5oGUK',
]

/**
 * Het bericht dat een operator ondertekent. `purpose` staat erin zodat een
 * handtekening voor het ontgrendelen van de trekkingstool niet hergebruikt kan
 * worden om iets te publiceren.
 */
export const operatorMessage = (purpose, wallet, issuedAt) =>
  [
    `EMBER: ${purpose}`,
    '',
    `Wallet: ${wallet}`,
    `Time: ${issuedAt}`,
    '',
    'Signing this proves you control this wallet.',
    'It is not a transaction and costs nothing.',
  ].join('\n')

/**
 * Controleert een ondertekend verzoek van een operator.
 * Geeft null terug als het klopt, anders een { error, status }.
 */
export async function checkOperator({ purpose, wallet, issuedAt, signature }) {
  if (!isSafeWallet(wallet))
    return { error: 'That does not look like a Solana address.', status: 400 }
  if (typeof issuedAt !== 'string' || !isFresh(issuedAt))
    return { error: 'Signature expired, please sign again.', status: 400 }
  if (typeof signature !== 'string')
    return { error: 'Malformed request.', status: 400 }
  if (!OPERATORS.includes(wallet))
    return { error: 'That wallet does not act for this project.', status: 403 }

  let ok = false
  try {
    ok = await verifySignature(
      wallet,
      operatorMessage(purpose, wallet, issuedAt),
      signature,
    )
  } catch {
    ok = false
  }
  if (!ok) return { error: 'Signature did not match that wallet.', status: 401 }

  return null
}
