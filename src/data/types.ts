export type Pickup = {
  /** Vrij label, bv. "Charmander — Team Rocket #68" */
  label: string
  /** ISO datum, bv. "2026-08-01" */
  date: string
  /** Bij welke fase deze aanwinst hoort. */
  stage: StageKey
  /**
   * Betaald bedrag in USD. Laat weg als de kaart niet met fees gekocht is —
   * `$0` leest als "gratis gescoord" en dat is iets anders.
   */
  paidUsd?: number
  /**
   * Eén regel herkomst, voor het geval die niet vanzelfsprekend is. De sectie
   * belooft dat elke kaart met creator fees betaald is; komt er een kaart langs
   * die daar niet onder valt, dan staat dat hier en niet in de kleine lettertjes.
   */
  note?: string
  /** Pad naar foto in /public/vault/, bv. "/vault/rocket-68.jpg". Leeg = placeholder. */
  image?: string
}

export type StageKey = 'ember' | 'flame' | 'inferno'

/** Wat je zelf over een fase invult. De getallen komen er niet in. */
export type StageMeta = {
  key: StageKey
  /** "Ember" | "Flame" | "Inferno" */
  stage: string
  /** Welke Pokémon deze fase afdekt. */
  pokemon: string
  /** Korte omschrijving van wat deze fase inhoudt. */
  blurb: string
}

/**
 * Een fase mét zijn getallen. Die worden afgeleid, nooit ingetypt:
 *
 * - `total` = het aantal rijen van deze fase in `checklist.json`
 * - `owned` = hoeveel van die rijen in `collection.ownedIds` staan
 *
 * Daardoor kunnen de tellers op de site per definitie niet afwijken van de
 * checklist die je publiceert. Wil je een noemer wijzigen, dan gaat dat via
 * `npm run verify-totals` en de bron — niet met de hand.
 */
export type Stage = StageMeta & {
  owned: number
  total: number
}

export type Collection = {
  /** ISO datum van de laatste update. */
  lastUpdated: string
  /**
   * Welke set we nu aan het bouwen zijn. Set 1 houden we zelf; elke set daarna
   * wordt in zijn geheel verloot onder de holders. Hoog dit op zodra een set
   * compleet is en zet de `owned` van alle fases terug op 0.
   */
  currentSet: number
  /** Hoeveel complete sets al zijn weggegeven. */
  setsAwarded: number
  /** Totaal aan creator fees dat is uitgegeven (jacht + pakjes samen). */
  feesSpentUsd: number
  /** Kaarten erbij in de afgelopen 7 dagen, over alle fases. */
  weeklyDelta: number
  /**
   * Welke drukken we bezitten, als `id` uit `checklist.json`. Dit is de enige
   * plek waar bezit wordt vastgelegd — alle tellers en balken op de site
   * worden hieruit afgeleid. Eén regel erbij per aangeschafte kaart.
   */
  ownedIds: string[]
  /**
   * Foto's van kaarten die we zelf bezitten, per checklist-`id`:
   * `{ "ember-base-set-46-102": "/vault/base-46.jpg" }`.
   *
   * Optioneel en bewust los van `ownedIds`, zodat je een aanwinst meteen kunt
   * loggen en de foto later toevoegt. Alleen foto's van kaarten die we echt in
   * handen hebben — geen scans van internet.
   */
  photos?: Record<string, string>
  /** De drie fases van de evolutielijn. Bewust zonder getallen. */
  stages: StageMeta[]
  recentPickups: Pickup[]
  /** De tweede motor: pakjes voor content en giveaways. */
  rips: {
    /** Deel van `feesSpentUsd` dat naar verzegelde pakjes ging. */
    spentUsd: number
    /** Aantal pakjes dat we op camera geopend hebben. */
    packsOpened: number
  }
}

/** Eén Engelse druk uit de checklist. Zie scripts/verify-totals.mjs. */
export type ChecklistRow = {
  /** Stabiele sleutel, bv. "ember-base-set-46-102". */
  id: string
  stage: StageKey
  /** Kaartnaam zoals Bulbapedia hem noemt, bv. "Charizard-EX". */
  card: string
  /** De Engelse set waarin deze druk verscheen. */
  set: string
  /** Kaartnummer, bv. "4/102". Null bij sets zonder nummering. */
  number: string | null
  /**
   * Waar: dit ontwerp is nooit in het Engels verschenen, dus telt de Japanse
   * uitgave. Zonder die zeven zou "elke kaart uit de lijn" niet kloppen.
   */
  japaneseOnly?: boolean
  /** De Bulbapedia-pagina waar deze regel vandaan komt. */
  sourceUrl: string
}

/**
 * De volledige noemer, gegenereerd uit de bron. Nooit met de hand bewerken —
 * draai `npm run build-checklist`.
 */
export type Checklist = {
  /** ISO datum waarop dit uit de bron geteld is. */
  snapshotDate: string
  /** "Bulbapedia" */
  source: string
  note: string
  rows: ChecklistRow[]
}

/**
 * Eén kaart uit het overschot, aangeboden om te claimen of te verloten.
 *
 * Dit gaat nooit over kaarten van de checklist. Die vormen de set die we
 * beloofd hebben af te maken; als die weg te claimen zouden zijn, zou de teller
 * op de homepage kunnen dalen en dan is de hele missie een leeg verhaal. Hier
 * staan alleen dubbele exemplaren en kaarten die niet uit de Charmander-lijn
 * komen.
 */
export type FurnaceOffer = {
  id: string
  /** Wat het is, bv. "Blastoise — Base Set #2". */
  card: string
  /** Foto in /public/vault/. Zonder foto toont de kaart een placeholder. */
  image?: string
  /**
   * Waar deze kaart nu heen gaat:
   *
   * - `burn`     — te claimen door tokens te verbranden
   * - `giveaway` — gaat rechtstreeks naar een verloting, niet te claimen
   */
  mode: 'burn' | 'giveaway'
  /** Hoeveel tokens er verbrand moeten worden. Alleen bij `mode: "burn"`. */
  burnAmount?: number
  /**
   * ISO-tijdstip waarop het burn-venster sluit. Leeg = geen venster, deze kaart
   * blijft claimbaar tot iemand hem pakt.
   *
   * Staat er wél een tijd, dan vertelt de site na afloop dat de kaart naar de
   * eerstvolgende trekking gaat. Zorg dat je dat dan ook echt doet — de regel
   * staat publiek op de site en is dus controleerbaar.
   */
  burnDeadline?: string
  /** Korte toelichting, bv. waarom deze kaart niet in de collectie hoort. */
  note?: string
  /** Ingevuld zodra iemand geclaimd heeft. Dit is het bewijs. */
  claim?: {
    /** Wallet die de tokens verbrand heeft. */
    wallet: string
    /** Transaction signature van de burn. Wordt naar Solscan gelinkt. */
    txSignature: string
    /** ISO datum van de claim. */
    at: string
  }
}

export type Giveaway = {
  /** Wat er te winnen is. */
  prize: string
  /** "live" = loopt nu, "closed" = afgelopen. */
  status: 'live' | 'closed'
  /** Hoe je meedoet (alleen relevant bij status "live"). */
  howToEnter?: string
  /** ISO datum van de trekking. */
  drawnAt?: string
  /** Wallet van de winnaar, ingekort weergegeven. */
  winner?: string
  /** Solana transaction signature van de verzending/uitbetaling. */
  txSignature?: string
}
