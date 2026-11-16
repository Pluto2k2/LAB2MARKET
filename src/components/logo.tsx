/**
 * Lab2Market molecular / research-network mark: three outer nodes joined to a central node.
 * Inline SVG so it stays crisp at any size and can be recoloured.
 */
export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true" focusable="false">
      <g stroke="#6cc4ae" strokeWidth="2.2" strokeLinecap="round" fill="none">
        <path d="M20 7 L8 31 L32 31 Z" />
        <path d="M20 7 L20 21 M8 31 L20 21 M32 31 L20 21" strokeWidth="1.6" opacity="0.85" />
      </g>
      <circle cx="20" cy="7" r="4.4" fill="#6cc4ae" />
      <circle cx="8" cy="31" r="4.4" fill="#2f9480" />
      <circle cx="32" cy="31" r="4.4" fill="#2f9480" />
      <circle cx="20" cy="21" r="3.2" fill="#0e2238" stroke="#6cc4ae" strokeWidth="2" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark className="h-9 w-9 shrink-0" />
      <span className="font-display text-[1.45rem] font-semibold leading-none tracking-tight text-[#fdfbf0]">Lab2Market STEM</span>
    </span>
  );
}
