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
// Two earlier passes at this got the style wrong before landing here:
// the first used flat solid-fill cutout shapes with no linework at all
// (read as a row of bunting); the second added voussoir fan-lines and an
// outline stroke but was still built from filled shapes underneath, and
// still read as illustration-by-committee rather than a single confident
// drawing. This is the version actually agreed on — pure line art, New
// Yorker style: one stroke weight throughout, no fills anywhere, flat
// segmental arches (not tall semicircles) matching a real viaduct's
// proportions, and the parapet — where the line itself runs, on top of
// the brick — drawn as one plain line floating *above* the arches with a
// visible gap, not touching them, rather than connected by verticals.
//
// This walks back part of an earlier call (see Masthead.jsx's own
// comment) to drop the masthead's old hand-drawn illustration for a
// fully plain header — brought back as a thin band *above* the wordmark
// rather than inside it, so the restrained, illustration-free wordmark
// itself is untouched.
const STROKE = "1.75";

// One tile = one arch. Pier-to-pier arch width is 85, with a 45-wide
// solid gap to the next tile's pier — a real viaduct's arches don't
// touch, there's a wall segment between each one.
const TILE_W = 130;
const TILE_H = 96;
const PIER_X = 15;
const ARCH_W = 85;
const SPRINGLINE_Y = 62; // where the arch meets the piers
const GROUND_Y = 86;
const ARCH_RX = ARCH_W / 2;
const ARCH_RY = 18; // flat/segmental, not a tall semicircle
const PARAPET_Y = 30; // floating above the arch crown (44), not touching it

export default function HeaderArches() {
  return (
    <div className="relative h-24 overflow-hidden bg-paper" aria-hidden="true">
      <svg className="absolute inset-0 block w-full h-full">
        <defs>
          <pattern id="header-arches" width={TILE_W} height={TILE_H} patternUnits="userSpaceOnUse">
            <path
              d={`M${PIER_X} ${GROUND_Y} V${SPRINGLINE_Y} A${ARCH_RX} ${ARCH_RY} 0 0 1 ${PIER_X + ARCH_W} ${SPRINGLINE_Y} V${GROUND_Y}`}
              fill="none"
              className="stroke-ink"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#header-arches)" />
        {/* The parapet — a plain line, floating clear above the arches. */}
        <line x1="0" y1={PARAPET_Y} x2="100%" y2={PARAPET_Y} className="stroke-ink" strokeWidth={STROKE} strokeLinecap="round" />
      </svg>
      {/* Rides the same parapet line the arches float below — wheels sit
          on it, same as the arches' own top edge relates to it. */}
      <svg className="header-train absolute left-0 top-0 w-20 h-auto" viewBox="0 0 90 30">
        <g fill="none" className="stroke-river" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <line x1="14" y1="4" x2="14" y2="12" />
          <path d="M4 26 V12 H60 V26" />
          <path d="M60 26 V16 H74 V26" />
          <circle cx="16" cy="26" r="4" />
          <circle cx="36" cy="26" r="4" />
          <circle cx="66" cy="26" r="4" />
        </g>
      </svg>
    </div>
  );
}
