/**
 * Maakt het sleutelpaar waarmee adressen versleuteld worden.
 *
 *   node scripts/keygen.mjs
 *
 * De publieke sleutel gaat in `site.ts` en komt dus gewoon op internet te
 * staan — daar kun je alleen mee versleutelen, niet mee lezen.
 *
 * De privésleutel wordt weggeschreven naar `secrets/` en staat in .gitignore.
 * Die verlaat je computer nooit. Zonder die sleutel kan niemand de adressen
 * lezen — jij ook niet. Maak er een back-up van op een plek die je vertrouwt,
 * want kwijt is kwijt en dan zijn alle opgeslagen adressen onleesbaar.
 *
 * Draai dit één keer. Draai je het opnieuw, dan zijn adressen die met de oude
 * sleutel zijn versleuteld niet meer te openen.
 */

import { generateKeyPairSync } from 'node:crypto'
import { mkdirSync, writeFileSync, existsSync } from 'node:fs'

const OUT = 'secrets/ember-private-key.txt'

if (existsSync(OUT)) {
  console.error(
    `Er staat al een sleutel in ${OUT}.\n` +
      'Overschrijven maakt alle bestaande adressen onleesbaar. Verwijder het\n' +
      'bestand eerst met de hand als je zeker weet dat je opnieuw wilt beginnen.',
  )
  process.exit(1)
}

const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 3072,
  publicKeyEncoding: { type: 'spki', format: 'der' },
  privateKeyEncoding: { type: 'pkcs8', format: 'der' },
})

mkdirSync('secrets', { recursive: true })
writeFileSync(OUT, privateKey.toString('base64') + '\n', { mode: 0o600 })

console.log('Privésleutel geschreven naar', OUT)
console.log('Maak daar een back-up van. Kwijt is kwijt.\n')
console.log('Zet deze publieke sleutel in src/data/site.ts onder shipping.publicKey:\n')
console.log(publicKey.toString('base64'))
