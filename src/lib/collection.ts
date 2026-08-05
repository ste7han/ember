import checklistRaw from '../data/checklist.json'
import content from '../data/content.json'
import raw from '../data/collection.json'
import type {
  Checklist,
  ChecklistRow,
  Collection,
  Rip,
  Stage,
} from '../data/types'
import { photoUrl } from './photos'

export const collection = raw as Collection

/** De volledige noemer. Gegenereerd uit Bulbapedia, zie scripts/verify-totals.mjs. */
export const checklist = checklistRaw as Checklist

const owned = new Set(collection.ownedIds)

/** Hebben we deze specifieke druk? `id` komt uit checklist.json. */
export const isOwned = (row: ChecklistRow) => owned.has(row.id)

/**
 * Onze eigen foto van deze kaart, als we die gemaakt hebben.
 *
 * Normaal hoef je niets in te vullen: leg een bestand in `src/assets/vault/`
 * met de checklist-`id` als naam en hij wordt vanzelf gevonden. De `photos`-map
 * in `collection.json` blijft bestaan als uitzondering, voor als een foto om
 * wat voor reden dan ook anders moet heten.
 */
export const photoFor = (row: ChecklistRow): string | undefined =>
  photoUrl(collection.photos?.[row.id]) ?? photoUrl(row.id)

/**
 * De fases mét hun getallen.
 *
 * `total` en `owned` worden hier afgeleid en staan nergens ingetypt. Daardoor
 * kan de site niet iets anders beweren dan de checklist die eronder ligt: de
 * noemer ís het aantal rijen, de teller ís het aantal aangevinkte rijen.
 */
export const stages: Stage[] = collection.stages.map((meta) => {
  const rows = checklist.rows.filter((r) => r.stage === meta.key)
  return {
    ...meta,
    total: rows.length,
    owned: rows.filter(isOwned).length,
  }
})

/** Alle checklistrijen van één fase, in bronvolgorde. */
export const rowsFor = (key: Stage['key']) =>
  checklist.rows.filter((r) => r.stage === key)

/**
 * Ids in `ownedIds` die niet in de checklist voorkomen — een typefout, of een
 * kaart uit een oudere versie van de lijst. Die zou stilletjes uit de telling
 * vallen, dus melden we het tijdens ontwikkelen.
 */
export const unknownOwnedIds = collection.ownedIds.filter(
  (id) => !checklist.rows.some((r) => r.id === id),
)

if (import.meta.env.DEV && unknownOwnedIds.length > 0) {
  console.warn(
    `[collection] ${unknownOwnedIds.length} id(s) in ownedIds staan niet in checklist.json ` +
      `en tellen dus niet mee: ${unknownOwnedIds.join(', ')}`,
  )
}

/** Set 1 houden we zelf. Alles daarna wordt verloot onder de holders. */
export const currentSetGoesToHolder = collection.currentSet > 1

/** Totaal aantal kaarten dat we bezitten, over alle drie de fases. */
export const ownedTotal = stages.reduce((n, s) => n + s.owned, 0)

/** Totaal aantal kaarten dat binnen de scope bestaat. */
export const targetTotal = stages.reduce((n, s) => n + s.total, 0)

export const isComplete = (s: Stage) => s.owned >= s.total

/** Hoeveel van de drie fases al helemaal vol zitten. */
export const stagesComplete = stages.filter(isComplete).length

/**
 * Voortgang als percentage, altijd tussen 0 en 100.
 *
 * Afgerond, want dit gaat naar de breedte van een balk. Voor een percentage
 * dat iemand léést is `pctLabel` bedoeld.
 */
export function pct(owned: number, total: number) {
  if (total <= 0) return 0
  return Math.min(100, Math.round((owned / total) * 100))
}

/**
 * Hetzelfde percentage, maar om te tonen: één decimaal.
 *
 * Op hele procenten afronden gaf "0% of the way there" terwijl er wel degelijk
 * een kaart in de vault lag. Bij een noemer van 207 is één kaart 0,5%, en dan
 * is 0% gewoon onwaar. Een halve regel tekst die niet klopt is precies wat we
 * overal aan het weghalen zijn.
 *
 * De decimaal valt weg als hij niets toevoegt, dus "50%" en niet "50,0%".
 */
export function pctLabel(owned: number, total: number): string {
  if (total <= 0 || owned <= 0) return '0'

  const exact = Math.min(100, (owned / total) * 100)
  const rounded = Math.round(exact * 10) / 10

  // Bezit je iets, dan mag er nooit een nul staan, ook niet bij een enorme
  // noemer. Liever "minder dan 0,1" dan een getal dat het bestaan ontkent.
  if (rounded === 0) return '<0.1'

  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}

/** Voortgang over de hele set, als tekst. Dit is wat de hero laat zien. */
export const overallPctLabel = pctLabel(ownedTotal, targetTotal)

/**
 * Welke gedaante de mascotte nu heeft.
 *
 * Bewust gekoppeld aan de voortgang over de héle set, niet aan de volgorde van
 * de fases. We verzamelen namelijk niet op volgorde: we kopen wat we tegenkomen,
 * en bij een pakje bepaalt het pakje. Een model waarin je "eerst Charmander doet"
 * zou de site elke keer laten liegen zodra er een Charizard binnenkomt.
 *
 * Dus: elke derde van de collectie evolueert de mascotte een stap. Dat houdt de
 * metafoor overeind zonder een volgorde te suggereren die er niet is.
 */
export const mascotStage: Stage =
  targetTotal <= 0
    ? stages[0]
    : stages[
        Math.min(
          stages.length - 1,
          Math.floor((ownedTotal / targetTotal) * stages.length),
        )
      ]

/**
 * Hoeveel pakjes er open zijn gegaan, geteld uit de rips-log.
 *
 * Stond eerst als los getal in collection.json, naast een lijst die hetzelfde
 * bijhoudt. Twee plekken voor één feit betekent dat er vroeg of laat een van
 * de twee niet klopt, en dan is de vraag welke. Nu is er nog maar één.
 */
export const rips = content as Rip[]

export const packsOpened: number = (content as Rip[]).reduce(
  (n, r) => n + (r.packs ?? 0),
  0,
)

/** Hoeveel van die rips ook echt gefilmd zijn. */
export const ripsFilmed: number = (content as Rip[]).filter((r) => r.url).length
