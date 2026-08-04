import { useState } from 'react'
import { site } from '../../data/site'
import { seal } from '../../lib/sealed'
import { Flame } from '../Flame'

type Phase = 'form' | 'signing' | 'saving' | 'done'

/** Wat we vragen. Niet meer dan nodig is om een kaart te versturen. */
const FIELDS = [
  { name: 'name', label: 'Full name', autoComplete: 'name' },
  { name: 'line1', label: 'Address', autoComplete: 'address-line1' },
  { name: 'line2', label: 'Address line 2 (optional)', autoComplete: 'address-line2' },
  { name: 'postcode', label: 'Postcode', autoComplete: 'postal-code' },
  { name: 'city', label: 'City', autoComplete: 'address-level2' },
  { name: 'country', label: 'Country', autoComplete: 'country-name' },
] as const

type Field = (typeof FIELDS)[number]['name']

/** Phantom en Solflare injecteren allebei een provider; pak de eerste die er is. */
function getProvider(): {
  publicKey?: { toString(): string }
  connect(): Promise<{ publicKey: { toString(): string } }>
  signMessage(m: Uint8Array, enc?: string): Promise<{ signature: Uint8Array }>
} | null {
  const w = window as unknown as Record<string, any>
  return w.phantom?.solana ?? w.solflare ?? w.solana ?? null
}

const toB64 = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))

export function ShippingPage() {
  const [values, setValues] = useState<Record<string, string>>({})
  const [phase, setPhase] = useState<Phase>('form')
  const [error, setError] = useState<string | null>(null)
  const [wallet, setWallet] = useState<string | null>(null)

  const set = (k: Field, v: string) => setValues((s) => ({ ...s, [k]: v }))

  const required: Field[] = ['name', 'line1', 'postcode', 'city', 'country']
  const complete = required.every((k) => (values[k] ?? '').trim().length > 0)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const provider = getProvider()
    if (!provider) {
      setError(
        'No browser wallet found. Install Phantom or Solflare, or send us a DM instead.',
      )
      return
    }

    try {
      setPhase('signing')
      const { publicKey } = await provider.connect()
      const address = publicKey.toString()
      setWallet(address)

      const issuedAt = new Date().toISOString()
      // Zelfde tekst als de server samenstelt; wijkt er iets af, dan faalt de controle.
      const message = [
        'EMBER: save shipping address',
        '',
        `Wallet: ${address}`,
        `Time: ${issuedAt}`,
        '',
        'Signing this proves you control this wallet.',
        'It is not a transaction and costs nothing.',
      ].join('\n')

      const { signature } = await provider.signMessage(
        new TextEncoder().encode(message),
        'utf8',
      )

      setPhase('saving')
      const plaintext = FIELDS.map(({ name, label }) => {
        const v = (values[name] ?? '').trim()
        return v ? `${label.replace(' (optional)', '')}: ${v}` : null
      })
        .filter(Boolean)
        .join('\n')

      const envelope = await seal(plaintext, site.shipping.publicKey)

      const res = await fetch('/api/address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: address,
          issuedAt,
          signature: toB64(signature),
          envelope,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Could not save that.')

      setPhase('done')
    } catch (err) {
      setPhase('form')
      setError((err as Error).message ?? 'Something went wrong.')
    }
  }

  const inputCls =
    'mt-1.5 w-full rounded-lg border border-ash-700 bg-ash-900 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-ember-600'

  return (
    <div className="min-h-screen">
      <header className="border-b border-ash-800 px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
          <a href="#" className="flex items-center gap-2">
            <Flame className="h-6 w-6" />
            <span className="font-display text-lg font-extrabold tracking-tight">
              {site.name}
            </span>
          </a>
          <span className="font-mono text-xs tracking-[0.18em] text-ember-500 uppercase">
            Shipping
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-10 sm:px-8">
        {!site.shipping.publicKey ? (
          /*
            Zonder sleutel zou het adres onversleuteld verstuurd worden. Dan is
            het formulier erger dan geen formulier, dus dan staat het uit.
          */
          <>
            <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              Not open yet.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-bone-300">
              This form goes live once ${site.ticker} has launched and there's
              something to win. Follow along on X and we'll say when.
            </p>
          </>
        ) : phase === 'done' ? (
          <>
            <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              Saved. Thanks.
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-bone-300">
              Your address is stored against{' '}
              <span className="font-mono text-xs text-bone-100">{wallet}</span>.
              If that wallet wins something, it goes out without us having to ask
              you first.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-bone-300">
              Come back here any time to update it. Signing again overwrites what's
              stored. Want it deleted? Send us a DM and it's gone.
            </p>
          </>
        ) : (
          <>
            <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              Where do we send it?
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-bone-300">
              Leave a shipping address now and anything your wallet wins goes out
              straight away, instead of us chasing you for details afterwards.
              Entirely optional.
            </p>

            <div className="mt-6 rounded-2xl border border-ash-800 bg-ash-900/50 p-5">
              <h2 className="font-display text-base font-bold">
                Nobody but us can read this
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-bone-300">
                Your address is encrypted in your own browser before it's sent.
                What gets stored is unreadable without a key that never leaves a
                laptop, not on the server and not with our hosting provider. Even if
                that database leaked tomorrow, there'd be nothing in it.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-bone-300">
                You'll be asked to sign a message with your wallet. That's not a
                transaction, it costs nothing, and it's what stops someone else
                putting their address against your wallet.
              </p>
            </div>

            <form onSubmit={submit} className="mt-8 space-y-4">
              {FIELDS.map((f) => (
                <label key={f.name} className="block">
                  <span className="font-mono text-[0.65rem] tracking-[0.18em] text-bone-500 uppercase">
                    {f.label}
                  </span>
                  <input
                    value={values[f.name] ?? ''}
                    onChange={(e) => set(f.name, e.target.value)}
                    autoComplete={f.autoComplete}
                    className={inputCls}
                  />
                </label>
              ))}

              {error && <p className="text-sm text-ember-400">{error}</p>}

              <button
                type="submit"
                disabled={!complete || phase !== 'form'}
                className="w-full rounded-full bg-ember-600 px-7 py-3.5 font-display text-base font-bold text-ash-950 transition-colors hover:bg-ember-500 disabled:cursor-not-allowed disabled:opacity-30"
              >
                {phase === 'signing'
                  ? 'Waiting for your wallet…'
                  : phase === 'saving'
                    ? 'Saving…'
                    : 'Sign and save'}
              </button>

              <p className="text-xs leading-relaxed text-bone-500">
                No browser wallet? Send us a DM instead and we'll sort it out by
                hand. We only keep what's on this form, only to post cards, and
                we delete it whenever you ask.
              </p>
            </form>
          </>
        )}
      </main>
    </div>
  )
}
