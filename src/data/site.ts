/**
 * Centrale configuratie. Vul `tokenAddress` en `creatorWallet` in zodra de token
 * live staat op pump.fun — de hele site schakelt dan automatisch van "pre-launch"
 * naar live data. Laat ze leeg om de pre-launch staat te tonen.
 */
export const site = {
  name: 'EMBER',
  ticker: 'EMBER',
  tagline: 'The whole line, or nothing.',

  /** Solana mint address. Leeg = pre-launch modus. */
  tokenAddress: '',

  /**
   * De twee potten, allebei publiek.
   *
   * De creator fees worden 50/50 verdeeld over deze wallets. Ze staan hier
   * omdat het openbare adressen zijn: iedereen mag ze op Solscan naslaan en
   * nakijken wat er in zit en wat eruit gaat. Dat is het punt.
   *
   * `/api/treasury` haalt de saldo's live op, zodat de site niet hoeft te
   * beweren hoeveel er in de pot zit maar het gewoon laat zien.
   */
  wallets: {
    /** 50% — losse kaarten van de checklist kopen. Voedt de teller. */
    hunt: '9buyzGoxoN2HQdtdueVdfbNPF5f9eboFcF4GfSzZEaLG',
    /** 50% — verzegelde pakjes. Wat eruit komt gaat naar burns en giveaways. */
    rips: 'AhjomZS8EPnY8vMVcWDehAF4NZxi7Y6Panr6f4K5oGUK',
  },

  /** Blijft bestaan voor de "verifieer op Solscan"-link; wijst naar de jachtpot. */
  creatorWallet: '9buyzGoxoN2HQdtdueVdfbNPF5f9eboFcF4GfSzZEaLG',

  /**
   * De afbakening van de missie. Dit is de belangrijkste zin op de site: zonder
   * een vaste, publiek narekenbare scope betekent "34 / 200" niets en kan
   * iedereen je tellingen aanvechten.
   *
   * Let op hoe makkelijk dit misgaat. Bulbapedia noemt 50 Charizard-kaarten.
   * Daarvan zijn er 47 in het Engels verschenen, in 113 verschillende drukken.
   * Drie totaal verschillende getallen, één bron. Wij tellen drukken: elke
   * afzonderlijke Engelse kaart is een eigen vinkje.
   *
   * `snapshotDate` staat er omdat de lijst groeit met elke nieuwe set. Een
   * noemer "bevriezen" kan alleen als erbij staat per wanneer. Nieuwe sets
   * worden alleen toegevoegd na een publieke aankondiging, nooit stilletjes.
   */
  scope: {
    label: 'every English printing of every card in the line',
    detail:
      'Alternate arts, full arts, promos and reprints each count separately. Japanese-exclusive cards do not count.',
    source: 'Bulbapedia',
    snapshotDate: '2026-08-03',
    /** De volledige lijst, gegenereerd uit de bron. Zie scripts/verify-totals.mjs. */
    checklistUrl: '#/checklist',
    sourceUrls: {
      ember: 'https://bulbapedia.bulbagarden.net/wiki/Charmander_(TCG)',
      flame: 'https://bulbapedia.bulbagarden.net/wiki/Charmeleon_(TCG)',
      inferno: 'https://bulbapedia.bulbagarden.net/wiki/Charizard_(TCG)',
    },
  },

  /**
   * Hoe de creator fees verdeeld worden. Twee aparte motoren:
   *
   * - `hunt` — losse kaarten kopen om de set af te maken. Dit voedt de teller.
   * - `rips` — verzegelde pakjes om op camera te openen. Alles wat daar uit
   *   komt en niet in de lijn thuishoort, gaat naar holders.
   *
   * De verdeling is 50/50 en dat is een keuze, geen optimum. Pakjes zijn een
   * hopeloos inefficiënte manier om een set compleet te krijgen — puur op snelheid
   * zou alles naar `hunt` moeten. De helft gaat naar `rips` omdat de helft van
   * dit project voor de holders is. Dat betekent dat de set ongeveer twee keer
   * zo lang duurt. Dat is de prijs, en die staat zichtbaar op de site.
   *
   * Moet samen 100 zijn. Verander je dit, pas dan ook de uitleg in
   * `components/Mission.tsx` aan — daar staat waaróm het zo verdeeld is.
   */
  feeSplit: {
    hunt: 50,
    rips: 50,
  },

  /**
   * The Furnace: kaarten uit het overschot claimen door tokens te verbranden.
   *
   * Twee dingen bewust vastgelegd:
   *
   * 1. Hier komen nooit kaarten van de checklist in. Die vormen de set die we
   *    beloofd hebben af te maken — claimbaar maken zou betekenen dat de teller
   *    op de homepage kan dalen, en dan is de missie een leeg verhaal.
   * 2. Het adres hieronder is Solana's incinerator. Tokens die daarheen gaan
   *    zijn onherroepelijk weg: niemand heeft de sleutel. Let op dat dit de
   *    *gerapporteerde* supply niet verlaagt, in tegenstelling tot een echte
   *    SPL-burn-instructie. Beweer dus niet dat de supply krimpt — beweer dat
   *    de tokens uit omloop zijn, want dat is wat er gebeurt.
   */
  furnace: {
    burnAddress: '1nc1nerator11111111111111111111111111111111',
    /** Waar mensen hun transactie naartoe sturen om een claim te melden. */
    claimVia: 'X (DM)',
  },

  /**
   * Verzendadressen op /#/shipping.
   *
   * `publicKey` versleutelt de adressen in de browser van de bezoeker. Deze
   * sleutel hoort publiek te zijn — je kunt er alleen mee versleutelen. De
   * bijbehorende privésleutel staat in `secrets/` op jouw computer en nergens
   * anders; zonder die sleutel is de opgeslagen data onleesbaar, ook voor ons
   * en voor de hostingpartij.
   *
   * Aanmaken met: node scripts/keygen.mjs
   * Uitlezen met: node scripts/read-addresses.mjs
   *
   * Zolang dit leeg is, is het formulier uitgeschakeld.
   */
  shipping: {
    publicKey:
      'MIIBojANBgkqhkiG9w0BAQEFAAOCAY8AMIIBigKCAYEAkao6RMTe/gAFPctcUTukDHP9Afq5K2SpcUwNQpujXV85oWLMkZNmEBUq0ILGC1cDj8Ir7qhZ2ubgrb7AUzDiPD6eaF7097icYTmZGfL1Wcot380+q0/fmCYbqnTAMi9Q7w+4RDm0PVk/G6EH4iTdXUbRL6+llb6MCrhq/xEkvwBDsObNLNB19IPx7q+7Y/Duf6ylj4gBcSvkKTerxTK30CMg5Qr1d8MrO7wLR/maSxFlFQyfN/NFWvIInZ+zS5u5piizXtVoSMLzVKOi/wN9zzPqMtRBjqLbRI04ux3OSb23FvtnSe7yd33B8/n4Te2J7srroaD5SV8G9Pismlh3W7ixovbVDwOoyamUsN0O6eo+sovD1CPPhVQWM7/zDsPGXFrVMTXj3+ZswlsLI8sbxi/PS9o6ET58PYJCAmwcgOJMU0llebFPQwhd5j0YdUwi1qZgdpwX/VzOMG5UnGVhWzxj4qk9EaxRI9b572/CIQ8j9t1rKCF3ZhzHPG5wBA4vAgMBAAE=',
  },

  /**
   * Holder-tiers voor de giveaways. Elke kaart van waarde die de collectie niet
   * nodig heeft gaat naar holders — hoe groter de holder, hoe meer lootjes.
   *
   * Drempels staan bewust in procent van de supply, niet in aantallen tokens:
   * bij een memecoin beweegt de koers te hard om vaste aantallen zinnig te
   * houden. `minSupplyPct` is het minimum om in die tier te vallen.
   */
  holderTiers: [
    {
      name: 'Spark',
      minSupplyPct: 0,
      blurb: 'Every holder, no minimum. In the draw for every card we give away.',
    },
    {
      name: 'Blaze',
      minSupplyPct: 0.1,
      blurb:
        'Weighted entries plus access to the graded and vintage draws, not just the modern pulls.',
    },
    {
      name: 'Wildfire',
      minSupplyPct: 0.5,
      blurb:
        'Everything above, plus first claim on the single best card of each month before it goes to a draw.',
    },
  ],

  links: {
    x: 'https://x.com/',
    youtube: '',
    pumpfun: '',
    dexscreener: '',
  },
} as const

/** Solscan-link naar de fee-wallet, of null als die nog niet ingevuld is. */
export function creatorWalletUrl(): string | null {
  return site.creatorWallet
    ? `https://solscan.io/account/${site.creatorWallet}`
    : null
}
