/**
 * Vertelt Telegram wat er in de laatste commit veranderd is.
 *
 *   node scripts/announce.mjs --dry-run     laat zien wat er verstuurd zou worden
 *   node scripts/announce.mjs               verstuurt het echt
 *   node scripts/announce.mjs --since <ref> vergelijk met een andere commit
 *   node scripts/announce.mjs --test        één bericht, om de koppeling te testen
 *
 * Waarom een diff van de datastanden en geen aanroep vanuit de adminpagina?
 * Omdat alles hier langskomt. De furnace en de giveaways worden door
 * /api/publish als commit weggeschreven, en de collectie zetten we met de hand
 * in dezelfde bestanden. Eén plek die de commit leest dekt dus alle gevallen,
 * ook de handmatige. En omdat elke commit precies één keer door de workflow
 * gaat, kan een aankondiging niet dubbel verstuurd worden. Dat is een eigenschap
 * van de opzet en niet iets dat we met een tabel bij moeten houden.
 *
 * Nodig als GitHub-secret:
 *   TELEGRAM_BOT_TOKEN   van @BotFather
 *   TELEGRAM_CHAT_ID     de groep of het kanaal, bv. -1001234567890
 *
 * Ontbreekt er een, dan doet dit script niets en laat het de deploy met rust.
 * Aankondigen is nooit belangrijk genoeg om de site voor te laten liggen.
 */

import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SITE = 'https://ember.cards'
const DRY = process.argv.includes('--dry-run')
const TEST = process.argv.includes('--test')

/** Meer dan dit in één commit en we vatten samen in plaats van te spammen. */
const MAX_MESSAGES = 8

const FILES = {
  furnace: 'src/data/furnace.json',
  giveaways: 'src/data/giveaways.json',
  collection: 'src/data/collection.json',
  content: 'src/data/content.json',
}

/* ------------------------------------------------------------------ git --- */

/**
 * Waar we mee vergelijken, of null als er niets te vergelijken valt.
 *
 * Bij een push met meerdere commits is `github.event.before` de stand van vóór
 * de hele push; alleen naar HEAD~1 kijken zou dan de oudste wijzigingen missen.
 */
function baseRef() {
  const i = process.argv.indexOf('--since')
  if (i !== -1 && process.argv[i + 1]) return process.argv[i + 1]

  const before = process.env.GITHUB_EVENT_BEFORE
  // Bij een eerste push of een force push staat hier alleen maar nullen.
  if (before && !/^0+$/.test(before)) return before

  /*
   * Draaien we in de workflow en is er geen `before`, dan was dit geen push:
   * handmatig gestart, of een force push. Er is dan geen stand van vóór deze
   * wijziging, en terugvallen op HEAD~1 zou de vorige commit een tweede keer
   * aankondigen. Iemand die op "Run workflow" drukt om een deploy te herhalen
   * krijgt dan een dubbele melding van een claim die allang geweest is, en dat
   * is precies het soort ruis dat een aankondigingskanaal onbetrouwbaar maakt.
   */
  if (process.env.GITHUB_ACTIONS) return null

  // Lokaal is HEAD~1 wél wat je bedoelt.
  return 'HEAD~1'
}

/** De inhoud van een bestand op een bepaalde commit, of null als het er niet was. */
function readAt(ref, path) {
  try {
    return execFileSync('git', ['show', `${ref}:${path}`], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
  } catch {
    return null
  }
}

function readNow(path) {
  const full = join(ROOT, path)
  return existsSync(full) ? readFileSync(full, 'utf8') : null
}

const parse = (text, fallback) => {
  if (text === null) return fallback
  try {
    return JSON.parse(text)
  } catch {
    return fallback
  }
}

/* --------------------------------------------------------------- opmaak --- */

/** Telegram valt over een losse < of & in HTML-modus. */
const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const shortWallet = (w) =>
  typeof w === 'string' && w.length > 12 ? `${w.slice(0, 4)}…${w.slice(-4)}` : w

const num = (n) => Number(n).toLocaleString('en-US')

const plural = (n, word) => `${num(n)} ${word}${n === 1 ? '' : 's'}`

/** De foto die bij een id of een `image`-veld hoort, als die in de repo staat. */
function photoPath(nameOrPath) {
  if (!nameOrPath) return null

  // Waarde die met / begint is een letterlijk pad in public/, net als op de site.
  if (nameOrPath.startsWith('/')) {
    const p = join(ROOT, 'public', nameOrPath.slice(1))
    return existsSync(p) ? p : null
  }

  for (const ext of ['jpg', 'jpeg', 'png', 'webp', 'avif']) {
    const p = join(ROOT, 'src/assets/vault', `${nameOrPath}.${ext}`)
    if (existsSync(p)) return p
  }
  return null
}

/* ------------------------------------------------------------ de events --- */

const byId = (list) => new Map((list ?? []).map((o) => [o.id, o]))

/** Nieuwe kaarten in de furnace, en kaarten die net geclaimd zijn. */
function furnaceEvents(before, after) {
  const was = byId(before)
  const now = byId(after)
  const out = []

  for (const [id, offer] of now) {
    const old = was.get(id)

    if (!old) {
      const lines = [`<b>New in the furnace</b>`, '', esc(offer.card)]
      if (offer.mode === 'burn' && offer.burnAmount) {
        lines.push(`Burn ${num(offer.burnAmount)} $EMBER to claim it.`)
      } else if (offer.mode === 'giveaway') {
        lines.push('This one goes straight to a draw, no burning needed.')
      }
      if (offer.burnDeadline) {
        lines.push(
          `Open until ${new Date(offer.burnDeadline).toUTCString().slice(0, 16)}. After that it goes to the draw.`,
        )
      }
      if (offer.note) lines.push('', esc(offer.note))
      lines.push('', `${SITE}/#furnace`)
      out.push({ text: lines.join('\n'), photo: photoPath(offer.image ?? id) })
      continue
    }

    if (!old.claim && offer.claim) {
      const lines = [
        `<b>Claimed</b>`,
        '',
        `${esc(offer.card)} is going to ${esc(shortWallet(offer.claim.wallet))}.`,
      ]
      if (offer.burnAmount) {
        lines.push(`${num(offer.burnAmount)} $EMBER burned for it.`)
      }
      if (offer.claim.txSignature) {
        lines.push('', `https://solscan.io/tx/${offer.claim.txSignature}`)
      }
      out.push({ text: lines.join('\n'), photo: photoPath(offer.image ?? id) })
      continue
    }

    // Deadline verlopen en de kaart is doorgeschoven naar een trekking.
    if (old.mode === 'burn' && offer.mode === 'giveaway') {
      out.push({
        text: [
          `<b>Nobody claimed it</b>`,
          '',
          `${esc(offer.card)} stays unburned, so it moves to the next draw.`,
          '',
          `${SITE}/#giveaways`,
        ].join('\n'),
        photo: photoPath(offer.image ?? id),
      })
    }
  }

  return out
}

/**
 * Giveaways hebben geen id, dus we houden ze uit elkaar op prijs. Twee keer
 * dezelfde prijs in één lijst zou hier door elkaar lopen; dat melden we, want
 * stil de verkeerde winnaar aankondigen is erger dan geen bericht.
 */
function giveawayEvents(before, after) {
  const key = (g) => String(g.prize ?? '').trim().toLowerCase()
  const was = new Map((before ?? []).map((g) => [key(g), g]))
  const out = []
  const seen = new Set()

  for (const g of after ?? []) {
    const k = key(g)
    if (seen.has(k)) {
      console.warn(`Twee giveaways met dezelfde prijs (${g.prize}), tweede overgeslagen.`)
      continue
    }
    seen.add(k)

    const old = was.get(k)

    if (!old && g.status === 'live') {
      const lines = [`<b>Giveaway is live</b>`, '', esc(g.prize)]
      if (g.howToEnter) lines.push('', esc(g.howToEnter))
      lines.push('', `${SITE}/#giveaways`)
      out.push({ text: lines.join('\n') })
      continue
    }

    const justClosed = old && old.status === 'live' && g.status === 'closed'
    if ((justClosed || (!old && g.status === 'closed')) && g.winner) {
      const lines = [
        `<b>We have a winner</b>`,
        '',
        `${esc(g.prize)} goes to ${esc(shortWallet(g.winner))}.`,
      ]
      if (g.txSignature) lines.push('', `https://solscan.io/tx/${g.txSignature}`)
      lines.push('', 'Drawn with the public tool, seed and holder list included.')
      lines.push(`${SITE}/#/draw`)
      out.push({ text: lines.join('\n') })
    }
  }

  return out
}

/** Waar een video staat, afgeleid uit de link zelf. */
function platform(url = '') {
  if (/tiktok\.com/i.test(url)) return 'TikTok'
  if (/(?:^|\/\/)(?:www\.)?(?:x\.com|twitter\.com)/i.test(url)) return 'X'
  if (/youtu\.?be/i.test(url)) return 'YouTube'
  if (/instagram\.com/i.test(url)) return 'Instagram'
  return null
}

/**
 * Nieuwe rips en video's.
 *
 * Een rip die later pas gefilmd blijkt te zijn krijgt alsnog een bericht, want
 * dan is de video het nieuws en niet de opening.
 */
function ripEvents(before, after) {
  const was = byId(before)
  const out = []

  for (const [id, rip] of byId(after)) {
    const old = was.get(id)
    const isNew = !old
    const gotVideo = old && !old.url && rip.url
    if (!isNew && !gotVideo) continue

    const where = platform(rip.url)
    const lines = [
      `<b>${where ? `New on ${where}` : 'New rip'}</b>`,
      '',
      esc(rip.title),
    ]
    if (rip.packs) lines.push(`${plural(rip.packs, 'pack')}.`)
    if (rip.pulls?.length) {
      lines.push('', 'Out of it:', ...rip.pulls.map((p) => `• ${esc(p)}`))
    }
    if (rip.url) lines.push('', rip.url)

    // Bij een video willen we juist wél de voorvertoning van TikTok of X.
    out.push({ text: lines.join('\n'), preview: Boolean(rip.url) })
  }

  return out
}

/** Kaarten die bij de collectie gekomen zijn, met de stand erbij. */
function collectionEvents(before, after, checklist) {
  const was = new Set(before?.ownedIds ?? [])
  const nowIds = after?.ownedIds ?? []
  const added = nowIds.filter((id) => !was.has(id))
  if (added.length === 0) return []

  const rows = new Map(checklist.rows.map((r) => [r.id, r]))
  const stageName = new Map(
    (after.stages ?? []).map((s) => [s.key, s.stage]),
  )

  const owned = new Set(nowIds)
  const total = checklist.rows.length
  const stand = (stageKey) => {
    const inStage = checklist.rows.filter((r) => r.stage === stageKey)
    return `${num(inStage.filter((r) => owned.has(r.id)).length)}/${num(inStage.length)}`
  }

  /** Herkomst die niet vanzelf spreekt hoort er ook in Telegram bij te staan. */
  const noteFor = (id) =>
    (after.recentPickups ?? []).find((p) => p.image === id)?.note

  const label = (id) => {
    const r = rows.get(id)
    if (!r) return id
    return `${r.card} · ${r.set}${r.number ? ` ${r.number}` : ''}`
  }

  const header = `<b>${added.length === 1 ? 'Card added' : `${added.length} cards added`}</b>`
  const footer = ['', `${num(owned.size)}/${num(total)} overall.`, `${SITE}/#/checklist`]

  // Eén kaart krijgt een eigen bericht met foto, want dat is het leukste moment.
  if (added.length === 1) {
    const id = added[0]
    const row = rows.get(id)
    const lines = [header, '', esc(label(id))]
    if (row) {
      lines.push(
        `${esc(stageName.get(row.stage) ?? row.stage)} is now at ${stand(row.stage)}.`,
      )
    }
    const note = noteFor(id)
    if (note) lines.push('', esc(note))
    return [{ text: [...lines, ...footer].join('\n'), photo: photoPath(id) }]
  }

  const lines = [header, '', ...added.map((id) => `• ${esc(label(id))}`)]
  return [{ text: [...lines, ...footer].join('\n') }]
}

/* ------------------------------------------------------------- versturen --- */

async function send({ text, photo, preview }, { token, chat }) {
  // Een onderschrift bij een foto mag maar 1024 tekens zijn, een bericht 4096.
  if (photo && text.length <= 1024) {
    const form = new FormData()
    form.append('chat_id', chat)
    form.append('caption', text)
    form.append('parse_mode', 'HTML')
    form.append(
      'photo',
      new Blob([readFileSync(photo)]),
      photo.split('/').pop(),
    )
    const res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
      method: 'POST',
      body: form,
    })
    if (res.ok) return
    // Foto geweigerd, bijvoorbeeld te groot. Dan liever de tekst dan niets.
    console.warn(`sendPhoto mislukt (${res.status}), val terug op tekst.`)
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chat,
      text,
      parse_mode: 'HTML',
      link_preview_options: { is_disabled: !preview },
    }),
  })
  if (!res.ok) {
    throw new Error(`sendMessage ${res.status}: ${await res.text()}`)
  }
}

/**
 * Het bericht van `--test`. Bewust geen "test 1 2 3": dit komt in de echte
 * groep terecht, dus het mag er ook staan als de koppeling werkt.
 */
const testEvent = () => ({
  text: [
    '<b>Announcement bot is connected</b>',
    '',
    'From here you get a message when a card goes into the furnace, when someone burns for one, when a giveaway is drawn, and when the collection grows.',
    '',
    'Every one of those comes straight out of the change that put it on the site, so what you read here and what the site shows cannot drift apart.',
    '',
    SITE,
  ].join('\n'),
})

async function main() {
  if (TEST) {
    const token = process.env.TELEGRAM_BOT_TOKEN
    const chat = process.env.TELEGRAM_CHAT_ID
    if (DRY || !token || !chat) {
      console.log(testEvent().text)
      console.log('\nNiet verstuurd: --dry-run, of de twee secrets ontbreken.')
      return
    }
    await send(testEvent(), { token, chat })
    console.log('Testbericht verstuurd.')
    return
  }

  const ref = baseRef()
  if (!ref) {
    console.log(
      'Handmatig gestart zonder --test, dus geen push om mee te vergelijken. ' +
        'Niets verstuurd.',
    )
    return
  }

  const at = (path) => parse(readAt(ref, path), null)
  const now = (path) => parse(readNow(path), null)

  const checklist = now('src/data/checklist.json')
  if (!checklist) throw new Error('checklist.json ontbreekt of is onleesbaar.')

  let events = [
    ...furnaceEvents(at(FILES.furnace) ?? [], now(FILES.furnace) ?? []),
    ...giveawayEvents(at(FILES.giveaways) ?? [], now(FILES.giveaways) ?? []),
    ...ripEvents(at(FILES.content) ?? [], now(FILES.content) ?? []),
    ...collectionEvents(at(FILES.collection), now(FILES.collection), checklist),
  ]

  if (events.length === 0) {
    console.log(`Niets aan te kondigen sinds ${ref}.`)
    return
  }

  if (events.length > MAX_MESSAGES) {
    console.log(`${events.length} gebeurtenissen, samengevat tot één bericht.`)
    events = [
      {
        text: [
          `<b>Busy day</b>`,
          '',
          `${events.length} updates at once. The short version is on the site.`,
          '',
          SITE,
        ].join('\n'),
      },
    ]
  }

  const token = process.env.TELEGRAM_BOT_TOKEN
  const chat = process.env.TELEGRAM_CHAT_ID

  if (DRY || !token || !chat) {
    if (!DRY) {
      console.log(
        'TELEGRAM_BOT_TOKEN of TELEGRAM_CHAT_ID ontbreekt, dus alleen tonen.',
      )
    }
    for (const e of events) {
      console.log('\n' + '-'.repeat(60))
      if (e.photo) console.log(`[foto] ${e.photo.replace(ROOT + '/', '')}`)
      console.log(e.text)
    }
    console.log('\n' + '-'.repeat(60))
    console.log(`${events.length} bericht(en), niet verstuurd.`)
    return
  }

  for (const e of events) {
    await send(e, { token, chat })
    console.log('Verstuurd: ' + e.text.split('\n')[0].replace(/<[^>]+>/g, ''))
  }
}

main().catch((err) => {
  console.error(err.message)
  process.exitCode = 1
})
