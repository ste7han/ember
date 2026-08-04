/**
 * Controleren dat iemand écht over een wallet beschikt.
 *
 * Zonder dit is het adresformulier een cadeautje voor wie kwaad wil: je vult
 * de wallet van een grote holder in met je eigen adres en wacht tot die iets
 * wint. Een ondertekend bericht sluit dat af — de wallet moet meewerken, en
 * dat kan alleen wie de sleutel heeft.
 *
 * Alles via WebCrypto, dus dit draait ongewijzigd in een Cloudflare Worker,
 * in Node en in de browser. De vorige versie leunde op `node:crypto` en was
 * daarmee aan één omgeving gebonden.
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

  // Voorloopnullen zijn in base58 '1'-tekens en gaan verloren in het rekenwerk.
  for (const ch of str) {
    if (ch !== '1') break
    bytes.push(0)
  }

  return Uint8Array.from(bytes.reverse())
}

const fromB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))

/**
 * Een Solana-adres ís de publieke ed25519-sleutel, in base58. WebCrypto neemt
 * die 32 bytes rechtstreeks aan als 'raw'.
 */
export async function verifySignature(walletBase58, message, signatureBase64) {
  const raw = base58Decode(walletBase58)
  if (raw.length !== 32) throw new Error('Geen geldig Solana-adres')

  const key = await crypto.subtle.importKey('raw', raw, { name: 'Ed25519' }, false, [
    'verify',
  ])

  return crypto.subtle.verify(
    { name: 'Ed25519' },
    key,
    fromB64(signatureBase64),
    new TextEncoder().encode(message),
  )
}

/**
 * Het bericht dat ondertekend moet worden. De wallet staat erin zodat een
 * handtekening niet voor een andere wallet hergebruikt kan worden, en de tijd
 * zodat een onderschepte handtekening niet maanden later nog werkt.
 *
 * Wijzig je deze tekst, wijzig hem dan ook in ShippingPage.tsx — wijkt er één
 * teken af, dan mislukt elke controle.
 */
export const signingMessage = (wallet, issuedAt) =>
  [
    'EMBER: save shipping address',
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

export const isSafeId = (s) =>
  typeof s === 'string' && s.length > 0 && s.length <= 64 && /^[\w-]+$/.test(s)

export const isSafeWallet = (s) =>
  typeof s === 'string' && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s)

/** Kleine hulpjes zodat elke functie hetzelfde antwoordt. */
export const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  })

export const RESERVE_TTL_MS = 15 * 60 * 1000
