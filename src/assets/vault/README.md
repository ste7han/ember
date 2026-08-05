# Foto's van kaarten die we in handen hebben

Alle kaartfoto's staan hier, niet alleen die van de vault. De map heet zo omdat
de vault de eerste was die hem gebruikte.

**De bestandsnaam is de sleutel.** Noem het bestand naar de `id` die erbij hoort,
dan verschijnt de foto vanzelf op de goede plek. Je hoeft nergens een pad in te
vullen.

| Waar hij opduikt | Welke naam | Waar die id vandaan komt |
| --- | --- | --- |
| De vault en de checklist | `ember-base-set-46-102.jpg` | `src/data/checklist.json` |
| Een kaart in de furnace | `slowbro-090-084.jpg` | het veld **Id** op de adminpagina |
| Een aanwinst in de vault | `flame-phantasmal-flames-012-094.jpg` | dezelfde checklist-id |

Dus: verzin je op de adminpagina de id `slowbro-090-084`, dan heet de foto
`slowbro-090-084.jpg`. Meer is het niet.

## Eisen aan het bestand

- kleine letters, geen spaties, geen accenten
- `.jpg` is prima en een stuk kleiner dan `.png`
- schaal terug naar ongeveer 1200 px op de lange zijde; een foto rechtstreeks uit
  je telefoon is 4 MB en dat merk je op de site
- snij bij tot de kaartrand: geen tafel, geen hand, geen rommel eromheen

## Twee valkuilen die we al een keer tegenkwamen

**Een `.jpg` uit iPhone-foto's is soms een HEIC met een verkeerde extensie.**
Safari en de Finder tonen hem gewoon, Chrome en Firefox niet, dus je ziet het
zelf niet en je bezoekers wel. Exporteer als JPEG in plaats van het bestand te
hernoemen.

**Draai de foto echt, verlaat je niet op de EXIF-vlag.** Een telefoon slaat het
beeld liggend op met een notitie erbij dat hij rechtop moet. Niet elke omgeving
leest die notitie. En diezelfde EXIF bevat standaard de GPS-coördinaten van waar
je stond, dus die haal je er meteen af. Anders publiceer je per ongeluk je
huisadres bij elke kaart.

Alleen foto's van kaarten die je zelf in handen hebt. Geen scans van internet.
