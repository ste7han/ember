/**
 * Adressen versleutelen in de browser, zodat de server ze nooit leesbaar ziet.
 *
 * RSA kan zelf maar een paar honderd bytes aan, dus we doen het zoals dat
 * overal gebeurt: een willekeurige AES-sleutel versleutelt het adres, en RSA
 * versleutelt die AES-sleutel. Beide zitten in WebCrypto, dus er komt geen
 * enkele library aan te pas.
 *
 * Het resultaat is één base64-string die naar de server gaat. Alleen wie de
 * privésleutel heeft kan hem openen — zie scripts/read-addresses.mjs.
 */

const b64 = (buf: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(buf)))

const fromB64 = (s: string) =>
  Uint8Array.from(atob(s), (c) => c.charCodeAt(0))

export type SealedEnvelope = {
  /** Versie, zodat we het formaat later kunnen wijzigen zonder oude data te breken. */
  v: 1
  /** De AES-sleutel, versleuteld met RSA-OAEP. */
  key: string
  /** Initialisatievector voor AES-GCM. */
  iv: string
  /** Het versleutelde adres. */
  data: string
}

export async function seal(
  plaintext: string,
  publicKeyBase64: string,
): Promise<SealedEnvelope> {
  const subtle = crypto.subtle

  const rsaKey = await subtle.importKey(
    'spki',
    fromB64(publicKeyBase64),
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt'],
  )

  const aesKey = await subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt'],
  )

  const iv = crypto.getRandomValues(new Uint8Array(12))
  const data = await subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    new TextEncoder().encode(plaintext),
  )

  const rawAes = await subtle.exportKey('raw', aesKey)
  const wrapped = await subtle.encrypt({ name: 'RSA-OAEP' }, rsaKey, rawAes)

  return {
    v: 1,
    key: b64(wrapped),
    iv: b64(iv.buffer),
    data: b64(data),
  }
}
