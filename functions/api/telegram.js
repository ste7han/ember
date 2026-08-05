import checklist from '../../src/data/checklist.json'
import collection from '../../src/data/collection.json'
import furnace from '../../src/data/furnace.json'
import giveaways from '../../src/data/giveaways.json'

/**
 * POST /api/telegram — de webhook waar Telegram vragen uit de groep naartoe
 * stuurt.
 *
 * Bewust geen taalmodel erachter. Een bot die zelf antwoorden verzint kan iets
 * beweren dat niet op de site staat, en dit hele project drijft erop dat elk
 * getal na te rekenen is. Daarom komen de antwoorden hieronder rechtstreeks uit
 * dezelfde databestanden als de site. Staat er 3 van de 207 op de homepage, dan
 * zegt de bot 3 van de 207, want hij telt dezelfde regels. Hij kan er dus niet
 * naast zitten, ook niet als iemand hem probeert te verleiden tot een uitspraak
 * die ons goed uitkomt.
 *
 * De stand wordt bij elke deploy meegebakken, precies zoals bij de site zelf.
 *
 * Nodig als Pages-secret:
 *   TELEGRAM_BOT_TOKEN       dezelfde bot als die de aankondigingen doet
 *   TELEGRAM_WEBHOOK_SECRET  zelfbedacht; Telegram stuurt het als header mee,
 *                            zodat niemand anders deze url kan aanroepen
 *
 * Zet de webhook met: npm run telegram:webhook
 */

const SITE = 'https://ember.cards'
const TICKER = 'EMBER'

/**
 * Herhaald uit src/data/site.ts, want een function kan geen TypeScript uit de
 * app importeren. Zie functions/api/treasury.js, waar de wallets om dezelfde
 * reden nog een keer staan. Wijzig je ze daar, wijzig ze dan ook hier.
 */
const TOKEN_ADDRESS = 'AoLGyZpNoW1fQmcz1E63VZwXWUpHS8bpeY9s2wU1pump'
const WALLETS = {
  hunt: '9buyzGoxoN2HQdtdueVdfbNPF5f9eboFcF4GfSzZEaLG',
  rips: 'AhjomZS8EPnY8vMVcWDehAF4NZxi7Y6Panr6f4K5oGUK',
  dev: '9a6iTDCcJdZ6KXTpn2MoxE6Kg2GewCqPfv3yoLGw3Kiw',
}
const FEE_SPLIT = { hunt: 40, rips: 40, dev: 20 }

/* ----------------------------------------------------------- de tellingen --- */

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const num = (n) => Number(n).toLocaleString('en-US')

/** Exact dezelfde afleiding als src/lib/collection.ts. */
function counts() {
  const owned = new Set(collection.ownedIds ?? [])
  const perStage = (collection.stages ?? []).map((s) => {
    const rows = checklist.rows.filter((r) => r.stage === s.key)
    return {
      name: s.stage,
      pokemon: s.pokemon,
      owned: rows.filter((r) => owned.has(r.id)).length,
      total: rows.length,
    }
  })
  return {
    perStage,
    owned: checklist.rows.filter((r) => owned.has(r.id)).length,
    total: checklist.rows.length,
  }
}

/* -------------------------------------------------------------- antwoorden --- */

function answerProject() {
  const c = counts()
  return [
    `<b>What ${TICKER} is</b>`,
    '',
    'Creator fees buy physical Pokémon cards. The goal is every card in the Charmander evolution line: Charmander, Charmeleon and Charizard, ' +
      `${num(c.total)} cards in total.`,
    '',
    `Right now we are at ${num(c.owned)} of ${num(c.total)}.`,
    ...c.perStage.map(
      (s) => `• ${esc(s.name)} (${esc(s.pokemon)}) ${num(s.owned)}/${num(s.total)}`,
    ),
    '',
    'Cards get photographed when they land and crossed off a public list. The first complete set we keep. Every set after that gets raffled to holders and actually shipped.',
    '',
    `The name comes from the Base Set Charmander. Its second attack is called Ember, and it costs you the energy you were holding to use it. That is where burning for a card comes from.`,
    '',
    `${SITE}`,
  ].join('\n')
}

function answerProgress() {
  const c = counts()
  return [
    `<b>Where we are</b>`,
    '',
    ...c.perStage.map(
      (s) => `${esc(s.name)} · ${esc(s.pokemon)} · ${num(s.owned)}/${num(s.total)}`,
    ),
    '',
    `${num(c.owned)} of ${num(c.total)} overall.`,
    `Set ${collection.currentSet}, ${collection.setsAwarded} sets given away so far.`,
    '',
    `Every card on the list: ${SITE}/#/checklist`,
  ].join('\n')
}

function answerChecklist() {
  const c = counts()
  return [
    `<b>The checklist</b>`,
    '',
    `${num(c.total)} cards, generated from Bulbapedia by a script in the public repo. You can run it yourself and get the same list.`,
    '',
    'It counts every English printing, so an alternate art or a reprint is its own card. The seven designs that never came out in English count in Japanese, because otherwise "every card in the line" would not be true.',
    '',
    'That number is the denominator under every stat we show. It is locked, and if a new set changes it we say so out loud first.',
    '',
    `${SITE}/#/checklist`,
  ].join('\n')
}

function answerFurnace() {
  const open = (furnace ?? []).filter((o) => !o.claim && o.mode === 'burn')
  const lines = [
    `<b>The furnace</b>`,
    '',
    `Burn ${TICKER} and a real card gets shipped to you. What goes up there are our duplicates and anything outside the Charmander line.`,
    '',
    'Cards on the checklist are never claimable. Those are the set we promised to finish, and if you could take them the counter on the homepage could go down.',
  ]

  if (open.length === 0) {
    lines.push('', 'Nothing to claim at the moment. New cards go up after a rip.')
  } else {
    lines.push('', `Open right now:`)
    for (const o of open) {
      lines.push(
        `• ${esc(o.card)}${o.burnAmount ? ` for ${num(o.burnAmount)} ${TICKER}` : ''}`,
      )
    }
  }

  lines.push('', `${SITE}/#furnace`)
  return lines.join('\n')
}

function answerGiveaway() {
  const live = (giveaways ?? []).filter((g) => g.status === 'live')
  const lines = [`<b>Giveaways</b>`, '']

  if (live.length === 0) {
    lines.push('Nothing running right now.')
  } else {
    for (const g of live) {
      lines.push(`• ${esc(g.prize)}`)
      if (g.howToEnter) lines.push(`  ${esc(g.howToEnter)}`)
    }
  }

  lines.push(
    '',
    'Holding is the ticket. More tokens means a bigger share of the chance, and that is the whole rule. There are no tiers and no card is reserved for anyone.',
    '',
    'Draws run on a public tool that publishes the seed and the holder list, so anyone can rerun one and land on the same winner.',
    '',
    `${SITE}/#/draw`,
  )
  return lines.join('\n')
}

function answerFees() {
  return [
    `<b>Where the fees go</b>`,
    '',
    `${FEE_SPLIT.hunt}% hunting cards from the checklist`,
    `${FEE_SPLIT.rips}% sealed packs, for the rips and the giveaways`,
    `${FEE_SPLIT.dev}% dev`,
    '',
    'The three wallets are public, so you can watch the money move instead of believing a number on a website.',
    '',
    `Hunt <code>${WALLETS.hunt}</code>`,
    `Rips <code>${WALLETS.rips}</code>`,
    `Dev <code>${WALLETS.dev}</code>`,
    '',
    `Spent so far: $${num(collection.feesSpentUsd)}`,
  ].join('\n')
}

function answerToken() {
  return [
    `<b>$${TICKER}</b>`,
    '',
    `<code>${TOKEN_ADDRESS}</code>`,
    '',
    `${SITE}`,
  ].join('\n')
}

/**
 * Welke kaartfoto onder welke naam is uitgerold.
 *
 * De foto's krijgen bij het bouwen een hash in hun naam, zodat een vervangen
 * foto niet uit de cache van bezoekers blijft komen. Die naam kunnen we hier
 * niet raden, dus Vite schrijft een lijstje weg en dat lezen we op.
 */
let cachedPhotos
async function photoUrls() {
  if (cachedPhotos) return cachedPhotos
  try {
    const manifest = await (await fetch(`${SITE}/manifest.json`)).json()
    const map = {}
    for (const [src, entry] of Object.entries(manifest)) {
      const m = src.match(/^src\/assets\/vault\/(.+)\.(?:jpg|jpeg|png|webp|avif)$/)
      if (m && entry.file) map[m[1]] = `${SITE}/${entry.file}`
    }
    cachedPhotos = map
    return map
  } catch {
    // Niet onthouden, zodat een volgende vraag het gewoon opnieuw probeert.
    return {}
  }
}

/** Kaarten die we bezitten én gefotografeerd hebben, nieuwste eerst. */
async function ownedPhotos() {
  const urls = await photoUrls()
  const owned = collection.ownedIds ?? []

  const recent = [...(collection.recentPickups ?? [])]
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .map((p) => p.image)
    .filter((id) => id && owned.includes(id))

  const rest = owned.filter((id) => !recent.includes(id))
  const rows = new Map(checklist.rows.map((r) => [r.id, r]))

  return [...recent, ...rest]
    .filter((id) => urls[id])
    .map((id) => {
      const r = rows.get(id)
      return {
        url: urls[id],
        label: r ? `${r.card} · ${r.set}${r.number ? ` ${r.number}` : ''}` : id,
      }
    })
}

async function answerVault() {
  const photos = await ownedPhotos()
  const c = counts()

  if (photos.length === 0) {
    return [
      `<b>The vault</b>`,
      '',
      'No photos up yet. Every card gets photographed when it lands, and they show up here and on the site at the same time.',
      '',
      `${SITE}/#vault`,
    ].join('\n')
  }

  // Telegram doet er maximaal tien tegelijk. De rest staat op de site.
  const show = photos.slice(0, 10)
  const rest = photos.length - show.length

  const caption = [
    `<b>The vault</b>`,
    '',
    ...show.map((p) => `• ${esc(p.label)}`),
    ...(rest > 0 ? ['', `And ${num(rest)} more on the site.`] : []),
    '',
    `${num(c.owned)} of ${num(c.total)} cards. Every one of them shot by us, no scans off the internet.`,
    '',
    `${SITE}/#vault`,
  ].join('\n')

  return { caption, photos: show.map((p) => p.url) }
}

function answerHelp() {
  return [
    `<b>Ask me about ${TICKER}</b>`,
    '',
    '/project how this works',
    '/progress how many cards we have',
    '/vault photos of the cards we own',
    '/checklist what counts as a card, and why',
    '/furnace burning tokens for a card',
    '/giveaway what is running and how winners are drawn',
    '/fees where the money goes',
    '/ca the contract address',
    '',
    `Everything I say comes out of the same files as the site, so it cannot say something different from ${SITE}.`,
  ].join('\n')
}

/* ------------------------------------------------------- vraag naar antwoord --- */

const TOPICS = [
  { answer: answerHelp, commands: ['start', 'help'], words: [] },
  {
    answer: answerProject,
    commands: ['project', 'about', 'what'],
    words: ['what is this', 'what is ember', 'about the project', 'explain', 'concept', 'rwa'],
  },
  {
    answer: answerProgress,
    commands: ['progress', 'stats', 'collection'],
    words: ['how many cards', 'how far', 'progress', 'how many do you have'],
  },
  {
    answer: answerVault,
    commands: ['vault', 'photos', 'pics'],
    words: ['photo', 'picture', 'show me the cards', 'proof'],
  },
  {
    answer: answerChecklist,
    commands: ['checklist', 'cards', 'list'],
    words: ['checklist', 'how many cards are there', '207', 'which cards'],
  },
  {
    answer: answerFurnace,
    commands: ['furnace', 'burn', 'claim'],
    words: ['burn', 'claim', 'furnace'],
  },
  {
    answer: answerGiveaway,
    commands: ['giveaway', 'giveaways', 'draw', 'raffle'],
    words: ['giveaway', 'raffle', 'draw', 'win', 'winner'],
  },
  {
    answer: answerFees,
    commands: ['fees', 'split', 'wallets', 'treasury'],
    words: ['fees', 'split', 'wallet', 'where does the money'],
  },
  {
    answer: answerToken,
    commands: ['ca', 'contract', 'token', 'address'],
    words: ['contract address', 'ca?', 'what is the ca', 'mint'],
  },
]

/**
 * Onze eigen @naam, gevraagd aan Telegram in plaats van ingesteld. Eén keer per
 * isolate, dus in de praktijk vrijwel nooit.
 */
let cachedName
async function botUsername(env) {
  if (cachedName !== undefined) return cachedName
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getMe`,
    )
    cachedName = (await res.json())?.result?.username ?? null
  } catch {
    cachedName = null
  }
  return cachedName
}

/**
 * Welke uitleg hoort bij dit bericht, of null als we het niet weten.
 *
 * Een commando is eenduidig. Bij vrije tekst zoeken we naar woorden die we
 * herkennen, en herkennen we niets dan zwijgen we liever dan te gokken: een bot
 * die het verkeerde blokje tekst uitspuugt is vervelender dan een bot die niets
 * zegt.
 */
async function route(text, env) {
  const clean = text.trim()
  const cmd = clean.match(/^\/([a-z_]+)(?:@([A-Za-z0-9_]+))?\b/i)

  if (cmd) {
    /*
     * In een groep met meer bots schrijft Telegram er de naam bij: /help@embertcg.
     * Staat daar iemand anders, dan is het niet aan ons. Weten we onze eigen
     * naam niet, dan zwijgen we ook: dat is beter dan door elkaar heen praten.
     */
    if (cmd[2]) {
      const me = await botUsername(env)
      if (!me || cmd[2].toLowerCase() !== me.toLowerCase()) return null
    }
    const name = cmd[1].toLowerCase()
    return TOPICS.find((t) => t.commands.includes(name))?.answer ?? null
  }

  const lower = clean.toLowerCase()
  for (const t of TOPICS) {
    if (t.words.some((w) => lower.includes(w))) return t.answer
  }
  return null
}

/* -------------------------------------------------------------------- http --- */

const call = (env, method, body) =>
  fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

/**
 * Een antwoord is tekst, of foto's met een onderschrift. Telegram wil die twee
 * via verschillende methodes hebben, en bij meer dan één foto weer een andere.
 */
async function reply(env, chatId, messageId, answer) {
  const to = {
    chat_id: chatId,
    reply_to_message_id: messageId,
    allow_sending_without_reply: true,
  }

  if (typeof answer === 'string') {
    await call(env, 'sendMessage', {
      ...to,
      text: answer,
      parse_mode: 'HTML',
      link_preview_options: { is_disabled: true },
    })
    return
  }

  const { caption, photos } = answer

  if (photos.length === 1) {
    await call(env, 'sendPhoto', {
      ...to,
      photo: photos[0],
      caption,
      parse_mode: 'HTML',
    })
    return
  }

  // Het onderschrift hoort bij de eerste foto; Telegram toont het onder het
  // hele album.
  await call(env, 'sendMediaGroup', {
    ...to,
    media: photos.map((url, i) => ({
      type: 'photo',
      media: url,
      ...(i === 0 ? { caption, parse_mode: 'HTML' } : {}),
    })),
  })
}

export async function onRequestPost({ request, env }) {
  // Zonder deze twee kan er niets, en dan is stil falen beter dan een 500 die
  // Telegram aan het opnieuw proberen zet.
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_WEBHOOK_SECRET) {
    return new Response('ok')
  }

  /*
   * Telegram stuurt dit geheim als header mee bij elke aanroep. Zonder deze
   * controle zou iedereen die de url raadt de bot in jouw groep kunnen laten
   * praten, en dan is een aankondiging van een winnaar niets meer waard.
   */
  if (
    request.headers.get('X-Telegram-Bot-Api-Secret-Token') !==
    env.TELEGRAM_WEBHOOK_SECRET
  ) {
    return new Response('no', { status: 401 })
  }

  let update
  try {
    update = await request.json()
  } catch {
    return new Response('ok')
  }

  const msg = update?.message ?? update?.edited_message
  const text = msg?.text
  if (!text || !msg.chat?.id) return new Response('ok')

  // Na een storing levert Telegram oude berichten alsnog af. Daar willen we niet
  // een uur later nog op reageren.
  if (msg.date && Date.now() / 1000 - msg.date > 300) return new Response('ok')

  const answer = await route(text, env)
  if (!answer) return new Response('ok')

  try {
    await reply(env, msg.chat.id, msg.message_id, await answer())
  } catch {
    // Telegram opnieuw laten proberen heeft geen zin; dan stuurt hij het
    // antwoord straks alsnog, alleen te laat.
  }

  return new Response('ok')
}
