import type { ReactNode } from 'react'

type Props = {
  href?: string
  children: ReactNode
  variant?: 'primary' | 'ghost'
  className?: string
  onClick?: () => void
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40'

const variants = {
  primary: 'bg-ember-600 text-ash-950 hover:bg-ember-500',
  ghost:
    'border border-ash-600 text-bone-100 hover:border-ember-600 hover:text-ember-400',
}

export function Button({
  href,
  children,
  variant = 'primary',
  className = '',
  onClick,
}: Props) {
  const cls = `${base} ${variants[variant]} ${className}`

  // Zonder href renderen we een <button> — zo blijft een niet-ingevulde
  // social link netjes disabled in plaats van een dode <a>.
  if (!href) {
    return (
      <button type="button" className={cls} onClick={onClick} disabled={!onClick}>
        {children}
      </button>
    )
  }

  return (
    <a
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel={href.startsWith('http') ? 'noreferrer' : undefined}
      className={cls}
    >
      {children}
    </a>
  )
}
