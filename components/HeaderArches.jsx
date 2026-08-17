// The masthead's one illustrated flourish: a repeating line of brick
// viaduct arches — the actual railway out of London Bridge through
// Bermondsey, a real local landmark rather than a generic skyline — with
// the wordmark sitting on top of it (like a building on a bridge deck).
//
// Originally its own full-width strip stacked above the wordmark row —
// that made the whole masthead noticeably taller for what was, in the
// end, a fairly small illustration. Now it's layered *into* the existing
// wordmark row instead of adding a new one: HeaderArchesBackground sits
// behind the title as an absolutely-positioned fill (no extra layout
// height, since absolutely-positioned elements don't affect their
// parent's size) — rendered by MastheadNav.jsx inside its own wordmark
// rows. (A worm used to cross in front of the title here too — a
// straight-sided train, redrawn as a worm, then removed entirely; see
// git history if any of that positioning logic is ever needed again.)
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
