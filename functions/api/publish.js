import { json } from '../_lib/solana.js'
import { checkOperator } from '../_lib/operators.js'

/**
 * POST /api/publish — een databestand bijwerken via een commit in de repository.
 *
 * Waarom niet gewoon naar de database schrijven? Omdat de geschiedenis het
 * bewijs is. Een uitslag die in git staat heeft een datum en een auteur, en
 * niemand kan hem achteraf stilletjes veranderen. Zou dit in een tabel staan,
 * dan was "wij hebben niets aangepast" weer een bewering.
 *
 * De site rolt na de commit vanzelf opnieuw uit, dus een wijziging staat er
 * binnen ongeveer een minuut op.
 *
 * Nodig als Pages-secret:
 *   GITHUB_TOKEN   fine-grained token met alleen Contents: read and write
 *   GITHUB_REPO    bv. ste7han/ember
 */

/** Alleen deze bestanden. Voorkomt dat een fout in de UI ergens anders schrijft. */
const ALLOWED = new Set(['src/data/furnace.json', 'src/data/giveaways.json'])

const API = 'https://api.github.com'

async function gh(env, path, init = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'ember-admin',
      ...(init.headers ?? {}),
    },
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(body.message ?? `GitHub ${res.status} ${res.statusText}`)
  }
  return body
}

/** Base64 van UTF-8, zodat accenten en emoji niet stukgaan. */
const toBase64 = (text) => {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary)
}

export async function onRequestPost({ request, env }) {
  if (!env.GITHUB_TOKEN || !env.GITHUB_REPO) {
    return json(
      {
        error:
          'Publishing is not configured yet. Set GITHUB_TOKEN and GITHUB_REPO as Pages secrets.',
      },
      503,
    )
  }

  let body
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Malformed request.' }, 400)
  }

  const { file, content, summary, wallet, issuedAt, signature } = body ?? {}

  const bad = await checkOperator({
    purpose: 'publish a change',
    wallet,
    issuedAt,
    signature,
  })
  if (bad) return json({ error: bad.error }, bad.status)

  if (!ALLOWED.has(file)) return json({ error: 'That file is not editable.' }, 400)
  if (typeof content !== 'string' || content.length > 400_000)
    return json({ error: 'Malformed request.' }, 400)

  // Moet geldige JSON zijn, anders breekt de volgende build en ligt de site eruit.
  try {
    JSON.parse(content)
  } catch {
    return json({ error: 'That is not valid JSON.' }, 400)
  }

  try {
    // De huidige sha ophalen; GitHub eist die bij een wijziging zodat je niet
    // per ongeluk iemand anders zijn werk overschrijft.
    let sha
    try {
      const current = await gh(env, `/repos/${env.GITHUB_REPO}/contents/${file}`)
      sha = current.sha
    } catch {
      sha = undefined // bestand bestaat nog niet
    }

    const result = await gh(env, `/repos/${env.GITHUB_REPO}/contents/${file}`, {
      method: 'PUT',
      body: JSON.stringify({
        message: summary || `Update ${file}`,
        content: toBase64(content),
        sha,
        committer: {
          name: 'EMBER admin',
          email: 'admin@users.noreply.github.com',
        },
      }),
    })

    return json({
      ok: true,
      commit: result.commit?.sha,
      url: result.commit?.html_url,
    })
  } catch (err) {
    return json({ error: err.message }, 502)
  }
}
