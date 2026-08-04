/**
 * De opgeslagen verzendadressen lezen.
 *
 *   node scripts/read-addresses.mjs                 alle adressen
 *   node scripts/read-addresses.mjs 7xKXtg2CW87...  één wallet
 *
 * Dit draait op jouw computer, met jouw privésleutel uit `secrets/`. De server
 * heeft die sleutel niet en heeft de adressen dus ook nooit kunnen lezen.
 *
 * Nodig in je shell (dezelfde als voor de site):
 *   KV_REST_API_URL=... KV_REST_API_TOKEN=... node scripts/read-addresses.mjs
 */

import { readFileSync, existsSync } from 'node:fs'
import { webcrypto } from 'node:crypto'

const KEY_FILE = 'secrets/ember-private-key.txt'
const PREFIX = 'ember:addr:'

const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL
const token =
  process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN

if (!url || !token) {
  console.error(
    'Zet KV_REST_API_URL en KV_REST_API_TOKEN in je shell voordat je dit draait.',
  )
  process.exit(1)
}
if (!existsSync(KEY_FILE)) {
  console.error(
    `Geen privésleutel gevonden in ${KEY_FILE}.\n` +
      'Draai eerst: node scripts/keygen.mjs',
  )
  process.exit(1)
}

async function kv(command) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  })
  if (!res.ok) throw new Error(`KV ${command[0]}: ${res.status}`)
  const json = await res.json()
  if (json.error) throw new Error(json.error)
  return json.result
}

const fromB64 = (s) => Uint8Array.from(Buffer.from(s, 'base64'))

const privateKey = await webcrypto.subtle.importKey(
  'pkcs8',
  fromB64(readFileSync(KEY_FILE, 'utf8').trim()),
  { name: 'RSA-OAEP', hash: 'SHA-256' },
  false,
  ['decrypt'],
)

/** Spiegelbeeld van `seal()` in src/lib/sealed.ts. */
async function open(envelope) {
  const rawAes = await webcrypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    privateKey,
    fromB64(envelope.key),
  )
  const aesKey = await webcrypto.subtle.importKey(
    'raw',
    rawAes,
    { name: 'AES-GCM' },
    false,
    ['decrypt'],
  )
  const plain = await webcrypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromB64(envelope.iv) },
    aesKey,
    fromB64(envelope.data),
  )
  return new TextDecoder().decode(plain)
}

const wanted = process.argv[2]
const keys = wanted ? [PREFIX + wanted] : ((await kv(['KEYS', `${PREFIX}*`])) ?? [])

if (keys.length === 0) {
  console.log('Nog geen adressen opgeslagen.')
  process.exit(0)
}

for (const key of keys) {
  const wallet = key.slice(PREFIX.length)
  const raw = await kv(['GET', key])
  if (!raw) {
    console.log(`\n${wallet}\n  (niets gevonden)`)
    continue
  }
  const record = typeof raw === 'string' ? JSON.parse(raw) : raw
  try {
    const address = await open(record.envelope)
    console.log(`\n${wallet}`)
    console.log(`  opgeslagen: ${record.savedAt}`)
    console.log(
      address
        .split('\n')
        .map((l) => '  ' + l)
        .join('\n'),
    )
  } catch {
    console.log(`\n${wallet}\n  KON NIET ONTSLEUTELEN — verkeerde sleutel?`)
  }
}
console.log()
