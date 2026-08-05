// The masthead's one illustrated flourish: a repeating line of brick
// viaduct arches — the actual railway out of London Bridge through
// Bermondsey, a real local landmark rather than a generic skyline — with
// the wordmark sitting on top of it (like a building on a bridge deck)
// and a train that crosses in front of the title every so often.
//
// Originally its own full-width strip stacked above the wordmark row —
// that made the whole masthead noticeably taller for what was, in the
// end, a fairly small illustration. Now it's layered *into* the existing
// wordmark row instead of adding a new one: HeaderArchesBackground sits
// behind the title as an absolutely-positioned fill (no extra layout
// height, since absolutely-positioned elements don't affect their
// parent's size), and HeaderTrain sits above it, in front of the actual
// text — both rendered by MastheadNav.jsx inside its own wordmark rows.
//
// Two earlier full-strip passes got the arch *style* wrong before
// landing here (see git history for the abandoned filled-shape
// versions) — this is pure line art, New Yorker style: one stroke
// weight throughout, no fills anywhere, flat segmental arches (not tall
// semicircles) matching a real viaduct's proportions. The arch pattern's
// own stroke is faded (stroke-ink/[0.45]) so it reads as supporting
// texture behind the title rather than competing with it for attention;
// the parapet line — where the wordmark actually "sits" — stays full
// strength as the one structural line meant to read clearly.
const STROKE = "1.75";

// The arch band is a small fixed-size graphic (in real px, since a
// <pattern> needs a fixed tile size to repeat without distorting) that
// hangs from the *bottom* of the row — `bottom: 0`, not `top: someY%` —
// so the arch piers' ground level always lands exactly on the row's own
// bottom edge (its hairline, right above the nav links) regardless of
// how tall the row is, rather than floating with a gap above that
// hairline that a percentage-based top offset couldn't reliably close.
// HeaderTrain anchors the same way, offset `bottom: BAND_H` so its skirt
// lands exactly on the parapet line at the *top* of this band.
//
// These proportions are a straight scale-down (~0.6x) of the original
// standalone-strip version's own geometry (TILE_W 130, ARCH_W 85,
// ARCH_RY 18, etc.) — same arch shape, same ratio of pier width to arch
// span, same ratio of arch rise to pier height — not a redesign at a
// smaller size. An earlier version here used different, unrelated
// numbers at a much smaller scale, which read as a different, busier
// style (more, smaller repeats) rather than the same arches shown
// smaller. MastheadNav.jsx's wordmark rows carry extra bottom padding
// specifically to give this room to breathe without heavy clipping.
const BAND_H = 40;

const TILE_W = 78;
const TILE_H = BAND_H;
const PIER_X = 9;
const ARCH_W = 51;
const ARCH_RX = ARCH_W / 2;
const ARCH_RY = 11; // flat/segmental, not a tall semicircle
const SPRINGLINE_Y = 19; // from the parapet (y=0 of this band)
const GROUND_Y = 34;

const ARCH_PATH = `M${PIER_X} ${GROUND_Y} V${SPRINGLINE_Y} A${ARCH_RX} ${ARCH_RY} 0 0 1 ${PIER_X + ARCH_W} ${SPRINGLINE_Y} V${GROUND_Y}`;

// `id` keeps the two instances (mobile row, desktop row — MastheadNav
// renders one of each, only one ever visible at a time) from colliding:
// SVG pattern ids have to be unique per document, and two <defs> sharing
// one id is exactly the kind of thing that renders fine in one browser
// and silently breaks in another.
export function HeaderArchesBackground({ id }) {
  const patternId = `header-arches-${id}`;
  return (
    <svg
      className="absolute inset-x-0 bottom-0 -z-10 block w-full"
      style={{ height: BAND_H }}
      aria-hidden="true"
    >
      <defs>
        <pattern id={patternId} width={TILE_W} height={TILE_H} patternUnits="userSpaceOnUse">
          <path
            d={ARCH_PATH}
            fill="none"
            className="stroke-ink/[0.45]"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      {/* The parapet — where the wordmark sits, like a building on top
          of the bridge deck. Right at the top of this band (y=0),
          SPRINGLINE_Y above where the arches themselves start. */}
      <line x1="0" y1="0" x2="100%" y2="0" className="stroke-ink" strokeWidth={STROKE} strokeLinecap="round" />
    </svg>
  );
}

// A modern unit, not a steam engine — the actual Southeastern Class 707s
// that run this line have a streamlined nose and sit low on a flush
// skirt, no visible wheels or funnel. Nose on the right (the leading
// edge for a sprite moving left-to-right, matching .header-train's own
// direction of travel). Four carriages — the body is one continuous
// outline (real EMUs are articulated, not separate boxes end to end),
// with three joint lines marking where one carriage ends and the next
// begins.
//
// z-20 so it paints in front of the title text and the Subscribe
// button, not just the arches behind them. `bottom: BAND_H` positions
// its skirt exactly on the parapet line (the arch band's own top edge,
// BAND_H above the row's bottom) — a static CSS property distinct from
// `transform`, so it doesn't conflict with .header-train's own
// `transform: translateX(...)` crossing animation the way a static
// `transform: translateY(...)` would (a CSS animation's own transform
// value fully replaces whatever static value shared that property,
// rather than composing with it — an earlier version needed a whole
// second wrapper element just to work around that; positioning by
// `bottom` instead of `transform: translateY` sidesteps the conflict
// entirely, so one element can carry both).
//
// viewBox height is 40, not 50: the drawn shape's lowest point (the
// skirt, y=40) needs to BE the bottom edge of the viewBox, not sit
// inside it with empty space below — otherwise the train's own bounding
// box lands exactly where intended, but the visibly drawn train sits
// proportionally higher than that box, floating above the line it's
// meant to rest on.
export function HeaderTrain() {
  return (
    <svg
      className="header-train absolute left-0 z-20 w-56 sm:w-64 h-auto pointer-events-none"
      style={{ bottom: BAND_H }}
      viewBox="0 0 386 40"
      aria-hidden="true"
    >
      {/* A fourth carriage added (body span 8-266 -> 8-352, one more
          86-unit carriage the same width as the existing three) — same
          height/nose/cab shape throughout, just one more run of
          carriage, so it reads as a longer train rather than a bigger
          one. Joint lines recomputed to keep four even carriages across
          the new span. */}
      <g fill="none" className="stroke-river" strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 8 H352 Q372 8 378 24 Q380 32 374 40 H8 Z" />
        <path d="M354 12 Q368 13 373 24 L358 24 Q356 18 354 12 Z" />
        <circle cx="376" cy="34" r="1.4" className="fill-river" stroke="none" />
        <line x1="94" y1="8" x2="94" y2="40" strokeWidth="1.3" />
        <line x1="180" y1="8" x2="180" y2="40" strokeWidth="1.3" />
        <line x1="266" y1="8" x2="266" y2="40" strokeWidth="1.3" />
      </g>
    </svg>
  );
}
