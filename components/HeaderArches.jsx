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
// parent's size), and HeaderWorm sits above it, in front of the actual
// text — both rendered by MastheadNav.jsx inside its own wordmark rows.
// (HeaderWorm crosses the same way, at the same size, as the train it
// replaced — see its own comment below for what changed and what didn't.)
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
// HeaderWorm anchors the same way, offset `bottom: BAND_H` so its
// underside lands exactly on the parapet line at the *top* of this band.
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

// Was a five-carriage train (see git history) — same crossing, same
// size, redrawn as a worm instead, originally keeping every piece of
// *positioning/animation* infrastructure exactly as it was (the
// viewBox, the rendered width, the `.header-worm` class and its
// crossing keyframes) and changing only what's actually drawn inside
// the `<g>`. That positioning has since moved on again — see this
// function's own comment below for how it now weaves through the
// wordmark's letters instead of crossing below them — but the shape
// itself, described here, hasn't changed since: a straight-sided body
// with a
// pointed nose became a rounded capsule: a soft taper at the tail (the
// left end, trailing during the crossing) and a fuller, blunter round
// at the head (the right end, leading — same "leading edge on the
// right" convention the train used, so it still reads as moving
// forward once it starts crossing). The train's four carriage-joint
// lines became four segment rings instead, at the same x-positions —
// this is what actually reads as "worm" at a glance rather than "blank
// tube": a plain capsule outline alone looks like a pill, not a
// creature. Two dots near the head stand in for eyes, replacing the
// train's single headlight circle and cab-window detail (neither of
// which has a worm equivalent) — sized up from the train's own small
// details (r 1.3 → 1.8) since a worm's eyes are more of its own
// personality than a train's headlight ever was.
//
// Stroke colour is a literal bright yellow (`#F5C518` — the same bold
// yellow the NYRA restyle already established as the site's accent, see
// the crossword's selected-cell highlight and brick_color), not
// `stroke-river`/`stroke-brick` like the rest of the masthead's
// illustration — the worm's own colour, fixed, so it doesn't shift if
// someone changes the theme colours in /admin/theme the way the arches
// or the wordmark link would (brick happens to be this exact yellow by
// default right now, but the worm isn't reading that variable — it's
// its own literal value, matching on purpose rather than by reference).
//
// z-20 so it paints in front of the title text and the Subscribe
// button, not just the arches behind them.
//
// Positioned to weave through the wordmark's own letters, not cross
// below them in the arch band the way the train/worm always used to:
// MastheadNav.jsx now renders this *inside* the wordmark's own relative
// wrapper (around the title text or the logo image, whichever is in
// use) rather than as an independent sibling at the row level, so
// `top-1/2` centres it vertically on the wordmark's own box specifically
// — whatever that box's height actually is — instead of a fixed pixel
// offset tuned for one specific text size. `top-1/2` (not `bottom`) is
// still a static, non-transform property, so it still doesn't conflict
// with `.header-worm`'s animated `transform` the way a static
// `transform: translateY(...)` would — but centring via `top: 50%`
// alone only aligns the SVG's own *top* edge to the container's
// midpoint, not its centre, so every keyframe below folds a
// `translateY(-50%)` into its own transform value to actually centre
// it, alongside that same keyframe's crossing X position and any wobble
// offset — see header-worm-cross in globals.css. (This only works
// because a CSS animation's transform fully replaces whatever static
// transform shares that property rather than composing with it — since
// centring here is folded into the animated value itself instead of
// being a separate static transform, there's nothing for the animation
// to clobber.)
//
// viewBox height is 40, not 50: the drawn shape's lowest point (y=40)
// needs to BE the bottom edge of the viewBox, not sit inside it with
// empty space below — otherwise the worm's own bounding box lands
// exactly where intended, but the visibly drawn shape sits
// proportionally higher than that box, floating above the line it's
// meant to rest on.
export function HeaderWorm() {
  return (
    <svg
      className="header-worm absolute left-0 top-1/2 z-20 w-64 sm:w-72 h-auto pointer-events-none"
      viewBox="0 0 472 40"
      aria-hidden="true"
    >
      <g fill="none" className="stroke-[#F5C518]" strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 24 Q8 8 24 8 H442 Q466 8 466 24 Q466 40 442 40 H24 Q8 40 8 24 Z" />
        <circle cx="450" cy="16" r="1.8" className="fill-[#F5C518]" stroke="none" />
        <circle cx="458" cy="17" r="1.8" className="fill-[#F5C518]" stroke="none" />
        <line x1="94" y1="8" x2="94" y2="40" strokeWidth="1.3" />
        <line x1="180" y1="8" x2="180" y2="40" strokeWidth="1.3" />
        <line x1="266" y1="8" x2="266" y2="40" strokeWidth="1.3" />
        <line x1="352" y1="8" x2="352" y2="40" strokeWidth="1.3" />
      </g>
    </svg>
  );
}
