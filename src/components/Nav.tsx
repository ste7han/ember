import { ContractBar } from './ContractBar'
import { Flame } from './Flame'
import { Socials } from './Socials'
import { site } from '../data/site'

const links = [
  { href: '#wall', label: 'The wall' },
  { href: '#mission', label: 'Mission' },
  { href: '#vault', label: 'Vault' },
  { href: '#story', label: 'Story' },
  { href: '#evolution', label: 'Evolution' },
  { href: '#rips', label: 'Rips' },
  { href: '#furnace', label: 'Furnace' },
  { href: '#giveaways', label: 'Giveaways' },
]

export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-ash-800/80 bg-ash-950/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
        <a href="#top" className="flex items-center gap-2">
          <Flame className="h-6 w-6" />
          <span className="font-display text-lg font-extrabold tracking-tight">
            {site.name}
          </span>
        </a>

        <ul className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="text-sm text-bone-300 transition-colors hover:text-ember-400"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <Socials />
          <a
            href="#buy"
            className="rounded-full bg-ember-600 px-4 py-2 text-sm font-semibold text-ash-950 transition-colors hover:bg-ember-500"
          >
            Buy ${site.ticker}
          </a>
        </div>
      </nav>

      <ContractBar />
    </header>
  )
}
