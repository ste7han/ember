/**
 * Telt de drie noemers van de missie opnieuw uit de bron, zodat niemand ons op
 * ons woord hoeft te geloven.
 *
 *   node scripts/verify-totals.mjs           controleer en rapporteer
 *   node scripts/verify-totals.mjs --write   herschrijf src/data/checklist.json
 *
 * Bulbapedia scheidt twee dingen die makkelijk door elkaar lopen:
 *
 *   {{card list/card}}     één uniek kaartontwerp (illustratie + speltekst)
 *   {{card list/release}}  één druk van dat ontwerp, Engels en/of Japans
 *
 * Onze scope telt drukken, niet ontwerpen: een release-regel telt mee zodra hij
 * een `enset=` heeft. Japans-exclusieve regels hebben dat niet en vallen dus
 * vanzelf af.
 */

import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const UA = 'EmberProject/1.0 (card count verification; https://github.com/)'

/** De drie fases, in dezelfde volgorde als collection.json. */
const STAGES = [
  { key: 'ember', pokemon: 'Charmander', expected: 49 },
  { key: 'flame', pokemon: 'Charmeleon', expected: 38 },
  { key: 'inferno', pokemon: 'Charizard', expected: 113 },
]

const wikiUrl = (p) =>
  `https://bulbapedia.bulbagarden.net/wiki/${encodeURIComponent(p)}_(TCG)`

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}`)
  return res.text()
}

const rawUrl = (p) =>
  `https://bulbapedia.bulbagarden.net/w/index.php?title=${encodeURIComponent(p)}_(TCG)&action=raw`

/**
 * Hoeveel kaarten Bulbapedia zelf in de categorie heeft zitten. Onafhankelijk
 * van onze parser, dus als wij een kaart missen loopt dit uit de pas.
 */
async function categoryCount(pokemon) {
  const url =
    `https://bulbapedia.bulbagarden.net/w/api.php?action=query&list=categorymembers` +
    `&cmtitle=Category:${encodeURIComponent(pokemon)}%20(TCG)&cmlimit=500&format=json`
  const data = JSON.parse(await fetchText(url))
  // De categorie bevat ook de overzichtspagina zelf, die geen kaart is.
  return data.query.categorymembers.length - 1
}

/**
 * Haalt de identiteit van een kaart uit een `card list/card`-regel.
 *
 * Er zijn twee vormen in omloop, en dat is precies de valkuil: matchen op
 * alleen de eerste laat op de Charizard-pagina 25 van de 50 kaarten liggen, en
 * hun drukken worden dan stilletjes bij de vorige kaart opgeteld. De telling
 * ziet er dan nog steeds plausibel uit.
 */
function parseCardName(line) {
  const tcgId = line.match(/\{\{TCG ID\|([^|]+)\|([^|]+)\|([^|}]+)/)
  if (tcgId) return tcgId[2].trim()

  const link = line.match(/\[\[([^\]|]+)/)
  if (link) return link[1].replace(/\s*\([^)]*\)\s*$/, '').trim()

  return null
}

/** Alle Engelse drukken op één overzichtspagina, in bronvolgorde. */
function parsePage(wikitext, stage) {
  const printings = []
  let cards = 0
  let current = null

  for (const raw of wikitext.split('\n')) {
    const line = raw.trim()

    if (line.startsWith('{{card list/card|')) {
      const name = parseCardName(line)
      if (!name) throw new Error(`Onbekende cardname-vorm: ${line.slice(0, 90)}`)
      cards++
      current = name
      continue
    }

    if (line.startsWith('{{card list/release') && current) {
      const set = line.match(/\|enset=([^|}]+)/)
      if (!set) continue // Japans-exclusieve druk, telt niet mee.
      const number = line.match(/\|ennum=([^|}]+)/)
      printings.push({
        stage: stage.key,
        card: current,
        set: set[1].trim(),
        number: number ? number[1].trim() : null,
      })
    }
  }

  return { cards, printings }
}

const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

/**
 * Stabiele sleutel per druk. Hier vink je straks op af, dus dubbele waarden
 * zouden betekenen dat twee kaarten elkaars vinkje overschrijven.
 */
function assignIds(printings) {
  const seen = new Map()
  return printings.map((p) => {
    const base = `${p.stage}-${slug(p.set)}-${slug(p.number ?? p.card)}`
    const n = (seen.get(base) ?? 0) + 1
    seen.set(base, n)
    return { id: n === 1 ? base : `${base}-${n}`, ...p }
  })
}

const today = () => new Date().toISOString().slice(0, 10)

async function main() {
  const write = process.argv.includes('--write')
  const results = []
  let failed = false

  for (const stage of STAGES) {
    const [wikitext, expectedCards] = await Promise.all([
      fetchText(rawUrl(stage.pokemon)),
      categoryCount(stage.pokemon),
    ])

    const { cards, printings } = parsePage(wikitext, stage)
    const ok = cards === expectedCards && printings.length === stage.expected

    if (!ok) failed = true
    results.push({ stage, cards, expectedCards, printings })

    console.log(
      `${ok ? 'OK  ' : 'FOUT'} ${stage.pokemon.padEnd(11)} ` +
        `${String(printings.length).padStart(3)} Engelse drukken ` +
        `(verwacht ${stage.expected})  ·  ` +
        `${cards} kaarten volgens onze parse, ${expectedCards} volgens de categorie`,
    )
  }

  const all = assignIds(results.flatMap((r) => r.printings))
  const total = all.length
  const unique = new Set(all.map((r) => r.id)).size

  console.log(`\nTotaal: ${total} Engelse drukken over drie fases.`)
  if (unique !== total) {
    failed = true
    console.log(`FOUT: ${total - unique} dubbele id's — afvinken zou botsen.`)
  }

  if (write) {
    const path = join(ROOT, 'src/data/checklist.json')
    const payload = {
      snapshotDate: today(),
      source: 'Bulbapedia',
      note: 'Gegenereerd door scripts/verify-totals.mjs. Niet met de hand bewerken.',
      rows: all.map((r) => ({
        ...r,
        sourceUrl: wikiUrl(
          STAGES.find((s) => s.key === r.stage).pokemon,
        ),
      })),
    }
    writeFileSync(path, JSON.stringify(payload, null, 2) + '\n')
    console.log(`Geschreven: src/data/checklist.json (${total} rijen)`)
  }

  if (failed) {
    console.log(
      '\nDe telling wijkt af van wat de site claimt. Dat betekent óf een nieuwe set,\n' +
        'óf een wijziging op Bulbapedia. Onderzoek het verschil voordat je een noemer\n' +
        'aanpast — en kondig een aanpassing publiek aan.',
    )
    process.exitCode = 1
  }
}

main().catch((err) => {
  console.error(err.message)
  process.exitCode = 1
})
