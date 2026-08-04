# EMBER

Website voor de $EMBER token. 80% van de creator fees koopt elke kaart uit de
Charmander-evolutielijn — Charmander, dan Charmeleon, dan Charizard. De
voortgangsbalk op de homepage is het hart van de site.

## Draaien

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # productiebuild in dist/
npm run preview  # bekijk de productiebuild lokaal
```

Deploy op Cloudflare Pages:

```bash
npm run deploy        # bouwt en zet live
npm run dev:full      # lokaal mét de API-endpoints en een lokale database
```

`npm run dev` serveert alleen de site — de endpoints hebben een Worker-omgeving
nodig en draaien daar niet. Gebruik `dev:full` als je die wilt testen.

## De site bijwerken

Je hoeft nooit code aan te raken. Alles zit in `src/data/`. Wijzig een bestand,
commit, en `npm run deploy` zet het binnen een minuut live.

### `src/data/site.ts` — eenmalig invullen bij launch

| Veld            | Wat                                                             |
| --------------- | --------------------------------------------------------------- |
| `tokenAddress`  | Het mint address van pump.fun. Zolang dit leeg is staat de site in pre-launch modus. |
| `creatorWallet` | De publieke wallet waar de fees binnenkomen. Vult de "verifieer op Solscan"-link. |
| `scope`         | De afbakening van de missie. Zie hieronder — dit is het belangrijkste veld op de site. Bevat een `snapshotDate`; wijzig die niet zonder de checklist opnieuw te genereren. |
| `feeSplit`      | Verdeling tussen The Hunt en The Rips, in procenten. Moet samen 100 zijn. |
| `links`         | X, YouTube, pump.fun, DexScreener. Lege links worden automatisch verborgen of uitgeschakeld. |

Zodra `tokenAddress` is ingevuld haalt de site elke 45 seconden live prijs en
marketcap op bij DexScreener. Daar hoef je niks voor te doen.

### De scope — lees dit voordat je lanceert

Kaarttellingen zijn glibberig, en niet omdat iemand liegt. Bulbapedia noemt
**50 Charizard-kaarten**. Daarvan zijn er **47** ooit in het Engels verschenen,
en die 47 zijn **113 keer** gedrukt. Eén bron, drie verdedigbare antwoorden.
Zonder een vaste, publiek narekenbare afbakening betekent "34 / 200" niets en kan
iedereen je tellingen aanvechten — en dan ben je precies de geloofwaardigheid
kwijt waar het hele project op drijft.

De site telt **drukken**: elke afzonderlijke Engelse kaart is een eigen vinkje.
Alternate arts, full arts, promo's en herdrukken tellen dus los mee;
Japans-exclusieve kaarten niet. Dat staat zichtbaar in de hero, de missie-sectie
en de evolutie-sectie.

| Fase | Pokémon | Totaal |
| --- | --- | --- |
| Ember | Charmander | 49 |
| Flame | Charmeleon | 38 |
| Inferno | Charizard | 113 |
| | | **200** |

**Deze getallen zijn geverifieerd op 3 augustus 2026** tegen de ruwe wikitext van
de drie Bulbapedia-pagina's, en gekruist met Bulbapedia's eigen categorie-API. Ze
staan vast. Reken ze zelf na:

```bash
npm run verify-totals
```

Dat script haalt de bron live op en zegt OK of FOUT per fase. Je hebt er niets
voor nodig behalve Node.

**Als het script FOUT zegt** is er een nieuwe set uit, of er is iets op
Bulbapedia gewijzigd. Verhoog de noemer dan niet meteen. Zoek eerst uit wát er
bij is gekomen, besluit bewust of het binnen je scope valt, en **kondig de
wijziging publiek aan voordat je hem doorvoert**. Een noemer die stilletjes
beweegt maakt alle voortgang die je tot dan toe hebt laten zien waardeloos.

### De checklist

`src/data/checklist.json` bevat alle 200 drukken, met set en kaartnummer, en
staat publiek op **`/#/checklist`**. Dat is het verschil tussen "wij zeggen 200"
en "hier is de lijst, tel zelf".

Op de homepage staat diezelfde lijst als **de muur** (`#wall`): 200 kaartvormige
vakjes, één per druk. Leeg is een omtrek, binnengehaald licht op. Dat is dezelfde
informatie als de voortgangsbalk, maar dan zo dat je in één oogopslag ziet hoe
groot de opgave is — en dat Inferno met 113 vakjes ruim de helft van het werk is.

De vakjes zijn vormgegeven als ruilkaart: rand, art window, tekstbalk. Let op
dat dit **niet** het Pokémon-kaarttemplate is en dat ook nooit mag worden. Dat
ontwerp — de gele rand, de HP-plaatsing, de attack-boxen, de energiesymbolen —
is net zo goed beschermd werk als de illustratie erop. Wat hier staat is de
algemene bouw die élke ruilkaart deelt, in ons eigen palet.

Zet je een pad in `photos`, dan verschijnt jouw eigen foto in het art window van
dat vakje en wordt de muur langzaam een echte binderpagina. **Alleen foto's van
kaarten die je zelf in handen hebt** — geen scans van internet, want dan ben je
alsnog terug bij af.

Het bestand is gegenereerd — **nooit met de hand bewerken**. Opnieuw opbouwen:

```bash
npm run build-checklist
```

### De twee motoren

De site houdt twee dingen bewust uit elkaar, omdat ze niet hetzelfde doen:

- **The Hunt** — losse kaarten kopen die nog van de checklist af moeten. Dit is
  de missie en het enige dat de teller beweegt.
- **The Rips** — verzegelde pakjes om op camera te openen. Alles wat daaruit
  komt en niet in de lijn thuishoort, gaat naar holders.

- **Dev** — kosten en eigen aankopen: listings, gereedschap, hosting, en pakjes
  die je voor jezelf koopt.

De verdeling is **40/40/20**. Tachtig procent gaat naar de missie en de holders,
twintig procent naar het draaiend houden.

Een set compleet krijgen via pakjes is hopeloos inefficiënt — je koopt de kaart
die je mist als single, voor een fractie. Puur op snelheid zou alles naar The
Hunt moeten. Dat het niet zo is, is een keuze.

**Die 20% staat met naam en wallet op de site.** Verstop dat niet in een
voetnoot. Een project dat 100% claimt en er stiekem iets afhaalt is één blik op
Solscan verwijderd van klaar zijn; een project dat zegt "dit is mijn deel, kijk
mee" wordt juist geloofd.

Verander je `feeSplit` in `site.ts`, pas dan ook de uitleg in
`components/Mission.tsx` aan. Daar staat waaróm het zo verdeeld is, en die
redenering klopt niet meer bij andere getallen.

### `src/data/collection.json` — na elke aankoop

```jsonc
{
  "lastUpdated": "2026-08-10",
  "feesSpentUsd": 8420,     // totaal uitgegeven, jacht + pakjes samen
  "weeklyDelta": 12,        // kaarten erbij in de afgelopen 7 dagen
  "ownedIds": [             // <- hier voeg je een regel toe per aankoop
    "ember-base-set-46-102",
    "inferno-celebrations-4-102"
  ],
  // "photos" hoef je normaal niet in te vullen — zie "Foto's" hieronder
  "stages": [
    {
      "key": "ember",
      "stage": "Ember",
      "pokemon": "Charmander",
      "blurb": "..."        // geen getallen: die worden afgeleid
    }
    // flame en inferno idem
  ],
  "recentPickups": [
    {
      "label": "Charmander — Team Rocket #68",
      "date": "2026-08-09",
      "stage": "ember",     // ember | flame | inferno
      "paidUsd": 3.5,
      "image": "/vault/rocket-68.jpg"  // optioneel
    }
  ],
  "rips": {
    "spentUsd": 840,        // deel van feesSpentUsd dat naar pakjes ging
    "packsOpened": 12
  }
}
```

### Foto's: alleen het bestand neerzetten

Je hoeft voor foto's **niets in te vullen**. Zet je foto in:

```
src/assets/vault/
```

en noem het bestand precies zoals de `id` uit de checklist:

```
src/assets/vault/ember-base-set-46-102.jpg
```

Dan verschijnt hij vanzelf op de muur, in de Vault en overal waar die kaart
langskomt. Geen pad, geen JSON, geen kans op een typefout.

- kleine letters, geen spaties, geen accenten
- `.jpg` is prima en een stuk kleiner dan `.png`
- schaal terug naar ~1200 px op de lange zijde; een foto rechtstreeks uit je
  telefoon is 4 MB en dat merk je op de site
- snij bij tot de kaartrand — geen tafel, geen hand, geen rommel eromheen

Zonder foto toont de kaart een nette placeholder, dus je kunt een aankoop meteen
loggen en de foto later toevoegen.

**Uitzondering.** Moet een foto om wat voor reden dan ook anders heten, dan kan
dat nog steeds via `photos` in `collection.json` of via `image` bij een pickup of
een furnace-kaart. Begint zo'n waarde met `/`, dan is het een letterlijk pad naar
`public/`; anders is het een bestandsnaam uit `src/assets/vault/`.

### Belangrijk: je telt niet, je vinkt af

Er staat nergens meer een `owned`- of `total`-getal dat je met de hand ophoogt.
In plaats daarvan zet je de **`id` van de druk** in `ownedIds`, en de site leidt
daar alles uit af: de teller in de hero, de balken per fase, de mascotte en de
opgelichte vakjes in het mozaïek.

Dat is bewust. Losse getallen kunnen gaan afwijken van de lijst eronder, en dan
staat er een cijfer op je site dat je niet kunt hardmaken. Nu kán dat niet: de
noemer ís het aantal rijen in `checklist.json` en de teller ís het aantal
aangevinkte rijen.

De juiste `id` vind je op **`/#/checklist`** of in `src/data/checklist.json` —
hij ziet eruit als `ember-base-set-46-102`. Typ je er een verkeerd, dan telt hij
niet mee en krijg je tijdens `npm run dev` een waarschuwing in de console met
precies welke id onbekend is.

### Er is geen volgorde

De site verzamelt de drie fases **tegelijk**, niet na elkaar. Dat is een bewuste
keuze en het is hoe het echt gaat: je koopt wat je tegenkomt, en bij een pakje
bepaalt het pakje. Een site die "eerst Charmander" zegt staat te liegen op het
moment dat er een Charizard binnenkomt.

Praktisch betekent dat:

- De hero toont **de hele set** (`0 / 200`), niet één fase.
- Geen enkele fase is "actief" of "up next". Een fase is `Nothing yet`,
  `In progress` of `Complete`, puur op basis van wat erin zit.
- De mascotte evolueert op **totale voortgang**: elke derde van de 200 kaarten
  een stap. Zie `mascotStage` in `src/lib/collection.ts`.

Je hoeft hier niets voor bij te houden. Hoog gewoon de `owned` op van de fase
waar een kaart bij hoort; de rest volgt vanzelf.

### Giveaways

**De regel:** is het een Charmander, Charmeleon of Charizard, dan blijft hij bij
jullie. Elke andere kaart van waarde gaat naar holders, verloot met lootjes naar
rato van hoeveel iemand houdt.

**En de grote:** set 1 houden jullie zelf. Zodra die compleet is bouw je door aan
set 2, en die wordt in zijn geheel verloot onder één holder. Daarna set 3,
enzovoort. Dubbele kaarten zijn dus geen rommel maar de volgende prijs.

Zodra een set af is: hoog `currentSet` op, zet `setsAwarded` op het aantal
weggegeven sets, en maak `ownedIds` weer leeg. De hero schakelt dan vanzelf van
"ours to keep" naar "goes to a holder when it's done", en de muur staat weer
leeg voor set 2.

Bewaar de oude `ownedIds` wel ergens — dat is de inventaris van de set die je
houdt of weggeeft.

**Geen tiers, geen drempels.** Iedere holder zit in iedere trekking en je kans
is je aandeel: één procent van de supply is één procent van de lootjes. Er is
niets gereserveerd voor grote wallets en geen kaart is verboden voor kleine.

Dat is ook precies wat `lib/raffle.ts` doet: wegen op saldo, verder niets. Er
stonden hier eerder tiers met eigen rechten, maar die kende de tool nooit — de
site beloofde iets wat het mechanisme niet deed. Bouw je ooit toch niveaus, bouw
ze dan éérst in de tool.

In `src/data/giveaways.json` zet je `status` op `"live"` voor een lopende
verloting, `"closed"` voor het archief. Vul bij afgeronde giveaways `winner` en
`txSignature` in — die worden automatisch naar Solscan gelinkt. Dat bewijs is
het punt.

## The Furnace — kaarten claimen door te burnen

`src/data/furnace.json` is een lijst met kaarten uit het **overschot**: dubbele
exemplaren en alles wat niet uit de Charmander-lijn komt. Per kaart bepaal jij
wat ermee gebeurt.

```jsonc
[
  {
    "id": "f1",
    "card": "Blastoise — Base Set #2",
    "image": "/vault/blastoise.jpg",   // optioneel
    "mode": "burn",                    // "burn" | "giveaway"
    "burnAmount": 250000,              // aantal tokens, alleen bij "burn"
    "burnDeadline": "2026-08-14T20:00:00Z",  // optioneel, zie hieronder
    "note": "Korte toelichting.",
    "claim": {                         // pas invullen ná een claim
      "wallet": "7xKX…",
      "txSignature": "5Vfy…",
      "at": "2026-08-12"
    }
  }
]
```

### De drie mogelijkheden

| Wat je wilt | Hoe |
| --- | --- |
| Alleen te claimen, geen haast | `mode: "burn"`, geen `burnDeadline` |
| Te claimen, en anders verloten | `mode: "burn"` + `burnDeadline` |
| Alleen verloten, niet claimbaar | `mode: "giveaway"` |

Bij een `burnDeadline` telt de site live af. Loopt de klok af zonder claim, dan
verandert de kaart vanzelf in *"Goes to the draw"*. **Dat is een belofte die de
site namens jou doet** — neem die kaart daarna dus ook echt mee in de
eerstvolgende trekking, anders staat er iets op je site dat niet klopt.

### Reserveren: voorkomen dat twee mensen voor dezelfde kaart branden

Dit is het gevaarlijkste onderdeel van het hele idee. **Een burn kun je niet
terugdraaien.** Branden er twee mensen voor dezelfde kaart, dan is het geld van
de tweede weg en heeft hij niets.

Daarom kan een bezoeker een kaart eerst **15 minuten vastleggen** op zijn
wallet. Dat slot zit in Redis met `SET ... NX`, wat atomisch is: van tien mensen
die op dezelfde seconde klikken slaagt er precies één. De rest krijgt te zien
wie hem heeft en hoe lang nog.

Dit draait op **Cloudflare D1**. De database heet `ember` en is gekoppeld via
`wrangler.toml`. Schema aanpassen of opnieuw toepassen:

```bash
npm run db:remote     # productie
npm run db:local      # lokale testdatabase
```

**Is de database niet bereikbaar, dan verdwijnt de reserveerknop** en werkt de
rest van de sectie gewoon door.

**Wat het niet oplost:** iemand kan nog steeds branden zonder te reserveren, en
die transactie kan niemand tegenhouden. Daarom staat de regel zichtbaar op de
site: bij twee burns wint de wallet die het slot had, en wie zonder reservering
brandde mag iets anders uit de furnace kiezen tot hetzelfde bedrag. Dat is de
enige remedie die er is, want die tokens komen niet terug. Houd je daaraan, ook
als het ongelegen komt.

### Na een claim

Vul `claim` in met de wallet, de transaction signature en de datum. De site
linkt die signature naar Solscan, net als bij de giveaways. Zonder die
signature is de claim niet narekenbaar en heeft het blok geen waarde.

### Twee dingen die vastliggen

**Kaarten van de checklist komen hier nooit in.** Die vormen de set die je
beloofd hebt af te maken. Zou je die claimbaar maken, dan kan de teller op de
homepage dalen — en dan is de hele missie een leeg verhaal.

**Het burn-adres is Solana's incinerator** (`1nc1nerator111…`), ingesteld in
`site.ts`. Tokens die daarheen gaan zijn onherroepelijk weg omdat niemand de
sleutel heeft. Let wel: dit verlaagt de *gerapporteerde* supply niet, in
tegenstelling tot een echte SPL-burn-instructie. Zeg dus niet dat de supply
krimpt — zeg dat de tokens uit omloop zijn. Dat is wat er gebeurt, en het is
waar.

### Let op: dit geeft je token nut

Zolang `furnace.json` leeg is, verandert er niets. Zodra je er kaarten in zet,
kan `$EMBER` ingewisseld worden voor een fysiek goed, en dat is juridisch iets
anders dan een memecoin met verlotingen. De disclaimer in de footer is daarop
aangepast, maar laat iemand die er verstand van heeft ernaar kijken voordat je
de eerste kaart aanbiedt. Je schept er ook een verplichting mee: wie brandt
heeft recht op zijn kaart, en dat is geen misgelopen verloting maar een
gebroken belofte als je niet levert.

Denk ook aan het verzenden. Je hebt adressen nodig, en dat is persoonsgegevens
bewaren.

## Verzendadressen

Op **`/#/shipping`** kan een holder zijn adres achterlaten, gekoppeld aan zijn
wallet. Wint die wallet iets, dan stuur je het meteen op zonder eerst om
gegevens te hoeven vragen.

### Eenmalig instellen

```bash
node scripts/keygen.mjs
```

Dat maakt een sleutelpaar. De **publieke** sleutel print hij op je scherm; die
zet je in `site.ts` onder `shipping.publicKey` en die mag gewoon op internet
staan — je kunt er alleen mee versleutelen.

De **privé**sleutel komt in `secrets/ember-private-key.txt` te staan. Die map
staat in `.gitignore` en moet daar blijven.

> **Maak een back-up van die privésleutel.** Zonder dat bestand is elk
> opgeslagen adres onleesbaar, ook voor jou. Draai `keygen` niet nog een keer:
> dan zijn alle bestaande adressen weg.

Zolang `shipping.publicKey` leeg is, staat het formulier uit en meldt de pagina
netjes dat het nog niet open is. Zet hem dus in vóórdat je ernaar linkt.

### Adressen uitlezen

```bash
npm run addresses                    # alle adressen
npm run addresses -- <wallet>        # één wallet
npm run addresses -- --local         # uit de lokale testdatabase
```

Dit draait op jouw computer met jouw sleutel, en praat met D1 via je bestaande
wrangler-login — er komt geen apart token aan te pas. Er staat geen inlogpagina
op de site, dus er is ook niets te kraken.

### Hoe het beveiligd is

- **De server ziet nooit een adres.** Het wordt in de browser van de bezoeker
  versleuteld met jouw publieke sleutel. Wat er wordt opgeslagen is onleesbaar
  zonder het bestand in `secrets/` — ook voor de hostingpartij, ook bij een
  datalek.
- **Wie een adres opslaat moet de wallet bezitten.** De bezoeker ondertekent een
  bericht met zijn wallet (geen transactie, geen kosten) en de server
  controleert die handtekening. Zonder die controle kan iedereen het adres van
  een grote holder overschrijven met het zijne en zo prijzen onderscheppen.
- Handtekeningen ouder dan tien minuten worden geweigerd, en het bericht bevat
  de wallet zelf, zodat een handtekening niet voor een andere wallet
  hergebruikt kan worden.

### Wat je zelf moet regelen

Je bewaart persoonsgegevens van EU-burgers. Daar hoort een **privacyverklaring**
bij die zegt wat je bewaart, waarom, hoe lang en hoe iemand het laat
verwijderen. Er staat nu een korte uitleg op het formulier, maar dat is geen
volwaardige verklaring.

Verwijderen op verzoek:

```bash
npx wrangler d1 execute ember --remote --command "delete from addresses where wallet='...'"
```

Ik ben geen jurist. Laat hier iemand naar kijken die dat wel is voordat het
formulier live gaat.

## De adminpagina

Op **`/#/admin`** beheer je de burn events en de giveaways met een formulier, in
plaats van JSON te typen. Je ondertekent per handeling met de deployer-wallet.

**Elke wijziging wordt een commit in deze repository.** Dat is trager dan een
database, ongeveer een minuut voordat het live staat, en dat is met opzet: een
gepubliceerde uitslag heeft dan een datum en is niet stilletjes aan te passen.
Voor een project dat draait op narekenbaarheid is dat het verschil tussen bewijs
en belofte.

### Eenmalig instellen

**1. Een GitHub-token.** Maak er een aan op github.com onder *Settings →
Developer settings → Personal access tokens → Fine-grained tokens*. Geef hem
toegang tot alleen deze repository, en als enige recht **Contents: read and
write**. Zet hem daarna neer:

```bash
npx wrangler pages secret put GITHUB_TOKEN
npx wrangler pages secret put GITHUB_REPO     # ste7han/ember
```

**2. Automatisch uitrollen.** Er staat een workflow in `.github/workflows/`
die na elke push opnieuw uitrolt. Die heeft twee secrets nodig in GitHub:

```bash
gh secret set CLOUDFLARE_API_TOKEN     # maak er een aan met Pages: Edit
gh secret set CLOUDFLARE_ACCOUNT_ID
```

Zonder stap 2 maakt de adminpagina wel een commit, maar verandert er niets aan
de live site.

### Wat de adminpagina niet kan

Alleen `furnace.json` en `giveaways.json` zijn bewerkbaar. Dat staat vast in
`functions/api/publish.js`. De checklist, de collectie en alle instellingen
blijven handwerk, want dat zijn de cijfers waar je op afgerekend wordt en die
wil je niet per ongeluk vanuit een formulier kunnen wijzigen.

Ongeldige JSON wordt geweigerd voordat hij gecommit wordt, zodat een typefout de
volgende build niet kan slopen.

## De trekkingstool

Staat op **`/#/draw`**. Niet in de nav, wel publiek bereikbaar — dat is bewust,
zodat kijkers dezelfde tool kunnen openen en je uitslag kunnen narekenen.

De tool is niet gebonden aan één soort prijs. Losse kaarten uit een pack
opening, een graded hit, een complete set: het prijsveld is vrije tekst.

### Holders automatisch ophalen

De knop **Load holders** haalt de holderlijst op, telt saldo's per eigenaar bij
elkaar op, gooit de uitgesloten wallets eruit en zet het resultaat in het
tekstvak. Daarvoor moeten er drie waarden ingesteld staan als Pages-secrets:

```bash
npx wrangler pages secret put SOLANA_RPC_URL   # endpoint van bv. Helius
npx wrangler pages secret put EMBER_MINT       # het mint address
npx wrangler pages secret put EMBER_EXCLUDE    # komma-gescheiden wallets
```

Het mint address staat bewust in een secret en niet in de query, zodat niemand
dit endpoint kan gebruiken om op jouw quota willekeurige tokens op te vragen.

**`EMBER_EXCLUDE` is niet optioneel.** Een holderlijst bevat ook de liquidity
pool van pump.fun of Raydium, jullie eigen fee-wallet, en soms exchange-wallets.
Die hebben enorme saldo's. Laat je ze staan, dan wint je eigen LP de eerste
trekking met een gewicht waar geen holder tegenop kan. De tool meldt het als er
niets uitgesloten is — negeer die melding niet.

Lokaal testen kan met `npm run dev:full`; zet de waarden dan in een
`.dev.vars`-bestand (staat in .gitignore).

De lijst landt zichtbaar in het tekstvak, zodat je hem kunt controleren en
aanpassen. Klik daarna **Save snapshot** om hem als bestand te bewaren. Doe dat
altijd: haalt de tool de holders alleen intern op, dan is de momentopname na
afloop weg en kan niemand je uitslag meer narekenen — en dat is het enige wat
deze tool te bieden heeft.

### Zo doe je een sessie

1. **Maak een holder-snapshot.** Klik op **Load holders**, of plak zelf een
   lijst: één regel per holder, wallet dan saldo, gescheiden door komma, tab of
   spatie. De parser negeert headers en rommel, en telt dubbele regels voor
   dezelfde wallet bij elkaar op. Bewaar de snapshot met **Save snapshot**. Dit
   doe je één keer aan het begin.
2. **Kies een masterseed.** Dit is het belangrijkste onderdeel. Gebruik iets dat
   je vooraf niet kunt voorspellen én dat publiek verifieerbaar is: de blockhash
   van een recent Solana-blok werkt perfect. Noem het bloknummer hardop op
   stream vóórdat je draait. Ook dit doe je één keer per sessie.
3. **Vul de prijs in en spin.** De rol loopt ruim zeven seconden en stopt op de
   winnaar.
4. **Klik "Next prize"** en herhaal voor de volgende kaart. Holders en
   masterseed blijven staan, alleen het prijsveld wordt leeggemaakt.
5. **Kopieer aan het eind "Copy all as JSON"** en plak dat in `giveaways.json`.
   Vul de `txSignature` per regel aan zodra je de kaarten verstuurd hebt.

### Meerdere trekkingen achter elkaar

Elke trekking krijgt automatisch zijn eigen seed door het volgnummer eraan te
plakken: `BLOCKHASH#1`, `BLOCKHASH#2`, enzovoort. Dat staat op het scherm
vóórdat je draait, dus kijkers zien welke seed gebruikt wordt.

Zonder die nummering zou dezelfde masterseed elke keer dezelfde winnaar geven.
Dat is een makkelijke fout om live te maken en een pijnlijke om uit te leggen.

De schakelaar **One prize per wallet** staat standaard aan: wallets die deze
sessie al gewonnen hebben vallen uit de pool. Zet hem uit als je wilt dat
iedereen bij elke trekking mee blijft doen.

### Waarom dit eerlijk is

De winnaar wordt bepaald door `SHA-256(seed)`, omgezet naar een getal tussen 0
en het totale gewicht. Daarna loopt het script de holders langs tot dat lot
valt. Iemand met twee keer zoveel tokens beslaat twee keer zoveel lotnummers.

Het draaien van de rol is puur show: de winnaar staat al vast op het moment dat
je op Spin drukt. Dat betekent dat **dezelfde seed en dezelfde snapshot altijd
dezelfde winnaar geven**, op elke computer. Het resultaatscherm toont de seed,
de volledige SHA-256 en het winnende lot, zodat iedereen het kan overdoen.

Bewaar je snapshots. Zonder de originele holderlijst is de uitslag niet
narekenbaar, en dan is de hele verificatie waardeloos.

## Waar welke tekst hoort

De homepage is de pitch en moet **kort** blijven. De volledige uitleg staat op
**`/#/how`**. Groeit een sectie op de homepage weer naar een paar honderd
woorden, verhuis het dan daarheen en laat een link achter.

Schrijf een regel op één plek. Staat dezelfde uitleg op twee plaatsen, dan lopen
ze op een dag uit elkaar en staat er ergens iets dat niet meer klopt — en dat is
precies wat dit project zich niet kan permitteren.

## Structuur

```
src/
  data/                  alles wat jij bijwerkt
  data/checklist.json    gegenereerd, niet met de hand bewerken
  assets/vault/          jouw eigen kaartfoto's, op naam van de checklist-id
  lib/photos.ts          zoekt die foto's op naam op
  hooks/                 useTokenStats (DexScreener), useReveal, useCountUp
  lib/collection.ts      afgeleide getallen: totalen, actieve fase, percentages
  lib/furnace.ts         afgeleide toestand per aanbod: open, klok, verlopen
  lib/raffle.ts          parsen, wegen en deterministisch trekken
  lib/format.ts          getal- en datumformattering
  components/            één bestand per sectie
  components/Mosaic.tsx  de 200 vakjes, gedeeld door #wall en #/checklist
  components/Mascot.tsx  de mascotte in drie gedaantes
  components/draw/       de trekkingstool op #/draw
  components/checklist/  de publieke checklist op #/checklist
  components/how/        alle regels uitgeschreven, op #/how
scripts/
  verify-totals.mjs      telt de noemers opnieuw uit Bulbapedia
functions/
  api/                   de vier endpoints, als Cloudflare Pages Functions
  _lib/                  handtekeningcontrole en de holder-telling
schema.sql               de twee tabellen in D1
```

## Let op

- **Geen Nintendo-assets.** Geen officiële artwork, logo's of setsymbolen. Eigen
  mascotte. Foto's van kaarten die je zelf bezit zijn prima. De disclaimer in de
  footer moet blijven staan.
- **De fee-wallet is publiek.** Nooit mengen met privé — de hele geloofwaardigheid
  van het project hangt aan die ene wallet.
