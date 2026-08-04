import { creatorWalletUrl, site } from '../data/site'
import { Flame } from './Flame'

export function Footer() {
  const walletUrl = creatorWalletUrl()

  return (
    <footer className="border-t border-ash-800 px-5 py-14 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5" />
            <span className="font-display text-base font-extrabold tracking-tight">
              {site.name}
            </span>
            <span className="text-sm text-bone-500">{site.tagline}</span>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-bone-500">
            <a href="#/how" className="transition-colors hover:text-ember-400">
              How it works
            </a>
            <a
              href={site.scope.checklistUrl}
              className="transition-colors hover:text-ember-400"
            >
              Checklist
            </a>
            <a href="#/draw" className="transition-colors hover:text-ember-400">
              Draw tool
            </a>
            <a href="#/wallet" className="transition-colors hover:text-ember-400">
              Wallet lookup
            </a>
            <a
              href="#/shipping"
              className="transition-colors hover:text-ember-400"
            >
              Shipping address
            </a>
            {site.links.x && (
              <a
                href={site.links.x}
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-ember-400"
              >
                X
              </a>
            )}
            {site.links.telegram && (
              <a
                href={site.links.telegram}
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-ember-400"
              >
                Telegram
              </a>
            )}
            {site.links.pumpfun && (
              <a
                href={site.links.pumpfun}
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-ember-400"
              >
                pump.fun
              </a>
            )}
            {walletUrl && (
              <a
                href={walletUrl}
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-ember-400"
              >
                Fee wallet
              </a>
            )}
          </div>
        </div>

        <div className="mt-10 space-y-3 border-t border-ash-800 pt-8 text-xs leading-relaxed text-bone-500">
          <p>
            {site.name} is an independent community project. It is not
            affiliated with, endorsed by, sponsored by, or connected to Nintendo,
            Creatures Inc., GAME FREAK inc., or The Pokémon Company. Pokémon and
            all related names are trademarks of their respective owners. Any card
            images on this site are photographs of cards we personally own.
          </p>
          <p>
            ${site.ticker} is a memecoin. The one thing it does is described on
            this page: tokens can be burned to claim a spare card while that card
            is listed and still available. Listings are limited, first come first
            served, and we may stop offering them at any time. That is not a
            return, an investment, or a promise of value. There is no roadmap
            obligation and no expectation of profit. Nothing here is financial
            advice. Digital assets are volatile and you may lose the entire value
            of your purchase. Do your own research.
          </p>
        </div>
      </div>
    </footer>
  )
}
