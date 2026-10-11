import './Illustrations.css'

// All artwork is inline SVG coloured with the theme tokens from index.css, so
// it follows light and dark mode and needs no image files. Each one is
// decorative and hidden from screen readers.

// Landing hero: a dashboard card with a growing bar chart, a spending line
// being drawn, a savings goal filling up and coins floating around it.
export function HeroIllustration() {
  const bars = [
    { x: 56, height: 46 },
    { x: 96, height: 74 },
    { x: 136, height: 58 },
    { x: 176, height: 96 },
    { x: 216, height: 82 },
    { x: 256, height: 118 },
  ];

  return (
    <svg className="illustration illustration-hero" viewBox="0 0 420 320" role="presentation" aria-hidden="true">
      <ellipse cx="210" cy="296" rx="150" ry="12" className="ill-shadow" />

      <g className="ill-float-slow">
        <rect x="30" y="34" width="290" height="230" rx="14" className="ill-card" />
        <circle cx="52" cy="56" r="5" className="ill-fill-danger" />
        <circle cx="68" cy="56" r="5" className="ill-fill-warning" />
        <circle cx="84" cy="56" r="5" className="ill-fill-success" />
        <rect x="50" y="78" width="96" height="10" rx="5" className="ill-fill-muted" />
        <rect x="50" y="96" width="150" height="18" rx="6" className="ill-fill-heading" />

        <line x1="46" y1="246" x2="304" y2="246" className="ill-axis" />
        {bars.map((bar, index) => (
          <rect
            key={bar.x}
            x={bar.x}
            y={246 - bar.height}
            width="24"
            height={bar.height}
            rx="5"
            className={`ill-bar ${index === bars.length - 1 ? 'ill-fill-success' : 'ill-fill-info'}`}
            style={{ animationDelay: `${0.2 + index * 0.1}s` }}
          />
        ))}
        <path
          d="M68 196 L108 166 L148 180 L188 140 L228 152 L268 112"
          className="ill-line"
          pathLength="1"
        />
        <circle cx="268" cy="112" r="6" className="ill-dot" />
      </g>

      <g className="ill-float-fast">
        <rect x="246" y="150" width="150" height="92" rx="12" className="ill-card" />
        <circle cx="270" cy="176" r="12" className="ill-fill-success-bg" />
        <path d="M264 176 l4 5 l8 -9" className="ill-check" />
        <rect x="290" y="168" width="84" height="8" rx="4" className="ill-fill-heading" />
        <rect x="290" y="182" width="52" height="6" rx="3" className="ill-fill-muted" />
        <rect x="262" y="210" width="118" height="10" rx="5" className="ill-fill-track" />
        <rect x="262" y="210" width="118" height="10" rx="5" className="ill-fill-success ill-progress" />
      </g>

      <g className="ill-coin ill-coin-a">
        <circle cx="352" cy="74" r="24" className="ill-coin-face" />
        <circle cx="352" cy="74" r="17" className="ill-coin-ring" />
        <text x="352" y="82" textAnchor="middle" className="ill-coin-text">$</text>
      </g>
      <g className="ill-coin ill-coin-b">
        <circle cx="44" cy="282" r="16" className="ill-coin-face" />
        <circle cx="44" cy="282" r="11" className="ill-coin-ring" />
      </g>
      <g className="ill-coin ill-coin-c">
        <circle cx="386" cy="282" r="11" className="ill-coin-face" />
      </g>
    </svg>
  );
}

const FEATURE_ICONS = {
  wallet: (
    <>
      <rect x="9" y="14" width="30" height="22" rx="5" />
      <path d="M9 20h30" />
      <circle cx="32" cy="28" r="2.5" />
    </>
  ),
  bell: (
    <>
      <path d="M15 31V22a9 9 0 0 1 18 0v9l3 3H12z" />
      <path d="M21 37a3 3 0 0 0 6 0" />
    </>
  ),
  target: (
    <>
      <circle cx="24" cy="24" r="14" />
      <circle cx="24" cy="24" r="8" />
      <circle cx="24" cy="24" r="2" />
    </>
  ),
  repeat: (
    <>
      <path d="M14 22a10 10 0 0 1 17-6l3 3" />
      <path d="M34 12v7h-7" />
      <path d="M34 26a10 10 0 0 1-17 6l-3-3" />
      <path d="M14 36v-7h7" />
    </>
  ),
  sparkles: (
    <>
      <path d="M22 11l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" />
      <path d="M35 28l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z" />
    </>
  ),
  chart: (
    <>
      <path d="M11 37h26" />
      <rect x="14" y="24" width="5" height="10" rx="1.5" />
      <rect x="22" y="17" width="5" height="17" rx="1.5" />
      <rect x="30" y="11" width="5" height="23" rx="1.5" />
    </>
  ),
};

// A line icon on a tinted rounded tile, used on the landing feature cards.
export function FeatureIcon({ name, tone = 'info' }) {
  return (
    <svg className={`feature-icon feature-icon-${tone}`} viewBox="0 0 48 48" role="presentation" aria-hidden="true">
      <rect width="48" height="48" rx="12" className="feature-icon-tile" />
      <g className="feature-icon-glyph">{FEATURE_ICONS[name]}</g>
    </svg>
  );
}

// Coins stacking up beside a rising arrow: shown above the sign-in forms.
export function SavingsIllustration() {
  return (
    <svg className="illustration illustration-savings" viewBox="0 0 160 110" role="presentation" aria-hidden="true">
      <ellipse cx="80" cy="100" rx="60" ry="6" className="ill-shadow" />
      {[0, 1, 2, 3].map((index) => (
        <g key={index} className="ill-stack-coin" style={{ animationDelay: `${index * 0.12}s` }}>
          <ellipse cx="52" cy={90 - index * 13} rx="26" ry="8" className="ill-coin-face" />
          <ellipse cx="52" cy={87 - index * 13} rx="26" ry="8" className="ill-coin-ring" />
        </g>
      ))}
      <path d="M92 86 L108 66 L120 76 L140 44" className="ill-line" pathLength="1" />
      <path d="M128 44 h12 v12" className="ill-arrow" />
    </svg>
  );
}

// A padlock with a sparkle: shown where a feature needs the Pro plan.
export function LockIllustration() {
  return (
    <svg className="illustration illustration-lock" viewBox="0 0 120 110" role="presentation" aria-hidden="true">
      <ellipse cx="60" cy="100" rx="40" ry="5" className="ill-shadow" />
      <g className="ill-float-fast">
        <path d="M42 50V38a18 18 0 0 1 36 0v12" className="ill-shackle" />
        <rect x="30" y="48" width="60" height="44" rx="10" className="ill-fill-info" />
        <circle cx="60" cy="67" r="6" className="ill-fill-surface" />
        <rect x="57" y="68" width="6" height="12" rx="3" className="ill-fill-surface" />
      </g>
      <path d="M98 20l2.5 7 7 2.5-7 2.5-2.5 7-2.5-7-7-2.5 7-2.5z" className="ill-fill-warning ill-twinkle" />
      <path d="M20 34l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z" className="ill-fill-warning ill-twinkle ill-twinkle-late" />
    </svg>
  );
}
