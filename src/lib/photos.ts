/**
 * Foto's op naam, in plaats van op een pad dat je met de hand moet bijhouden.
 *
 * Alles in `src/assets/vault/` wordt hier ingelezen en op bestandsnaam
 * gezet — zonder extensie. Noem je een foto `ember-base-set-46-102.jpg`, dan
 * vindt de site hem bij de checklistregel met díe id, zonder dat er ergens een
 * regel JSON bij hoeft.
 *
 * Waarom `src/assets/` en niet `public/`: Vite kan alleen dingen binnen `src`
 * inventariseren. Als bijkomend voordeel krijgen de bestanden een hash in hun
 * naam, zodat een vervangen foto niet uit de cache van bezoekers blijft komen.
 */
const files = import.meta.glob('../assets/vault/*.{jpg,jpeg,png,webp,avif}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const byName: Record<string, string> = {}
for (const [path, url] of Object.entries(files)) {
  const name = path.split('/').pop()?.replace(/\.[^.]+$/, '')
  if (name) byName[name] = url
}

/**
 * Zoekt een foto op.
 *
 * - begint de waarde met `/`, dan is het een letterlijk pad naar `public/` en
 *   laten we hem met rust — een ontsnappingsluik voor uitzonderingen
 * - anders is het een naam en zoeken we in `src/assets/vault/`
 *
 * Geeft `undefined` als er niets is, zodat de component zijn nette placeholder
 * kan tonen.
 */
export function photoUrl(nameOrPath?: string): string | undefined {
  if (!nameOrPath) return undefined
  if (nameOrPath.startsWith('/')) return nameOrPath
  return byName[nameOrPath]
}

/** Hoeveel foto's er klaarstaan. Handig om te zien of de map gevonden wordt. */
export const photoCount = Object.keys(byName).length
