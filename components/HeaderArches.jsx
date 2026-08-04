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
// This walks back part of an earlier call (see Masthead.jsx's own
// comment) to drop the masthead's old hand-drawn illustration for a
// fully plain header — brought back as a thin band *above* the wordmark
// rather than inside it, so the restrained, illustration-free wordmark
// itself is untouched.
export default function HeaderArches() {
  return (
    <div className="relative h-14 overflow-hidden bg-paper" aria-hidden="true">
      <svg className="absolute inset-0 block w-full h-full">
        <defs>
          {/* Base brick block, then a big circular void carved out for the
              arch opening (its top edge intentionally pokes above the
              deck), then the deck redrawn solid on top of that — gives a
              crisp flat roofline instead of the void's round top showing
              through, with piers as the untouched brick either side of
              each circle. */}
          <pattern id="header-arches" width="90" height="56" patternUnits="userSpaceOnUse">
            <rect width="90" height="56" className="fill-brick" />
            <circle cx="45" cy="18" r="29" className="fill-paper" />
            <rect width="90" height="18" className="fill-brick" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#header-arches)" />
      </svg>
      <svg
        className="header-train absolute left-0 top-2.5 w-14 h-auto"
        viewBox="0 0 64 28"
      >
        <g className="fill-river">
          <rect x="2" y="12" width="42" height="12" rx="2" />
          <path d="M44 12 H54 A4 4 0 0 1 58 16 V20 A4 4 0 0 1 54 24 H44 Z" />
          <rect x="9" y="4" width="9" height="9" rx="1" />
          <rect x="7" y="2" width="2.5" height="4" />
          <circle cx="12" cy="25" r="3.2" />
          <circle cx="24" cy="25" r="3.2" />
          <circle cx="36" cy="25" r="3.2" />
          <circle cx="50" cy="25" r="3.2" />
        </g>
      </svg>
    </div>
  );
}
