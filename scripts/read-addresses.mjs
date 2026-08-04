/**
 * De opgeslagen verzendadressen lezen.
 *
 *   npm run addresses                      alle adressen
 *   npm run addresses -- 7xKXtg2CW87...    één wallet
 *   npm run addresses -- --local           uit de lokale testdatabase
 *
 * Dit draait op jouw computer, met jouw privésleutel uit `secrets/`. De server
 * heeft die sleutel niet en heeft de adressen dus ook nooit kunnen lezen.
 *
 * Er komt geen token aan te pas: het praat met D1 via je bestaande
 * wrangler-login. Ben je uitgelogd, dan werkt dit script niet meer — precies
 * zoals het hoort.
 */

import { execFileSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { webcrypto } from 'node:crypto'

const KEY_FILE = 'secrets/ember-private-key.txt'

const args = process.argv.slice(2)
const local = args.includes('--local')
const wallet = args.find((a) => !a.startsWith('--'))

if (!existsSync(KEY_FILE)) {
  console.error(
    `Geen privésleutel gevonden in ${KEY_FILE}.\n` +
      'Draai eerst: node scripts/keygen.mjs',
  )
  process.exit(1)
}

/** Query via wrangler, zodat we geen aparte database-credentials nodig hebben. */
function query(sql) {
  const out = execFileSync(
    'npx',
    [
      'wrangler',
      'd1',
      'execute',
      'ember',
      local ? '--local' : '--remote',
      '--json',
      '--command',
      sql,
    ],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  )
  // Wrangler print soms een bannertje voor de JSON; pak vanaf de eerste [ of {.
  const start = out.search(/[[{]/)
  const parsed = JSON.parse(out.slice(start))
  return parsed[0]?.results ?? []
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

const where = wallet ? ` where wallet = '${wallet.replace(/'/g, "''")}'` : ''
const rows = query(`select wallet, envelope, saved_at from addresses${where}`)

if (rows.length === 0) {
  console.log('Nog geen adressen opgeslagen.')
  process.exit(0)
}

for (const row of rows) {
  console.log(`\n${row.wallet}`)
  console.log(`  opgeslagen: ${row.saved_at}`)
  try {
    const address = await open(JSON.parse(row.envelope))
    console.log(
      address
        .split('\n')
        .map((l) => '  ' + l)
        .join('\n'),
    )
  } catch {
    console.log('  KON NIET ONTSLEUTELEN — verkeerde sleutel?')
  }
}
console.log()
