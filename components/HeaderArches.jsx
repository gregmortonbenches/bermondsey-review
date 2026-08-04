// A decorative strip along the very top of every page — a repeating line
// of brick arches, echoing the Victorian railway viaduct that actually
// carries the line out of London Bridge through Bermondsey, with a train
// that crosses it every so often. Purely presentational: the arches tile
// via a single SVG <pattern> (no viewBox on the outer <svg>, so pattern
// units are real pixels — it repeats by count as the strip gets wider,
// rather than stretching), and the train's crossing is one long
// @keyframes loop (`.header-train`, app/globals.css) — no client JS, no
// setInterval. `prefers-reduced-motion` is handled globally there too.
//
// Styled to match the site's existing illustration language (the
// crossword grid / Tower Bridge line art in PuzzlesSection.jsx) rather
// than inventing a new one: fine ink-coloured stroke lines for
// definition and brick "voussoir" coursing, on a soft brick tint, not
// flat saturated cutout shapes — the first pass used solid fills with no
// linework and read as a row of scalloped bunting rather than
// architecture.
//
// This walks back part of an earlier call (see Masthead.jsx's own
// comment) to drop the masthead's old hand-drawn illustration for a
// fully plain header — brought back as a thin band *above* the wordmark
// rather than inside it, so the restrained, illustration-free wordmark
// itself is untouched.
const TILE_W = 110;
const TILE_H = 80;
const PIER_W = 20;
const DECK_H = 10;
// Ellipse, not a circle: taller than it is wide, closer to a real
// viaduct arch's proportions than the shallow, wide scallop the first
// version drew.
const ARCH_RX = 45;
const ARCH_RY = 50;
const ARCH_CX = PIER_W + ARCH_RX; // 65 — springs from the pier's right edge
const ARCH_CY = DECK_H; // ellipse centred on the springline itself

// Voussoir lines: a fan of thin strokes from the arch's centre out to its
// own curve, standing in for the radiating brick coursing a real arch is
// built from — the one detail that reads as "brick architecture" instead
// of "a hole punched in a rectangle." Points are the ellipse's own
// parametric form (cx + rx·cosθ, cy + ry·sinθ) for five angles across the
// visible lower half.
const VOUSSOIR_ANGLES_DEG = [20, 55, 90, 125, 160];
function voussoirPoint(deg) {
  const rad = (deg * Math.PI) / 180;
  const x = ARCH_CX + ARCH_RX * Math.cos(rad);
  const y = ARCH_CY + ARCH_RY * Math.sin(rad);
  return `${x.toFixed(1)},${y.toFixed(1)}`;
}

export default function HeaderArches() {
  return (
    <div className="relative h-20 overflow-hidden bg-paper" aria-hidden="true">
      <svg className="absolute inset-0 block w-full h-full">
        <defs>
          <pattern id="header-arches" width={TILE_W} height={TILE_H} patternUnits="userSpaceOnUse">
            {/* Soft wash tying the whole strip together tonally, even
                where the arch openings show plain paper through. */}
            <rect width={TILE_W} height={TILE_H} className="fill-brick/[0.05]" />
            <rect x="0" y={DECK_H} width={PIER_W} height={TILE_H - DECK_H} className="fill-brick" />
            <ellipse cx={ARCH_CX} cy={ARCH_CY} rx={ARCH_RX} ry={ARCH_RY} className="fill-paper" />
            <ellipse
              cx={ARCH_CX}
              cy={ARCH_CY}
              rx={ARCH_RX}
              ry={ARCH_RY}
              fill="none"
              className="stroke-ink/[0.4]"
              strokeWidth="1.5"
            />
            {VOUSSOIR_ANGLES_DEG.map((deg) => (
              <line
                key={deg}
                x1={ARCH_CX}
                y1={ARCH_CY}
                x2={voussoirPoint(deg).split(",")[0]}
                y2={voussoirPoint(deg).split(",")[1]}
                className="stroke-ink/[0.18]"
                strokeWidth="1"
              />
            ))}
            {/* Deck redrawn solid on top, after the void/stroke/voussoirs —
                clips their upper halves (which extend above the
                springline by design) back to one crisp flat roofline. */}
            <rect width={TILE_W} height={DECK_H} className="fill-brick" />
            <line x1="0" y1={DECK_H - 3} x2={TILE_W} y2={DECK_H - 3} className="stroke-ink/[0.15]" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#header-arches)" />
      </svg>
      <svg className="header-train absolute left-0 top-4 w-20 h-auto" viewBox="0 0 100 46">
        <g className="stroke-river" fill="none" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          {/* smoke */}
          <circle cx="18" cy="4" r="2" className="fill-river/[0.35]" stroke="none" />
          <circle cx="22" cy="-2" r="2.6" className="fill-river/[0.22]" stroke="none" />
          {/* funnel */}
          <path d="M13 18 V7 H20 V18" />
          {/* cab + body */}
          <path d="M58 34 V18 H70 V34" />
          <rect x="6" y="18" width="64" height="16" rx="2" />
          <rect x="16" y="22" width="8" height="8" rx="1" />
          <rect x="59" y="21" width="8" height="8" rx="1" />
          {/* buffer beam */}
          <path d="M70 30 H76" />
          {/* wheels */}
          <circle cx="18" cy="38" r="5" />
          <circle cx="34" cy="38" r="5" />
          <circle cx="50" cy="38" r="5" />
          <line x1="18" y1="38" x2="50" y2="38" strokeWidth="1.6" opacity="0.6" />
        </g>
      </svg>
    </div>
  );
}
