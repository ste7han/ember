import { createPublicKey, verify } from 'node:crypto'

/**
 * Controleren dat iemand écht over een wallet beschikt.
 *
 * Zonder dit is het adresformulier een cadeautje voor wie kwaad wil: je vult
 * de wallet van een grote holder in met je eigen adres en wacht tot die iets
 * wint. Een ondertekend bericht sluit dat af — de wallet moet meewerken, en
 * dat kan alleen wie de sleutel heeft.
 *
 * Geen libraries: base58 is dertig regels en ed25519 zit sinds Node 18 in
 * `node:crypto`. Elke dependency hier is er één die je moet vertrouwen met de
 * beveiliging van je adressenlijst.
 */

const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

export function base58Decode(str) {
  const map = new Map([...ALPHABET].map((c, i) => [c, i]))
  const bytes = [0]

  for (const ch of str) {
    const value = map.get(ch)
    if (value === undefined) throw new Error(`Ongeldig teken: ${ch}`)
    let carry = value
    for (let i = 0; i < bytes.length; i++) {
      carry += bytes[i] * 58
      bytes[i] = carry & 0xff
      carry >>= 8
    }
    while (carry > 0) {
      bytes.push(carry & 0xff)
      carry >>= 8
    }
  }

  // Voorloopnullen in base58 zijn '1'-tekens en gaan verloren in het rekenwerk.
  for (const ch of str) {
    if (ch !== '1') break
    bytes.push(0)
  }

  return Uint8Array.from(bytes.reverse())
}

/**
 * Een kale ed25519-sleutel is 32 bytes; `createPublicKey` wil DER. Die
 * omhulling is voor ed25519 altijd exact dezelfde twaalf bytes, dus die
 * plakken we er zelf voor.
 */
const SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex')

export function verifySignature(walletBase58, message, signatureBase64) {
  const raw = base58Decode(walletBase58)
  if (raw.length !== 32) throw new Error('Geen geldig Solana-adres')

  const key = createPublicKey({
    key: Buffer.concat([SPKI_PREFIX, Buffer.from(raw)]),
    format: 'der',
    type: 'spki',
  })

  return verify(
    null,
    Buffer.from(message, 'utf8'),
    key,
    Buffer.from(signatureBase64, 'base64'),
  )
}

/**
 * Het bericht dat ondertekend moet worden. De wallet staat erin zodat een
 * handtekening niet voor een andere wallet hergebruikt kan worden, en de tijd
 * zodat een onderschepte handtekening niet maanden later nog werkt.
 */
export const signingMessage = (wallet, issuedAt) =>
  [
    'EMBER — save shipping address',
    '',
    `Wallet: ${wallet}`,
    `Time: ${issuedAt}`,
    '',
    'Signing this proves you control this wallet.',
    'It is not a transaction and costs nothing.',
  ].join('\n')

/** Handtekeningen ouder dan tien minuten weigeren we. */
export function isFresh(issuedAt, maxAgeMs = 10 * 60 * 1000) {
  const t = Date.parse(issuedAt)
  if (Number.isNaN(t)) return false
  const age = Date.now() - t
  return age > -60_000 && age < maxAgeMs
}
