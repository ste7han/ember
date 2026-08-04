/** Het merkteken. Eigen vorm — bewust geen Nintendo-artwork. */
export function Flame({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      role="img"
      aria-label="Ember flame"
    >
      <path
        d="M12 1.4c3.6 4.3 6.6 7.6 6.6 11.9a6.6 6.6 0 0 1-13.2 0c0-2.5 1.1-4.5 2.7-6.4.5 1 1.1 1.9 2 2.5.4-3.2 1-5.6 1.9-8z"
        fill="url(#emberOuter)"
      />
      <path
        d="M12 12.6c1.5 1.8 2.5 3 2.5 4.6a2.5 2.5 0 0 1-5 0c0-1.6 1-2.8 2.5-4.6z"
        fill="url(#emberInner)"
      />
      <defs>
        <linearGradient id="emberOuter" x1="12" y1="1.4" x2="12" y2="20">
          <stop stopColor="#ffb347" />
          <stop offset="0.55" stopColor="#ff6b1a" />
          <stop offset="1" stopColor="#e0530a" />
        </linearGradient>
        <linearGradient id="emberInner" x1="12" y1="12.6" x2="12" y2="20">
          <stop stopColor="#fff6e0" />
          <stop offset="1" stopColor="#ffb347" />
        </linearGradient>
      </defs>
    </svg>
  )
}
