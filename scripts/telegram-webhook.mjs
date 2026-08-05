/**
 * Vertelt Telegram waar hij vragen uit de groep naartoe moet sturen.
 *
 *   npm run telegram:webhook            zet de webhook aan
 *   npm run telegram:webhook -- --info  laat zien wat er nu staat
 *   npm run telegram:webhook -- --off   zet hem weer uit
 *
 * Het script vraagt de token zelf, zodat die niet in je shell-geschiedenis
 * belandt. Wil je het automatiseren, dan mag je hem ook als omgevingsvariabele
 * meegeven:
 *
 *   TELEGRAM_BOT_TOKEN=... TELEGRAM_WEBHOOK_SECRET=... npm run telegram:webhook
 *
 * Het webhook-geheim moet hetzelfde zijn als de Pages-secret met die naam.
 * Telegram stuurt het bij elke aanroep mee als header, en de function weigert
 * alles wat het niet heeft.
 */

import { MENU } from '../functions/_lib/commands.js'
import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'

const URL_TARGET = 'https://ember.cards/api/telegram'
const API = 'https://api.telegram.org'

const has = (flag) => process.argv.includes(flag)

/** Vraagt een waarde zonder hem te tonen, zodat er niets blijft staan. */
async function askHidden(question) {
  const rl = createInterface({ input: stdin, output: stdout, terminal: true })
  stdout.write(question)

  const wasRaw = stdin.isRaw
  if (stdin.isTTY) stdin.setRawMode(true)

  const ENTER = [13, 10, 4]
  const CTRL_C = 3
  const BACKSPACE = [8, 127]

  let value = ''
  await new Promise((resolve) => {
    const onData = (buf) => {
      const code = buf[0]

      if (ENTER.includes(code)) {
        stdin.off('data', onData)
        resolve()
        return
      }
      if (code === CTRL_C) {
        stdout.write('\n')
        process.exit(130)
      }
      if (BACKSPACE.includes(code)) {
        value = value.slice(0, -1)
        return
      }
      value += buf.toString('utf8')
    }
    stdin.on('data', onData)
  })

  if (stdin.isTTY) stdin.setRawMode(wasRaw)
  stdout.write('\n')
  rl.close()
  return value.trim()
}

async function call(token, method, body) {
  const res = await fetch(`${API}/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  })
  const data = await res.json().catch(() => ({}))
  if (!data.ok) {
    throw new Error(data.description ?? `${method}: ${res.status}`)
  }
  return data.result
}

async function main() {
  const token =
    process.env.TELEGRAM_BOT_TOKEN || (await askHidden('Bot token (niet zichtbaar): '))
  if (!token) throw new Error('Geen token opgegeven.')

  if (has('--info')) {
    const info = await call(token, 'getWebhookInfo')
    console.log(`url:                ${info.url || '(geen)'}`)
    console.log(`secret ingesteld:   ${info.has_custom_certificate ? 'ja' : info.url ? 'ja' : 'nee'}`)
    console.log(`wachtende updates:  ${info.pending_update_count ?? 0}`)
    if (info.last_error_message) {
      console.log(`laatste fout:       ${info.last_error_message}`)
    }
    return
  }

  if (has('--off')) {
    await call(token, 'deleteWebhook', { drop_pending_updates: true })
    console.log('Webhook uit. De bot luistert niet meer mee.')
    return
  }

  const secret =
    process.env.TELEGRAM_WEBHOOK_SECRET ||
    (await askHidden('Webhook-geheim, hetzelfde als de Pages-secret: '))
  if (!secret) throw new Error('Geen webhook-geheim opgegeven.')

  await call(token, 'setWebhook', {
    url: URL_TARGET,
    secret_token: secret,
    // Alleen berichten. We hoeven niets te weten van bewerkte polls, reacties
    // of wie er in de groep komt.
    allowed_updates: ['message'],
    drop_pending_updates: true,
  })

  // Dezelfde lijst als functions/_lib/commands.js, zodat er maar één plek is
  // waar commando's staan. Bij elke deploy wordt hij ook automatisch gezet.
  await call(token, 'setMyCommands', { commands: MENU })

  const me = await call(token, 'getMe')
  console.log(`Webhook staat op ${URL_TARGET}`)
  console.log(`Bot: @${me.username}`)
  console.log('')
  console.log('Test het door /project in de groep te typen.')
}

main().catch((err) => {
  console.error(err.message)
  process.exitCode = 1
})
