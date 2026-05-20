/**
 * LetLoyal Logo — exact Brand Kit v3 geometry
 *
 * Variants:
 *   light   — teal L + teal arrow + dark wordmark  (for white/light bg)
 *   dark    — white L + mint arrow + white wordmark (for dark/teal bg)
 *   icon    — app-icon square (teal bg, white L, mint-light arrow)
 *   mark    — icon only, no text, no bg           (for "Powered by" etc.)
 */

interface LogoProps {
  /** Visual variant */
  variant?: 'light' | 'dark' | 'icon' | 'mark';
  /** Height of the rendered element (width scales proportionally) */
  size?: number;
  className?: string;
}

// ── Shared icon geometry (56 × 56 viewBox) ─────────────────────────────────
// L-shape and arrow stroke coords match the brand-kit SVG exactly.

function IconDark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* L — white */}
      <line x1="13" y1="9"  x2="13" y2="44" stroke="white"   strokeWidth="7"   strokeLinecap="round"/>
      <line x1="13" y1="44" x2="34" y2="44" stroke="white"   strokeWidth="7"   strokeLinecap="round"/>
      {/* Arrow — mint */}
      <line     x1="22" y1="35" x2="46" y2="10" stroke="#5EEAD4" strokeWidth="5.5" strokeLinecap="round"/>
      <polyline points="35,10 46,10 46,22"     stroke="#5EEAD4" strokeWidth="5.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconLight({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* L — teal */}
      <line x1="10" y1="6"  x2="10" y2="46" stroke="#0D9488" strokeWidth="8"   strokeLinecap="round"/>
      <line x1="10" y1="46" x2="34" y2="46" stroke="#0D9488" strokeWidth="8"   strokeLinecap="round"/>
      {/* Arrow — teal (same hue, thinner) */}
      <line     x1="21" y1="36" x2="48" y2="8" stroke="#0D9488" strokeWidth="6.5" strokeLinecap="round"/>
      <polyline points="37,8 48,8 48,20"      stroke="#0D9488" strokeWidth="6.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function AppIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="56" height="56" rx="13" fill="#0D9488"/>
      {/* L — white */}
      <line x1="13" y1="9"  x2="13" y2="44" stroke="white"    strokeWidth="7"   strokeLinecap="round"/>
      <line x1="13" y1="44" x2="34" y2="44" stroke="white"    strokeWidth="7"   strokeLinecap="round"/>
      {/* Arrow — mint-light */}
      <line     x1="22" y1="35" x2="46" y2="10" stroke="#CCFBF1" strokeWidth="5.5" strokeLinecap="round"/>
      <polyline points="35,10 46,10 46,22"     stroke="#CCFBF1" strokeWidth="5.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ── Public exports ──────────────────────────────────────────────────────────

/** Full wordmark: icon + "LetLoyal" text */
export default function Logo({ variant = 'light', size = 28, className = '' }: LogoProps) {
  const textSize  = Math.round(size * 0.64);   // ~18px at size=28
  const gap       = Math.round(size * 0.29);   // ~8px gap

  if (variant === 'icon') {
    return <AppIcon size={size} />;
  }

  if (variant === 'mark') {
    return variant === 'mark'
      ? <IconLight size={size} />
      : <IconLight size={size} />;
  }

  const isDark = variant === 'dark';

  return (
    <span
      className={`inline-flex items-center ${className}`}
      style={{ gap }}
    >
      {isDark ? <IconDark size={size} /> : <IconLight size={size} />}
      <span
        style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: 700,
          fontSize: textSize,
          letterSpacing: '-0.02em',
          lineHeight: 1,
          color: isDark ? '#ffffff' : '#134E4A',
        }}
      >
        <span style={{ fontWeight: 500, color: isDark ? '#5EEAD4' : '#0D9488' }}>Let</span>
        Loyal
      </span>
    </span>
  );
}

/** Icon-only mark (no text, no bg square) */
export function LogoMark({ variant = 'light', size = 28, className = '' }: Omit<LogoProps, 'variant'> & { variant?: 'light' | 'dark' }) {
  return variant === 'dark'
    ? <IconDark size={size} />
    : <IconLight size={size} />;
}

/** App icon square (teal bg) */
export function LogoIcon({ size = 32, className = '' }: { size?: number; className?: string }) {
  return <AppIcon size={size} />;
}
