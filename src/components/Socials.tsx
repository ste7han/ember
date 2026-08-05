import { site } from '../data/site'

/**
 * Kleine iconen naar X, Telegram en TikTok.
 *
 * Eigen paden, geen externe icon-library: twee glyphs zijn geen dependency
 * waard die je daarna moet bijhouden.
 */
function XIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M18.9 2.5h3.4l-7.4 8.5 8.7 11.5h-6.8l-5.3-7-6.1 7H2l7.9-9.1L1.6 2.5h7l4.8 6.4zm-1.2 18h1.9L7.4 4.4H5.4z" />
    </svg>
  )
}

function TelegramIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M21.9 4.3 18.9 19c-.2 1-.8 1.3-1.7.8l-4.6-3.4-2.2 2.1c-.2.3-.5.5-1 .5l.3-4.7 8.5-7.7c.4-.3-.1-.5-.6-.2L6.9 13l-4.5-1.4c-1-.3-1-1 .2-1.4l17.6-6.8c.8-.3 1.5.2 1.2 1z" />
    </svg>
  )
}

function TikTokIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M16.6 5.8a5 5 0 0 1-1.2-3.3h-3.3v13.2a2.9 2.9 0 1 1-2-2.8V9.5a6.2 6.2 0 1 0 5.3 6.2V9.1a8.2 8.2 0 0 0 4.8 1.5V7.3a4.9 4.9 0 0 1-3.6-1.5z" />
    </svg>
  )
}

export function Socials({ className = '' }: { className?: string }) {
  const items = [
    { href: site.links.x, label: 'X', Icon: XIcon },
    { href: site.links.telegram, label: 'Telegram', Icon: TelegramIcon },
    { href: site.links.tiktok, label: 'TikTok', Icon: TikTokIcon },
  ].filter((i) => i.href)

  if (items.length === 0) return null

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {items.map(({ href, label, Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noreferrer"
          aria-label={label}
          title={label}
          className="rounded-full p-2 text-bone-300 transition-colors hover:bg-ash-800 hover:text-ember-400"
        >
          <Icon />
        </a>
      ))}
    </div>
  )
}
