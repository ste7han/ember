/**
 * Maakt kaartfoto's klaar om te publiceren.
 *
 *   npm run photos            zet alles wat nog niet goed staat recht
 *   npm run photos -- --check kijkt alleen, en klaagt als er iets mis is
 *
 * Waarom dit bestaat: een foto rechtstreeks uit een telefoon is niet zomaar
 * publiceerbaar. Drie dingen gaan er standaard mis, en we hebben ze alle drie
 * al een keer meegemaakt.
 *
 *   1. Er zitten GPS-coördinaten in. Publiceer je die, dan zet je bij elke
 *      kaart je huisadres op internet.
 *   2. Het beeld staat liggend opgeslagen met een notitie erbij dat het
 *      rechtop moet. Niet elke omgeving leest die notitie, dus de kaart ligt
 *      voor een deel van je bezoekers op zijn kant.
 *   3. Een "jpg" uit Foto's is soms een HEIC of MPO met de verkeerde
 *      extensie. Safari toont hem, Chrome en Firefox niet. Je ziet het zelf
 *      dus niet, en je bezoekers wel.
 *
 * `--check` draait ook in de workflow, vóór de build. Een foto met GPS erin
 * hoort de deploy tegen te houden: dat is geen schoonheidsfoutje.
 */

import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIR = join(ROOT, 'src/assets/vault')

/** Genoeg voor een kaart op een retina-scherm, en niet meer dan dat. */
const MAX_EDGE = 1400
const MAX_BYTES = 500 * 1024

const CHECK = process.argv.includes('--check')

/* ------------------------------------------------------------ uitlezen --- */

/** Welk formaat er echt in het bestand zit, los van wat de extensie beweert. */
function container(b) {
  if (b[0] === 0xff && b[1] === 0xd8) return 'jpeg'
  if (b[0] === 0x89 && b.toString('latin1', 1, 4) === 'PNG') return 'png'
  if (b.toString('latin1', 4, 8) === 'ftyp') {
    const brand = b.toString('latin1', 8, 12)
    return /heic|heix|hevc|mif1|avif/.test(brand) ? 'heic' : 'onbekend'
  }
  if (b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP')
    return 'webp'
  return 'onbekend'
}

/**
 * De EXIF van een JPEG, voor zover we hem nodig hebben.
 *
 * Met de hand uitgelezen in plaats van met een pakket, want dit moet ook in de
 * workflow kunnen draaien zonder dat daar eerst een halve toolchain voor
 * geïnstalleerd wordt. We zoeken maar twee dingen: staat er een draaivlag, en
 * zit er een GPS-blok in.
 */
function exifOf(b) {
  let i = 2
  while (i + 4 < b.length) {
    if (b[i] !== 0xff) break
    const marker = b[i + 1]
    if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd9)) {
      i += 2
      continue
    }
    const len = b.readUInt16BE(i + 2)
    if (marker === 0xe1 && b.toString('latin1', i + 4, i + 10) === 'Exif\0\0') {
      return readTiff(b, i + 10)
    }
    i += 2 + len
  }
  return { exif: false, orientation: null, gps: false }
}

function readTiff(b, start) {
  const order = b.toString('latin1', start, start + 2)
  if (order !== 'II' && order !== 'MM') return { exif: true, orientation: null, gps: false }

  const le = order === 'II'
  const u16 = (o) => (le ? b.readUInt16LE(o) : b.readUInt16BE(o))
  const u32 = (o) => (le ? b.readUInt32LE(o) : b.readUInt32BE(o))

  const ifd = start + u32(start + 4)
  if (ifd + 2 > b.length) return { exif: true, orientation: null, gps: false }

  let orientation = null
  let gps = false

  const count = u16(ifd)
  for (let n = 0; n < count; n++) {
    const entry = ifd + 2 + n * 12
    if (entry + 12 > b.length) break
    const tag = u16(entry)
    if (tag === 0x0112) orientation = u16(entry + 8)
    if (tag === 0x8825) gps = true
  }

  return { exif: true, orientation, gps }
}

/** Afmetingen uit de SOF-marker, dus wat er echt in de pixels staat. */
function sizeOf(b) {
  let i = 2
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) {
      i++
      continue
    }
    const marker = b[i + 1]
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7) }
    }
    if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd9)) {
      i += 2
      continue
    }
    i += 2 + b.readUInt16BE(i + 2)
  }
  return { width: 0, height: 0 }
}

/** Alles wat er aan één bestand mankeert. Lege lijst betekent: klaar om te gaan. */
function problems(file) {
  const b = readFileSync(file)
  const kind = container(b)
  const ext = extname(file).toLowerCase()
  const out = []

  if (kind !== 'jpeg') {
    out.push({
      hard: true,
      text:
        kind === 'onbekend'
          ? 'onbekend bestandsformaat'
          : `is eigenlijk ${kind}, met een ${ext}-extensie`,
    })
    return out
  }

  const { exif, orientation, gps } = exifOf(b)
  const { width, height } = sizeOf(b)

  // Dit is de enige die echt schade doet, dus die noemen we apart.
  if (gps) out.push({ hard: true, text: 'bevat GPS-coordinaten' })
  if (orientation && orientation !== 1) {
    out.push({ hard: true, text: `staat gedraaid opgeslagen (orientation ${orientation})` })
  }
  if (exif && !gps && (!orientation || orientation === 1)) {
    out.push({ hard: false, text: 'heeft nog EXIF eraan hangen' })
  }
  if (Math.max(width, height) > MAX_EDGE) {
    out.push({ hard: false, text: `${width}x${height}, groter dan ${MAX_EDGE} px` })
  }
  if (statSync(file).size > MAX_BYTES) {
    out.push({
      hard: false,
      text: `${Math.round(statSync(file).size / 1024)} KB, meer dan ${MAX_BYTES / 1024} KB`,
    })
  }

  return out
}

/* ---------------------------------------------------------- bijwerken --- */

/**
 * Draaien, verkleinen en alle metadata eraf, met Pillow.
 *
 * `exif_transpose` bakt de draaiing in de pixels in plaats van hem als vlag
 * mee te sturen. Dat is precies het verschil dat de vorige foto scheef zette.
 */
const PY = `
import sys
from PIL import Image, ImageOps
src, edge = sys.argv[1], int(sys.argv[2])
im = ImageOps.exif_transpose(Image.open(src)).convert('RGB')
im.thumbnail((edge, edge), Image.LANCZOS)
im.save(src, 'JPEG', quality=82, optimize=True, progressive=True)
print(f'{im.size[0]}x{im.size[1]}')
`

function fix(file) {
  return execFileSync('python3', ['-c', PY, file, String(MAX_EDGE)], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim()
}

/* ------------------------------------------------------------------------ */

const files = readdirSync(DIR)
  .filter((f) => /\.(jpe?g|png|webp|avif|heic)$/i.test(f))
  .sort()

if (files.length === 0) {
  console.log('Geen foto\'s in src/assets/vault/.')
  process.exit(0)
}

let broken = 0
let fixed = 0

for (const name of files) {
  const file = join(DIR, name)
  const found = problems(file)

  if (found.length === 0) {
    if (!CHECK) console.log(`ok    ${name}`)
    continue
  }

  if (CHECK) {
    broken++
    console.log(`FOUT  ${name}`)
    for (const p of found) console.log(`        ${p.hard ? '!' : '·'} ${p.text}`)
    continue
  }

  const before = Math.round(statSync(file).size / 1024)
  try {
    const size = fix(file)
    const after = Math.round(statSync(file).size / 1024)
    fixed++
    console.log(`fixed ${name}  ->  ${size}, ${before} KB naar ${after} KB`)
    for (const p of found) console.log(`        was: ${p.text}`)
  } catch (err) {
    broken++
    console.log(`FOUT  ${name}: ${String(err.stderr || err.message).trim()}`)
  }
}

if (CHECK && broken > 0) {
  console.log(
    `\n${broken} foto('s) nog niet klaar om te publiceren. Draai: npm run photos`,
  )
  process.exitCode = 1
} else if (!CHECK) {
  console.log(`\n${fixed} bijgewerkt, ${files.length - fixed} stond al goed.`)
  if (broken > 0) process.exitCode = 1
}
