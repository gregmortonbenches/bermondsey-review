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
// hangs from the parapet line rather than filling the whole row: it
// starts GAP below the parapet and is BAND_H tall in total, regardless
// of how tall the row itself is. Mobile's row (~69px, a short title with
// no tagline) and desktop's (~89px, a bigger title) both have the
// parapet sitting close to the title's own bottom edge — an earlier
// version instead sized this graphic to the *row's* full height with
// arch geometry in fixed pixels from the row's top, which put the arch
// crowns overlapping the title itself on both breakpoints, since that
// geometry had no relationship to where the parapet (or the title)
// actually ended up.
const BAND_H = 36;
const GAP = 6; // parapet -> crown

const TILE_W = 70;
const TILE_H = 30;
const PIER_X = 10;
const ARCH_W = 50;
const ARCH_RX = ARCH_W / 2;
const ARCH_RY = 10; // flat/segmental, not a tall semicircle
const SPRINGLINE_Y = 12; // within the tile, i.e. GAP + 12 from the parapet
const GROUND_Y = TILE_H; // bottom of the band

const ARCH_PATH = `M${PIER_X} ${GROUND_Y} V${SPRINGLINE_Y} A${ARCH_RX} ${ARCH_RY} 0 0 1 ${PIER_X + ARCH_W} ${SPRINGLINE_Y} V${GROUND_Y}`;

// `id` keeps the two instances (mobile row, desktop row — MastheadNav
// renders one of each, only one ever visible at a time) from colliding:
// SVG pattern ids have to be unique per document, and two <defs> sharing
// one id is exactly the kind of thing that renders fine in one browser
// and silently breaks in another.
export function HeaderArchesBackground({ id, parapetY = "72%" }) {
  const patternId = `header-arches-${id}`;
  return (
    <svg
      className="absolute inset-x-0 -z-10 block w-full"
      style={{ top: parapetY, height: BAND_H }}
      aria-hidden="true"
    >
      <defs>
        <pattern id={patternId} x="0" y={GAP} width={TILE_W} height={TILE_H} patternUnits="userSpaceOnUse">
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
          of the bridge deck. Right at the top of this band (y=0), GAP
          above where the arches themselves start. */}
      <line x1="0" y1="0" x2="100%" y2="0" className="stroke-ink" strokeWidth={STROKE} strokeLinecap="round" />
    </svg>
  );
}

// A modern unit, not a steam engine — the actual Southeastern Class 707s
// that run this line have a streamlined nose and sit low on a flush
// skirt, no visible wheels or funnel. Nose on the right (the leading
// edge for a sprite moving left-to-right, matching .header-train's own
// direction of travel). Three carriages — the body is one continuous
// outline (real EMUs are articulated, not separate boxes end to end),
// with two joint lines marking where one carriage ends and the next
// begins.
//
// z-20 so it paints in front of the title text and the Subscribe
// button, not just the arches behind them — an outer wrapper handles the
// static vertical placement (top + a full translateY(-100%), so the
// train's own skirt lands exactly on the parapet regardless of the
// row's height) while an inner element carries .header-train's
// horizontal crossing animation; a single element can't do both, since
// the keyframes' own transform would silently replace a static one set
// alongside it on the same property.
export function HeaderTrain({ topY = "72%" }) {
  return (
    <div
      className="absolute left-0 z-20 w-40 sm:w-48 pointer-events-none"
      style={{ top: topY, transform: "translateY(-100%)" }}
      aria-hidden="true"
    >
      <svg className="header-train block w-full h-auto" viewBox="0 0 260 50">
        <g fill="none" className="stroke-river" strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 8 H226 Q246 8 252 24 Q254 32 248 40 H8 Z" />
          <path d="M228 12 Q242 13 247 24 L232 24 Q230 18 228 12 Z" />
          <circle cx="250" cy="34" r="1.4" className="fill-river" stroke="none" />
          <line x1="81" y1="8" x2="81" y2="40" strokeWidth="1.3" />
          <line x1="154" y1="8" x2="154" y2="40" strokeWidth="1.3" />
        </g>
      </svg>
    </div>
  );
}
