import { useEffect, useRef, useState } from 'react'

/**
 * Zet een element op zichtbaar zodra het in beeld scrollt. Eenmalig — elementen
 * verdwijnen niet weer als je terugscrollt.
 *
 * Bewust géén IntersectionObserver. Die berekent niets in een achtergrondtab,
 * en omdat `.reveal` begint op `opacity: 0` betekende dat een lege pagina zodra
 * de waarnemer om wat voor reden dan ook niet vuurde. Een eigen meting op
 * scroll is voorspelbaar, heeft geen browserquirks, en de listener koppelt
 * zichzelf los zodra het element getoond is.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let done = false

    const check = () => {
      if (done || !ref.current) return
      const { top, bottom } = ref.current.getBoundingClientRect()
      // Iets binnen de onderrand, zodat hij begint als je hem écht ziet.
      const inView = top < window.innerHeight * 0.88 && bottom > 0
      if (!inView) return
      done = true
      setShown(true)
      window.removeEventListener('scroll', check)
      window.removeEventListener('resize', check)
      document.removeEventListener('visibilitychange', check)
    }

    // Meteen kijken: staat hij al in beeld, dan hoeft er niet gescrold te worden.
    check()

    window.addEventListener('scroll', check, { passive: true })
    window.addEventListener('resize', check)
    document.addEventListener('visibilitychange', check)

    return () => {
      window.removeEventListener('scroll', check)
      window.removeEventListener('resize', check)
      document.removeEventListener('visibilitychange', check)
    }
  }, [])

  return { ref, shown, className: shown ? 'reveal reveal-in' : 'reveal' }
}
