/**
 * Kleine Redis-client over de REST-API van Upstash.
 *
 * Bewust geen SDK: dit zijn drie commando's en een fetch, en elke dependency
 * die je hier toevoegt moet je ook onderhouden.
 *
 * Vercel KV zet zelf `KV_REST_API_URL` en `KV_REST_API_TOKEN`; een losse
 * Upstash-database gebruikt `UPSTASH_REDIS_REST_*`. We accepteren beide, zodat
 * het werkt ongeacht hoe je hem aangemaakt hebt.
 */

const url = () =>
  process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL
const token = () =>
  process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN

export const kvConfigured = () => Boolean(url() && token())

/** Eén commando, bv. ['SET', 'key', 'value', 'NX', 'EX', '900']. */
export async function kv(command) {
  const res = await fetch(url(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  })
  if (!res.ok) throw new Error(`KV ${command[0]}: ${res.status} ${res.statusText}`)
  const json = await res.json()
  if (json.error) throw new Error(`KV ${command[0]}: ${json.error}`)
  return json.result
}

/** Meerdere commando's in één ronde. */
export async function kvPipeline(commands) {
  if (commands.length === 0) return []
  const res = await fetch(`${url()}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commands),
  })
  if (!res.ok) throw new Error(`KV pipeline: ${res.status} ${res.statusText}`)
  const json = await res.json()
  return json.map((r) => r.result)
}

export const RESERVE_PREFIX = 'ember:reserve:'
export const RESERVE_TTL_SECONDS = 900 // 15 minuten

/**
 * Alleen tekens die in onze eigen id's en in Solana-adressen voorkomen. Houdt
 * rare sleutels uit de database en voorkomt dat iemand via de id een ander
 * commando probeert te smokkelen.
 */
export const isSafeId = (s) =>
  typeof s === 'string' && s.length > 0 && s.length <= 64 && /^[\w-]+$/.test(s)

export const isSafeWallet = (s) =>
  typeof s === 'string' && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s)
