/**
 * Zet het commandomenu van de bot gelijk aan functions/_lib/commands.js.
 *
 * Draait bij elke deploy, zodat een nieuw commando vanzelf in het menu naast
 * het tekstvak verschijnt. Zonder dit moest je na elke wijziging met de hand
 * `npm run telegram:webhook` draaien en je token opnieuw invoeren, en dat is
 * precies het soort stap die je een keer vergeet.
 *
 * Handmatig draaien kan ook:
 *   TELEGRAM_BOT_TOKEN=... node scripts/telegram-commands.mjs
 *
 * Zonder token doet het script niets. Aankondigen en menu's zijn nooit
 * belangrijk genoeg om een deploy voor te laten mislukken.
 */

import { MENU } from '../functions/_lib/commands.js'

const token = process.env.TELEGRAM_BOT_TOKEN

if (!token) {
  console.log('Geen TELEGRAM_BOT_TOKEN, dus het menu blijft zoals het is.')
  process.exit(0)
}

const res = await fetch(`https://api.telegram.org/bot${token}/setMyCommands`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ commands: MENU }),
})

const data = await res.json().catch(() => ({}))
if (!data.ok) {
  console.error(`setMyCommands: ${data.description ?? res.status}`)
  process.exitCode = 1
} else {
  console.log(`Menu bijgewerkt: ${MENU.map((m) => `/${m.command}`).join(' ')}`)
}
