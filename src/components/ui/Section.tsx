import type { ReactNode } from 'react'
import { useReveal } from '../../hooks/useReveal'

type Props = {
  id: string
  eyebrow?: string
  title: ReactNode
  lede?: ReactNode
  children: ReactNode
  /** Extra classes op de <section>, bv. voor een afwijkende achtergrond. */
  className?: string
}

export function Section({
  id,
  eyebrow,
  title,
  lede,
  children,
  className = '',
}: Props) {
  const reveal = useReveal<HTMLDivElement>()

  return (
    <section
      id={id}
      className={`scroll-mt-20 border-t border-ash-800 px-5 py-20 sm:px-8 sm:py-28 ${className}`}
    >
      <div ref={reveal.ref} className={`mx-auto max-w-5xl ${reveal.className}`}>
        <header className="max-w-2xl">
          {eyebrow && (
            <p className="mb-3 font-mono text-xs tracking-[0.2em] text-ember-500 uppercase">
              {eyebrow}
            </p>
          )}
          <h2 className="font-display text-3xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-5xl">
            {title}
          </h2>
          {lede && (
            <p className="mt-5 text-base leading-relaxed text-bone-300 text-pretty sm:text-lg">
              {lede}
            </p>
          )}
        </header>
        <div className="mt-12">{children}</div>
      </div>
    </section>
  )
}
