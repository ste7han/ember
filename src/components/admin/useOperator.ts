import { useState } from 'react'

/**
 * Ondertekenen namens EMBER.
 *
 * Elke handeling vraagt zijn eigen handtekening met een eigen `purpose`. Dat is
 * bewust omslachtiger dan één keer inloggen: een handtekening om de
 * trekkingstool te openen kan zo niet hergebruikt worden om iets te
 * publiceren, en er staat nergens een sessietoken dat gestolen kan worden.
 */
export function useOperator() {
  const [wallet, setWallet] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const getProvider = () => {
    const w = window as unknown as Record<string, any>
    const provider = w.phantom?.solana ?? w.solflare ?? w.solana
    if (!provider) throw new Error('No browser wallet found.')
    return provider
  }

  /** Vraagt een handtekening en geeft de velden terug die de server verwacht. */
  const sign = async (purpose: string) => {
    setBusy(true)
    try {
      const provider = getProvider()
      const { publicKey } = await provider.connect()
      const address = publicKey.toString()
      setWallet(address)

      const issuedAt = new Date().toISOString()
      const message = [
        `EMBER: ${purpose}`,
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

      return {
        wallet: address,
        issuedAt,
        signature: btoa(String.fromCharCode(...signature)),
      }
    } finally {
      setBusy(false)
    }
  }

  return { wallet, busy, sign }
}
