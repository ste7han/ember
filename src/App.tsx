import { useEffect, useState } from 'react'
import { Buy } from './components/Buy'
import { AdminPage } from './components/admin/AdminPage'
import { ChecklistPage } from './components/checklist/ChecklistPage'
import { DrawPage } from './components/draw/DrawPage'
import { Evolution } from './components/Evolution'
import { Footer } from './components/Footer'
import { Furnace } from './components/Furnace'
import { Giveaways } from './components/Giveaways'
import { Hero } from './components/Hero'
import { HowPage } from './components/how/HowPage'
import { ShippingPage } from './components/shipping/ShippingPage'
import { Mission } from './components/Mission'
import { Nav } from './components/Nav'
import { Rips } from './components/Rips'
import { Story } from './components/Story'
import { Vault } from './components/Vault'
import { Wall } from './components/Wall'
import { WalletPage } from './components/wallet/WalletPage'

/**
 * Twee losse pagina's naast de homepage. Allebei bewust niet in de nav, wel
 * publiek bereikbaar: kijkers moeten de trekking kunnen narekenen en de
 * checklist kunnen nalopen zonder dat wij ze de link hoeven te geven.
 */
const routeFromHash = () => {
  const hash = window.location.hash
  if (hash.startsWith('#/draw')) return 'draw'
  if (hash.startsWith('#/checklist')) return 'checklist'
  if (hash.startsWith('#/how')) return 'how'
  if (hash.startsWith('#/shipping')) return 'shipping'
  if (hash.startsWith('#/admin')) return 'admin'
  if (hash.startsWith('#/wallet')) return 'wallet'
  return 'home'
}

export default function App() {
  const [route, setRoute] = useState(routeFromHash)

  useEffect(() => {
    const onHashChange = () => setRoute(routeFromHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  if (route === 'draw') return <DrawPage />
  if (route === 'checklist') return <ChecklistPage />
  if (route === 'how') return <HowPage />
  if (route === 'shipping') return <ShippingPage />
  if (route === 'admin') return <AdminPage />
  if (route === 'wallet') return <WalletPage />

  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Wall />
        <Mission />
        <Vault />
        <Story />
        <Evolution />
        <Rips />
        <Furnace />
        <Giveaways />
        <Buy />
      </main>
      <Footer />
    </>
  )
}
