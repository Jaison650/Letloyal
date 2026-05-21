/**
 * LetLoyal Logo — exact coordinates from official SVG files
 *
 * Source files:
 *   letloyal-logo-primary-light.svg   → variant="light"
 *   letloyal-logo-primary-dark.svg    → variant="dark"
 *   letloyal-favicon.svg              → <LogoIcon> (square bg)
 *   letloyal-icon-standalone.svg      → <LogoMark> (no bg)
 */

// ── Icon-only mark (no background, 56×56 viewBox) ─────────────────────────
// Coordinates from letloyal-icon-standalone.svg
function StandaloneIcon({ lColor, arrowColor, size }: { lColor: string; arrowColor: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* L-shape */}
      <line x1="10" y1="6"  x2="10" y2="46" stroke={lColor}     strokeWidth="8"   strokeLinecap="round"/>
      <line x1="10" y1="46" x2="34" y2="46" stroke={lColor}     strokeWidth="8"   strokeLinecap="round"/>
      {/* Arrow */}
      <line x1="21" y1="36" x2="48" y2="8"  stroke={arrowColor} strokeWidth="6.5" strokeLinecap="round"/>
      <polyline points="37,8 48,8 48,20"      stroke={arrowColor} strokeWidth="6.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ── App-icon / favicon square (32×32 viewBox) ─────────────────────────────
// Coordinates from letloyal-favicon.svg
function FaviconIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="7" fill="#0D9488"/>
      {/* L-shape — white */}
      <line x1="8"  y1="6"  x2="8"  y2="25" stroke="white"    strokeWidth="4.5" strokeLinecap="round"/>
      <line x1="8"  y1="25" x2="20" y2="25" stroke="white"    strokeWidth="4.5" strokeLinecap="round"/>
      {/* Arrow — mint-light */}
      <line x1="14" y1="19" x2="27" y2="6"  stroke="#CCFBF1" strokeWidth="3.5" strokeLinecap="round"/>
      <polyline points="20,6 27,6 27,13"     stroke="#CCFBF1" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ── Wordmark (icon + HTML text) ────────────────────────────────────────────
interface LogoProps {
  variant?: 'light' | 'dark';
  size?: number;       // icon height in px; text scales proportionally
  className?: string;
}

export default function Logo({ variant = 'light', size = 26, className = '' }: LogoProps) {
  const isDark     = variant === 'dark';
  const lColor     = isDark ? 'white'    : '#0D9488';
  const arrowColor = isDark ? '#5EEAD4'  : '#0D9488';
  const letColor   = isDark ? '#5EEAD4'  : '#0D9488';
  const loyalColor = isDark ? 'white'    : '#134E4A';
  const fontSize   = Math.round(size * 0.65);

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <StandaloneIcon lColor={lColor} arrowColor={arrowColor} size={size} />
      <span
        style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          lineHeight: 1,
          color: loyalColor,
        }}
      >
        <span style={{ fontWeight: 500, color: letColor }}>Let</span>Loyal
      </span>
    </span>
  );
}

// ── Stand-alone icon (no background) ──────────────────────────────────────
export function LogoMark({ variant = 'light', size = 24 }: { variant?: 'light' | 'dark'; size?: number }) {
  return (
    <StandaloneIcon
      lColor={variant === 'dark' ? 'white' : '#0D9488'}
      arrowColor={variant === 'dark' ? '#5EEAD4' : '#0D9488'}
      size={size}
    />
  );
}

// ── Square app icon (teal bg, white L, mint arrow) ─────────────────────────
export function LogoIcon({ size = 32 }: { size?: number }) {
  return <FaviconIcon size={size} />;
}

// ── "Powered by LetLoyal" footer badge ────────────────────────────────────
export function PoweredBy({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs text-text-light opacity-60 hover:opacity-90 transition-opacity ${className}`}>
      <FaviconIcon size={14} />
      <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>
        Powered by <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, letterSpacing: '-0.01em' }}>LetLoyal</span>
      </span>
    </span>
  );
}
