# Brand assets

Losse afbeeldingen voor buiten de site: X-banner, achtergronden. **Deze map wordt
niet meegedeployed** — hij staat naast `public/`, niet erin. Wil je een bestand
wél op de site gebruiken, kopieer het dan naar `public/`.

| Bestand | Formaat | Waarvoor |
| --- | --- | --- |
| `ember-banner.png` | 1500×500 | De X-header. Dit is de versie die je uploadt. |
| `ember-bg-clean.png` | 1500×500 | Alleen vonken en gloed van onderaf. Voor als je er zelf iets op zet. |
| `ember-bg.png` | 1500×500 | Idem, met een zachte gloed in het midden. |
| `*@2x.png` | 3000×1000 | Masters. Bewaren, niet uploaden. |
| `og@2x.png` | 2400×1260 | Master van de link-preview. Het eindresultaat staat als `public/og.png`. |

Alle drie de varianten gebruiken dezelfde seed, dus de vonken staan op exact
dezelfde posities. Je kunt ze dus over elkaar leggen zonder dat er iets
verspringt.

## Opnieuw renderen

De `.html`-bestanden zijn de bron. Aanpassen en opnieuw uitdraaien met de Chrome
die je al hebt:

```bash
cd brand
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --hide-scrollbars \
  --force-device-scale-factor=2 --window-size=1500,500 \
  --virtual-time-budget=6000 \
  --screenshot=ember-banner@2x.png banner-with-text.html

sips -Z 1500 ember-banner@2x.png --out ember-banner.png
```

`--virtual-time-budget` moet erin blijven staan: zonder dat maakt Chrome de
screenshot voordat Bricolage Grotesque van Google Fonts geladen is, en dan
staat er een systeemfont in je banner.

Voor de link-preview is het `og.html`, op 1200×630:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --hide-scrollbars \
  --force-device-scale-factor=2 --window-size=1200,630 \
  --virtual-time-budget=6000 --screenshot=og@2x.png og.html

sips -Z 1200 og@2x.png --out ../public/og.png
```

Die gaat wél naar `public/`, want die moet mee de deploy in.

**Bij launch:** zet in `index.html` het volledige adres bij `og:image`
(`https://jouwdomein.nl/og.png`) en haal het commentaar bij `og:url` weg. X en
Facebook halen een relatief pad lang niet altijd op.

De vonkposities komen uit een vaste seed in het HTML-bestand. Wil je een andere
verdeling, verander dan de getallen in de inline `style`-attributen, of laat het
script opnieuw genereren met een andere seed.
