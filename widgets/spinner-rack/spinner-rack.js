/**
 * <spinner-rack> — an online version of the wire spinner rack that stands in
 * the doorway of every good bookshop.
 *
 * STANDALONE. This does not belong to the Bermondsey Review site and is not
 * bound by the design direction in the repo's CLAUDE.md — it is a portable,
 * zero-dependency widget meant to be dropped into a shop front end (plain
 * HTML, Shopify/Liquid, WooCommerce, React, anything). It imports nothing and
 * touches no global styles.
 *
 * ---------------------------------------------------------------------------
 * WHY IT'S BUILT THIS WAY
 *
 * The books come from the light DOM as ordinary <a> elements. If the script
 * never loads, or fails, or a crawler is looking, the element stays undefined,
 * no shadow root is attached, and the page renders a plain list of product
 * links — which is the correct fallback, costs nothing, and keeps the stock
 * indexable. The upgrade to a rack is pure enhancement.
 *
 * The rotation is a real 3D transform on N flat panels, not a carousel of
 * slides faked with translateX. It matters: on a real rack the far side is
 * genuinely hidden, the panels foreshorten as they turn away, and the thing
 * you grab has weight. All of that falls out of `preserve-3d` plus
 * `backface-visibility: hidden` for free, and none of it is reproducible in 2D.
 *
 * The physics is a flick with exponential drag. By default it free-wheels to a
 * stop wherever it runs out, corner included, like the real fixture. `snap`
 * adds a detent that only bites once the rack has slowed — the same as the
 * ball-catch in a real rack's base, so a hard flick still free-wheels through
 * several turns before a facing catches.
 * ---------------------------------------------------------------------------
 *
 * USAGE
 *
 *   <script type="module" src="spinner-rack.js"></script>
 *
 *   <spinner-rack label="Picador" sides="4" per-shelf="2">
 *     <a href="/books/peterloo"
 *        data-title="Peterloo"
 *        data-author="Robert Poole"
 *        data-cover="/covers/peterloo.jpg"
 *        data-price="£10.99"
 *        data-category="History">Peterloo</a>
 *     ...
 *   </spinner-rack>
 *
 * Or, in a JS app, assign the data and skip the light DOM entirely:
 *   document.querySelector('spinner-rack').books = [{ title, author, href, ... }]
 *
 * ATTRIBUTES
 *   sides       panels round the rack (3–8, default 4)
 *   per-shelf   books per shelf (1–4, default 2)
 *   rows        shelves per panel (default: derived from how many books there
 *               are, so the rack is only as tall as the stock needs)
 *   label       fallback crown text; each panel otherwise shows its own category
 *   snap        "true" to make it catch a facing square-on (default off — it
 *               free-wheels to a stop anywhere, like the real fixture)
 *   controls    "false" to hide the prev/next buttons
 *   chrome      "fixture" draws the rack as a painted-steel shop fitting —
 *               riveted shelf lips, an illuminated sign, books casting
 *               shadows. Off by default: the rack is meant to be part of the
 *               page, not a photograph of a fixture pasted onto one.
 *
 * CAPACITY is sides × rows × per-shelf, and rows is capped at 7 so a big feed
 * can't produce an absurd skyscraper. Anything past capacity is not rendered —
 * a spinner is a browsing surface, not a catalogue. 24–40 books is the sweet
 * spot for a four-sided rack.
 *
 * EVENTS
 *   rack-select  {book, index, face, element}  cancelable — preventDefault()
 *                to stop navigation and open your own quick-view instead
 *   rack-face    {face, label}                 front panel changed
 *
 * METHODS
 *   goToFace(i)  turn to panel i
 *   spin(degreesPerSecond = 700)  give it a shove
 *
 * STYLING — set these custom properties on the element:
 *   --rack-cover-ratio  width / height of a cover, default 0.667 (standard
 *                     hardback). Set per-book with data-ar only when a title
 *                     genuinely differs.
 *   --rack-rule       hairline for the shelf rules and cover edges
 *   --rack-page       the page's own background; facings turning away fade
 *                     into it, so set it to what your page actually is
 *   --rack-accent     focus rings
 *   --rack-max-width  panel width cap
 *   --rack-max-height the rack shrinks to fit this (default 80vh, `none` to
 *                     let it run to whatever height its stock needs)
 *   --rack-display-font, --rack-book-font, --rack-crown-font
 *   --rack-metal, --rack-crown, --rack-crown-ink   (chrome="fixture" only)
 */

const CLAMP = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

// Tuning. All of it is feel, arrived at by spinning the thing; the comments
// say what each number does so it can be re-felt rather than re-guessed.
const PHYSICS = {
  DEG_PER_PX: 0.27,   // drag gearing: how far a pixel of finger turns the rack
  DRAG_K: 1.9,        // free-spin decay (1/s). A 900°/s flick travels ~470°.
  DETENT_K: 12,       // detent pull, °/s² per ° of offset
  DETENT_DAMP: 5,     // extra drag as the detent takes hold — roughly critical
  FREE_SPIN: 300,     // °/s above which the detents have no grip at all
  REST_SPEED: 4,      // °/s — below this, and close enough, we park
  REST_OFFSET: 0.2,   // ° from a detent that counts as parked
  MAX_FLICK: 2200,    // °/s cap, so a frantic swipe doesn't launch it
};

/**
 * How far the cap stands proud of the panels, in px. Zero, deliberately: a cap
 * on a bigger drum needs wider panels or its corners stop meeting, and even
 * with that corrected you can see under the overhang at a corner, straight
 * through the rack to the page behind. Three pixels of relief is not worth a
 * hole. Kept as a constant, with the scaling maths intact, so it can be put
 * back if the soffit is ever closed off.
 */
const CROWN_PROUD = 0;

// Must match the stage's perspective, which the layout pass also writes, since
// the overhang below is derived from it.
const PERSPECTIVE = 1700;
const PERSPECTIVE_ORIGIN_Y = 0.42;

// How tall a book is as a fraction of the panel width, by books-per-shelf.
// Width then follows from the aspect ratio, which is why the covers stay in
// proportion at every rack size.
const BOOK_SCALE = { 1: 0.72, 2: 0.50, 3: 0.34, 4: 0.26 };

// Generated jackets, used for books with no cover image. Shops always have a
// few — a pre-order with no artwork yet, a backlist reissue nobody scanned —
// and an empty grey box in a rack of colour reads as broken. Drawn from the
// ink/paper pairs paperback imprints actually use.
const JACKETS = [
  { paper: '#d9532a', ink: '#fdf6e8', rule: '#1b1b1b' },
  { paper: '#e8e2d4', ink: '#1b1b1b', rule: '#b8262b' },
  { paper: '#14385c', ink: '#f2e9d6', rule: '#e6a93c' },
  { paper: '#e3b423', ink: '#221f18', rule: '#8f2a1e' },
  { paper: '#1f6b4a', ink: '#f4eeda', rule: '#e3b423' },
  { paper: '#9c2020', ink: '#f7e9d5', rule: '#e8c56a' },
  { paper: '#f0e7d6', ink: '#24405e', rule: '#d9532a' },
  { paper: '#0f6f74', ink: '#f3e6c8', rule: '#e07b2c' },
  { paper: '#7a2a63', ink: '#fbe6ef', rule: '#f2b8cd' },
  { paper: '#ef8a3c', ink: '#231a10', rule: '#14385c' },
  { paper: '#3f5d2a', ink: '#f2eeda', rule: '#dcd08a' },
  { paper: '#1c1d22', ink: '#ece7da', rule: '#d9532a' },
];

// Deterministic, so a given title always gets the same jacket. A cover that
// reshuffles on every page load looks like a bug.
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Title size as a fraction of the book's width.
 *
 * The first version of this guessed at a per-character width and got it wrong
 * — bold uppercase Georgia is nearer 0.8em a character than the 0.68 assumed,
 * so "OLIGARCHY" still came out as "OLIGARCH / Y". So measure the actual font
 * instead of estimating it. A canvas measurement costs nothing next to a
 * layout read, needs no element in the tree, and is exact.
 *
 * Two constraints, whichever binds hardest: the longest single word has to fit
 * on one line, and the whole title has to fit inside the line clamp. The
 * jacket gives up 18% of the cover to padding, hence 82.
 */
let measureCtx;
const fitCache = new Map();

function titleFit(title, font) {
  const key = font + '\u0000' + title;
  const hit = fitCache.get(key);
  if (hit) return hit;

  let tf;
  try {
    measureCtx = measureCtx || document.createElement('canvas').getContext('2d');
    measureCtx.font = `700 100px ${font}`;
    const upper = String(title).toUpperCase();
    // letter-spacing is 0.01em, which measureText doesn't know about.
    const width = (s) => measureCtx.measureText(s).width + s.length;
    const longest = upper.split(/\s+/).filter(Boolean)
      .reduce((m, w) => Math.max(m, width(w)), 1);
    // 279 rather than 328 (= 4 × 82) because words don't pack a line perfectly.
    tf = Math.min(0.142, 82 / longest, 279 / width(upper));
  } catch {
    // No canvas: fall back to the old estimate rather than rendering nothing.
    const words = String(title).split(/\s+/).filter(Boolean);
    const longest = words.reduce((m, w) => Math.max(m, w.length), 1);
    tf = Math.min(0.142, 1.15 / longest, 5.2 / String(title).length);
  }

  const out = Math.max(0.085, tf).toFixed(4);
  fitCache.set(key, out);
  return out;
}

/**
 * Cover proportions, held to what will actually shelve. Real catalogues are
 * not all B-format: a landscape photo book, a near-square cookbook and a tall
 * hardback all turn up, and forcing them through one 1:1.54 box with
 * object-fit: cover crops the photo book down to a detail of itself. Outside
 * this range it's a broken asset rather than an unusual format, and letting it
 * through would wreck the shelf.
 */
function clampAr(ar) {
  return Number.isFinite(ar) && ar > 0 ? CLAMP(ar, 0.4, 1.7).toFixed(4) : '';
}

function shortestDelta(from, to) {
  return ((((to - from) % 360) + 540) % 360) - 180;
}

const STYLES = `
:host {
  display: block;
  --rack-metal: #16171b;
  --rack-crown: #0e0f12;
  --rack-crown-ink: #fdfbf5;
  --rack-accent: #b8262b;         /* focus rings — the only colour the rack spends */
  /* Page-native mode uses these two instead of the metal: a hairline for the
     shelf rules and cover edges, and the page's own background, which the
     turning-away facings fade into so the rack recedes into the page rather
     than darkening like an object. Hosts should set --rack-page to whatever
     their page actually is; Canvas is only a sane guess. */
  --rack-rule: rgba(0, 0, 0, 0.16);
  --rack-page: Canvas;
  /* Standard hardback: 156 x 234 mm, which is exactly 2:3. Every book takes
     this shape unless its own cover image says otherwise, so a rack of uniform
     stock comes out as a clean grid. Written to four places to match what
     clampAr() reports for a 2:3 image, so a generated jacket and a real cover
     are the same box to the pixel. Paperback lists want 0.649 (B-format) or
     0.636 (A-format). */
  --rack-cover-ratio: 0.6667;
  --rack-max-width: 220px;
  /* The rack shrinks to fit this before it overflows the screen. Covers divide
     the panel, so a narrow viewport makes a rack TALLER, not narrower — this is
     what stops a phone showing two shelves of an 800px rack. Set it to "none"
     to let the rack be whatever height its stock needs. */
  --rack-max-height: 80vh;
  --rack-display-font: "Helvetica Neue", Helvetica, Arial, sans-serif;
  --rack-book-font: Georgia, "Times New Roman", serif;
  /* The sign is its own typographic role — a bookshop fascia, not a book
     jacket and not UI chrome — so it gets its own property rather than
     inheriting whichever of the other two it happens to sit nearest. */
  --rack-crown-font: Georgia, "Times New Roman", serif;

  /* Written by the layout pass. --bh is the book height as a fraction of the
     panel width; --book-w is the width that follows from it. */
  --face-w: 220px;
  --radius: 110px;
  --lid-size: 311px;
  --lid-clip: none;
  --angle: 0deg;
  --bh: 0.50;
  --crown-h: calc(var(--face-w) * 0.245);
  --crown-proud: 0px;
  --crown-w: 220px;
  --book-w: calc(var(--face-w) * var(--bh) * var(--rack-cover-ratio));
}

/* vh on iOS means the viewport with the URL bar hidden, so an 80vh budget can
   exceed what is actually visible — the precise failure the budget prevents.
   dvh tracks the real one. Kept as an @supports override so the vh default
   above still stands where dvh is unavailable. */
@supports (height: 1dvh) {
  :host { --rack-max-height: 80dvh; }
}

* { box-sizing: border-box; }

.wrap { position: relative; }

/* Resolves --rack-max-height to pixels for the layout pass. */
.hbudget {
  position: absolute;
  left: 0;
  top: 0;
  width: 0;
  height: var(--rack-max-height);
  visibility: hidden;
  pointer-events: none;
}

.stage {
  perspective: var(--rack-perspective, 1700px);
  perspective-origin: 50% calc(var(--rack-origin-y, 0.42) * 100%);
  touch-action: pan-y;            /* vertical page scroll must still work */
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;
  outline: none;
}
.stage.dragging { cursor: grabbing; }
.stage:focus-visible { outline: 2px solid var(--rack-accent); outline-offset: 4px; }

/* Every panel shares one grid cell, so the rack takes the height of its
   tallest panel without anything having to be measured in JS. */
.rack {
  display: grid;
  justify-items: center;
  transform-style: preserve-3d;
  transform: rotateY(var(--angle));
  will-change: transform;
  padding-top: var(--crown-h);    /* headroom for the crown, which sits above */
}

.face, .crown-panel {
  grid-area: 1 / 1;
  /* transform-style stays flat (the initial value): one rotated plane of
     ordinary content. preserve-3d here puts every shelf, book and cover in the
     shared 3D space where each shows its own backface — the rear facings then
     render mirrored, which the fixture's opaque panels were only hiding. */
  backface-visibility: hidden;
}
.face { width: var(--face-w); }

.crown-panel {
  align-self: start;
  /* Width and depth both come from CROWN_PROUD — see the constant. */
  width: var(--crown-w);
  height: var(--crown-h);
  /* Dropped 6px into the panel below, so the cap sits ON the rack rather than
     hovering a hairline above it. */
  transform: rotateY(var(--fa)) translateZ(calc(var(--radius) + var(--crown-proud)))
             translateY(calc(6px - var(--crown-h)));
  display: grid;
  place-items: center;
  padding: 0 10px;
}
.crown-panel span {
  /* The book face, not the display face: the sign reads as a bookshop fascia
     rather than shouted signage. Set in whatever case the shop authored —
     see #crownHTML for why the casing isn't forced here. */
  font: 400 clamp(14px, calc(var(--face-w) * 0.095), 26px)/1.05 var(--rack-crown-font);
  letter-spacing: 0.01em;
  color: inherit;                 /* the page's ink, not the fixture's */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  text-align: center;
}

/* The cap. A regular N-gon clipped from a square and laid flat, so the rack
   reads as one solid object from above rather than N floating boards. The
   translate has to carry the lid's own half-height, because rotateX turns it
   about its centre line, not its top edge. */
.lid {
  display: none;                  /* fixture only */
  grid-area: 1 / 1;
  align-self: start;
  width: var(--lid-size);
  height: var(--lid-size);
  transform: translateY(calc(6px - var(--crown-h) - var(--lid-size) / 2)) rotateX(90deg);
  background: linear-gradient(160deg, #303239, #101114);
  clip-path: var(--lid-clip);
  pointer-events: none;
}

.face {
  position: relative;
  transform: rotateY(var(--fa)) translateZ(var(--radius));
  padding: 0 0 2px;
}
/* The uprights — the bones of the rack. Fixture only. */
.face::before, .face::after {
  content: none;
  position: absolute;
  top: 0;
  bottom: 0;
  width: 5px;
  background: linear-gradient(90deg, #45474f, #1a1b1f 60%, #0a0a0c);
  pointer-events: none;
}
.face::before { left: 0; }
.face::after { right: 0; transform: scaleX(-1); }

/* Panels turned away get dimmed, driven by a --facing value the animation
   loop writes (1 = square on, 0 = edge on). Steadier and cheaper than a
   filter on the whole rack. */
.face .shade {
  position: absolute;
  inset: 0;
  background: var(--rack-page);
  opacity: calc((1 - var(--facing, 1)) * 0.72);
  pointer-events: none;
  z-index: 5;
}

.shelf {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 10px;
  padding: 0 0 4px;               /* books rest on the rule, not above it */
  margin-bottom: 13px;
  /* Held to a fixed height so the shelf lips line up across every panel, even
     on a panel whose last shelf came up short. */
  min-height: calc(var(--face-w) * var(--bh) * 1.04 + 14px);
}
.shelf:last-child { margin-bottom: 0; }

/* The lip: the folded steel bar that stops the stock sliding off, with the
   two bolt heads that hold it to the uprights. */
.shelf .lip {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 1px;
  background: var(--rack-rule);
}
.shelf .lip::before, .shelf .lip::after {
  content: none;
  position: absolute;
  top: 2px;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #9a9ca4, #35373d);
}
.shelf .lip::before { left: 5px; }
.shelf .lip::after { right: 5px; }

.book {
  position: relative;
  display: block;
  /* Equal columns filling the panel; height follows each cover's own ratio, so
     a landscape photo book still shelves as a landscape photo book — it just
     sits shorter in its column rather than wider than its neighbours. */
  flex: 1 1 0;
  min-width: 0;
  text-decoration: none;
  color: inherit;
  transform-origin: 50% 100%;
  transition: opacity 140ms ease;
  outline: none;
}
@media (hover: hover) {
  .book:hover { opacity: 0.72; }
}
.book:focus-visible .cover { outline: 2px solid var(--rack-accent); outline-offset: 2px; }

.cover {
  position: relative;
  width: 100%;
  height: auto;
  aspect-ratio: var(--ar, var(--rack-cover-ratio));
  margin-top: auto;               /* sit on the rule, whatever the height */
  /* A hairline, because a pale cover on a pale page has no edge of its own —
     the white Ottolenghi jacket would otherwise dissolve into the paper. */
  border: 1px solid var(--rack-rule);
  overflow: hidden;
}
.cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
/* Spine shadow, page block, light from above — the three cues that say "object
   standing up" rather than "picture of a book". Fixture only: in the page they
   are printed covers, not props. */
.cover::after {
  content: none;
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(0,0,0,0.45) 0, rgba(0,0,0,0.12) 5%, rgba(0,0,0,0) 12%),
    linear-gradient(90deg, rgba(0,0,0,0) 94%, rgba(255,255,255,0.22) 97%, rgba(0,0,0,0.3) 100%),
    linear-gradient(200deg, rgba(255,255,255,0.14) 0, rgba(255,255,255,0) 42%);
  pointer-events: none;
}

/* Generated jackets, for books with no cover image. Three layouts, picked by
   hash, because one template repeated thirty-two times reads as a template —
   and the whole point of a rack is that it looks like a mixed shipment. */
.jacket {
  width: 100%;
  height: 100%;
  padding: 10% 9%;
  display: flex;
  flex-direction: column;
  font-family: var(--rack-book-font);
  line-height: 1.1;
  overflow: hidden;
}
.j-title {
  font-size: clamp(6px, calc(var(--book-w) * var(--tf, 0.142)), 16px);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.01em;
  overflow-wrap: break-word;      /* backstop only; --tf should prevent it */
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
}
.j-author {
  font-size: clamp(6px, calc(var(--book-w) * 0.098), 12px);
  font-style: italic;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* v0 — title up top, author down at the foot. The default paperback. */
.j-v0 { justify-content: space-between; }
.j-v0 .j-rule { height: 3px; width: 44%; margin-bottom: 7%; }

/* v1 — title reversed out of a full-bleed band. */
.j-v1 { justify-content: flex-start; padding-top: 16%; }
.j-v1 .j-band { margin: 0 -11%; padding: 7% 11%; }
.j-v1 .j-author { margin-top: auto; }

/* v2 — centred between rules, the literary-imprint look. */
.j-v2 { justify-content: space-between; text-align: center; }
.j-v2 .j-hr { height: 1.5px; margin: 9% 12%; }
.j-v2 .j-title { -webkit-line-clamp: 3; }

.floor {
  /* Perspective magnifies the near corner downward, so the rack paints below
     the box it lays out in. The overhang scales with how far the bottom sits
     below the vanishing point — i.e. with the rack's HEIGHT, not its width, as
     an earlier version assumed — so the layout pass computes it exactly. */
  height: var(--rack-clearance, 46px);
  margin-top: -8px;
  pointer-events: none;
}

.controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
}
.controls button {
  appearance: none;
  /* 44px, not 34: a thumb target, not a cursor target. */
  width: 44px;
  height: 44px;
  border: 1px solid currentColor;
  background: transparent;
  color: inherit;
  cursor: pointer;
  display: grid;
  place-items: center;
  padding: 0;
}
.controls button:hover { background: currentColor; }
.controls button:hover svg { stroke: Canvas; }
.controls svg { width: 13px; height: 13px; fill: none; stroke: currentColor; stroke-width: 2; }
.count {
  font: 500 11px/1 var(--rack-display-font);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  min-width: 8ch;
  text-align: center;
  opacity: 0.75;
  font-variant-numeric: tabular-nums;
}

.sr {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

/* The one-off nudge that says "this turns". Skipped under reduced motion, and
   cancelled the moment anyone touches the rack. */
@keyframes rack-hint {
  0%, 100% { transform: rotateY(var(--angle)); }
  35% { transform: rotateY(calc(var(--angle) + 9deg)); }
  70% { transform: rotateY(calc(var(--angle) - 4deg)); }
}
.rack.hint { animation: rack-hint 1200ms cubic-bezier(.33, .1, .3, 1) 1; }

/* ===========================================================================
   chrome="fixture" — the rack as a physical object: painted steel, riveted
   shelf lips, an illuminated sign, books casting shadows. Kept because it is
   built and works, but it is not the default: it reads as a photograph of a
   shop fitting pasted onto a page, which is the opposite of belonging to one.
   Everything above is the page-native treatment.
   =========================================================================== */
:host([chrome="fixture"]) .crown-panel {
  background: var(--rack-crown);
  border: 1px solid #000;
  box-shadow: inset 0 1px 0 #43454d, inset 0 -14px 22px -14px #000;
}
:host([chrome="fixture"]) .crown-panel span {
  color: var(--rack-crown-ink);
  text-shadow: 0 0 16px rgba(255, 255, 255, 0.22);
}
:host([chrome="fixture"]) .lid { display: block; }
:host([chrome="fixture"]) .face {
  background: linear-gradient(180deg, #23252b 0, var(--rack-metal) 10%, var(--rack-metal) 90%, #0c0d10 100%);
  border: 1px solid #000;
  padding: 10px 9px 12px;
}
:host([chrome="fixture"]) .face::before,
:host([chrome="fixture"]) .face::after { content: ""; }
:host([chrome="fixture"]) .face .shade {
  background: #05060a;
  opacity: calc((1 - var(--facing, 1)) * 0.72);
}
:host([chrome="fixture"]) .face,
:host([chrome="fixture"]) .shelf,
:host([chrome="fixture"]) .book { transform-style: preserve-3d; }
:host([chrome="fixture"]) .shelf {
  gap: 7px;
  padding: 0 6px 7px;
  margin-bottom: 9px;
}
:host([chrome="fixture"]) .shelf .lip {
  left: 2px;
  right: 2px;
  height: 7px;
  background: linear-gradient(180deg, #52555e 0 1px, #2b2d33 1px, #101114);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.6);
}
:host([chrome="fixture"]) .shelf .lip::before,
:host([chrome="fixture"]) .shelf .lip::after { content: ""; }
:host([chrome="fixture"]) .book {
  flex: 0 1 calc(var(--face-w) * var(--bh) * var(--vary, 1) * var(--ar, var(--rack-cover-ratio)));
  transform: rotate(var(--tilt, 0deg));
  transition: transform 180ms ease;
}
@media (hover: hover) {
  :host([chrome="fixture"]) .book:hover {
    opacity: 1;
    transform: rotate(0deg) translateY(-7px) translateZ(14px) scale(1.04);
    z-index: 4;
  }
}
:host([chrome="fixture"]) .book:focus-visible {
  transform: rotate(0deg) translateY(-7px) translateZ(14px) scale(1.04);
  z-index: 4;
}
:host([chrome="fixture"]) .cover {
  background: #c9c4b8;
  border: 0;
  box-shadow: 0 6px 10px -4px rgba(0, 0, 0, 0.75), 0 1px 0 rgba(255, 255, 255, 0.08);
}
:host([chrome="fixture"]) .cover::after { content: ""; }
:host([chrome="fixture"]) .floor {
  background: radial-gradient(50% 60% at 50% 0, rgba(0,0,0,0.4), rgba(0,0,0,0) 70%);
}

@media (prefers-reduced-motion: reduce) {
  .book { transition: none; }
  .rack.hint { animation: none; }
}
`;

class SpinnerRack extends HTMLElement {
  static observedAttributes = ['label', 'sides', 'rows', 'per-shelf', 'snap', 'controls'];

  #books = null;        // set programmatically, overrides the light DOM
  #rendered = [];       // flattened, in the order the panels were filled
  #angle = 0;
  #velocity = 0;        // °/s
  #raf = 0;
  #last = 0;
  #glideTarget = null;
  #dragging = false;
  #pointerId = null;
  #dragX = 0;
  #moved = 0;
  #swallowClick = false;
  #wheelIdle = 0;
  #samples = [];
  #faces = [];
  #crowns = [];
  #front = -1;
  #built = false;
  #reduce = false;
  #hinted = false;
  #hintObserver = null;
  #resizeObserver = null;
  #bookFont = 'Georgia, serif';

  connectedCallback() {
    if (this.#built) return;
    this.#built = true;

    const mq = matchMedia('(prefers-reduced-motion: reduce)');
    this.#reduce = mq.matches;
    mq.addEventListener('change', (e) => { this.#reduce = e.matches; });

    this.attachShadow({ mode: 'open' });
    this.#render();
  }

  disconnectedCallback() {
    cancelAnimationFrame(this.#raf);
    this.#raf = 0;
    this.#resizeObserver?.disconnect();
    this.#hintObserver?.disconnect();
  }

  attributeChangedCallback() {
    if (this.#built && this.shadowRoot) this.#render();
  }

  /** Set books programmatically instead of via light-DOM <a> children. */
  set books(list) {
    this.#books = Array.isArray(list) ? list : null;
    if (this.#built && this.shadowRoot) this.#render();
  }

  get books() { return this.#books || this.#readLightDom(); }

  /**
   * Give it a shove, the way you would in the shop. Positive turns it left.
   * Reuses the same loop as a flick, so it decelerates and catches a panel
   * exactly as a dragged spin does.
   */
  spin(degreesPerSecond = 700) {
    this.#stopHint();
    this.#glideTarget = null;
    this.#velocity = this.#reduce ? 0 : degreesPerSecond;
    if (this.#reduce) this.goToFace(this.#front + 1);
    else this.#start();
  }

  /** Turn to a given panel (0-indexed). */
  goToFace(i) {
    const sides = this.#sides();
    const step = 360 / sides;
    this.#glideTo(-(((i % sides) + sides) % sides) * step);
  }

  #sides() { return CLAMP(parseInt(this.getAttribute('sides'), 10) || 4, 3, 8); }
  #perShelf() { return CLAMP(parseInt(this.getAttribute('per-shelf'), 10) || 2, 1, 4); }

  /**
   * The light DOM is the source of truth. Anything an <a> can carry — an href
   * that works, text that reads — survives with the script switched off.
   */
  #readLightDom() {
    return [...this.querySelectorAll('a')].map((a) => ({
      href: a.getAttribute('href') || '',
      title: a.dataset.title || a.textContent.trim(),
      author: a.dataset.author || '',
      cover: a.dataset.cover || '',
      price: a.dataset.price || '',
      category: a.dataset.category || '',
      ar: a.dataset.ar || '',
      target: a.getAttribute('target') || '',
    })).filter((b) => b.title);
  }

  /**
   * Deal the stock across the panels. Balanced, not filled-to-capacity-first:
   * six books on a four-sided rack want to be 2/2/1/1, not 4/2/0/0. Each
   * panel still gets a contiguous run, so a category can own a side.
   */
  #deal(books, sides, perShelf) {
    const n = books.length;
    const base = Math.floor(n / sides);
    const rem = n % sides;
    const counts = Array.from({ length: sides }, (_, f) => base + (f < rem ? 1 : 0));

    const attrRows = parseInt(this.getAttribute('rows'), 10);
    const needed = Math.ceil(Math.max(1, ...counts) / perShelf);
    const rows = CLAMP(attrRows > 0 ? attrRows : needed, 1, 7);
    const capacity = rows * perShelf;

    let cursor = 0;
    const faces = counts.map((c) => {
      const slice = books.slice(cursor, cursor + Math.min(c, capacity));
      cursor += c;
      return slice;
    });
    return { faces, rows };
  }

  #render() {
    const root = this.shadowRoot;
    const books = this.books;
    const sides = this.#sides();
    const perShelf = this.#perShelf();
    const { faces, rows } = this.#deal(books, sides, perShelf);

    this.#rendered = faces.flat();
    this.#bookFont = getComputedStyle(this).getPropertyValue('--rack-book-font').trim()
      || 'Georgia, serif';
    this.style.setProperty('--bh', String(BOOK_SCALE[perShelf]));

    const showControls = this.getAttribute('controls') !== 'false';
    const label = this.getAttribute('label') || '';

    root.innerHTML = `
      <style>${STYLES}</style>
      <div class="wrap">
        <div class="hbudget" aria-hidden="true"></div>
        <div class="stage" tabindex="0" role="group"
             aria-roledescription="spinner rack"
             aria-label="${this.#esc(label ? `${label} spinner rack` : 'Book spinner rack')}. Drag it, or use the left and right arrow keys to turn it.">
          <div class="rack">
            <div class="lid"></div>
            ${faces.map((f, i) => this.#crownHTML(f, i, sides, label)).join('')}
            ${faces.map((f, i) => this.#faceHTML(f, i, sides, rows, perShelf)).join('')}
          </div>
        </div>
        <div class="floor"></div>
        ${showControls ? `
          <div class="controls">
            <button type="button" class="prev" aria-label="Turn rack left">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 4 7 12l8 8"/></svg>
            </button>
            <span class="count" aria-hidden="true"></span>
            <button type="button" class="next" aria-label="Turn rack right">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4l8 8-8 8"/></svg>
            </button>
          </div>` : ''}
        <p class="sr" aria-live="polite"></p>
      </div>`;

    this.#faces = [...root.querySelectorAll('.face')];
    this.#crowns = [...root.querySelectorAll('.crown-panel')];
    this.#front = -1;

    this.#measureCovers();
    this.#layout(sides);
    this.#wire(sides);
    this.#apply();
    this.#announce(sides);
    this.#maybeHint();
  }

  #crownHTML(faceBooks, i, sides, label) {
    // Each panel carries its own sign, like a rack whose sides have been given
    // over to different lists.
    //
    // The category is drawn exactly as the shop wrote it. Forcing sentence case
    // here would read "Uk history" and "Vintage classics" — lowercasing is
    // blind to acronyms and imprint names, and a shop's category list is full
    // of both. Casing belongs to whoever owns the data.
    const text = faceBooks[0]?.category || label || '';
    return `<div class="crown-panel" style="--fa:${(i * 360 / sides).toFixed(4)}deg" aria-hidden="true">
      <span>${this.#esc(text)}</span>
    </div>`;
  }

  #faceHTML(faceBooks, i, sides, rows, perShelf) {
    const shelves = [];
    for (let r = 0; r < rows; r++) shelves.push(faceBooks.slice(r * perShelf, (r + 1) * perShelf));
    return `<div class="face" style="--fa:${(i * 360 / sides).toFixed(4)}deg" data-face="${i}">
      ${shelves.map((s) => `
        <div class="shelf">
          ${s.map((b) => this.#bookHTML(b)).join('')}
          <div class="lip"></div>
        </div>`).join('')}
      <div class="shade"></div>
    </div>`;
  }

  #bookHTML(b) {
    const h = hash(b.title + b.author);
    // Hand-packed, not machine-stacked: a fraction of a degree of lean and a
    // few percent of height, both deterministic per title.
    const tilt = ((((h >> 3) % 100) / 100) - 0.5) * 1.6;
    const vary = (0.94 + ((h >> 9) % 13) / 100).toFixed(3);   // 0.94–1.06

    const art = b.cover
      ? `<img src="${this.#esc(b.cover)}" alt="" loading="lazy" decoding="async">`
      : this.#jacketHTML(b, h);
    const tf = titleFit(b.title, this.#bookFont);

    // A shop that already knows its cover dimensions can pass data-ar and skip
    // the reflow when the image arrives.
    const ar = clampAr(parseFloat(b.ar));
    const spoken = b.title + (b.author ? `, by ${b.author}` : '') + (b.price ? `, ${b.price}` : '');
    return `<a class="book" href="${this.#esc(b.href || '#')}"
       ${b.target ? `target="${this.#esc(b.target)}" rel="noopener"` : ''}
       style="--tilt:${tilt.toFixed(2)}deg"
       aria-label="${this.#esc(spoken)}">
      <div class="cover" style="--vary:${vary};--tf:${tf}${ar ? `;--ar:${ar}` : ''}">${art}</div>
    </a>`;
  }

  /**
   * Two jobs per cover image, both once it has actually resolved.
   *
   * On load: take the cover's real proportions from the image. Books given a
   * data-ar are already correct and are left alone, so a shop that ships
   * dimensions never sees the shelf reflow.
   *
   * On error: fall back to a generated jacket. A dead cover URL — a CDN
   * hiccup, a 404, a path typo — otherwise leaves a hole in the rack, which is
   * the exact thing the generated jackets exist to prevent. A missing image and
   * a broken one should look the same to a customer.
   */
  #measureCovers() {
    const links = [...this.shadowRoot.querySelectorAll('a.book')];
    links.forEach((link, i) => {
      const img = link.querySelector('.cover img');
      if (!img) return;
      const cover = img.closest('.cover');
      const book = this.#rendered[i];

      const measure = () => {
        if (cover.style.getPropertyValue('--ar')) return;
        const ar = clampAr(img.naturalWidth / img.naturalHeight);
        if (ar) cover.style.setProperty('--ar', ar);
      };
      const fallback = () => {
        if (!book) return;
        cover.style.removeProperty('--ar');       // back to paperback proportions
        cover.innerHTML = this.#jacketHTML(book, hash(book.title + book.author));
      };

      if (img.complete) {
        if (img.naturalWidth) measure();
        else fallback();                          // already failed before we got here
        return;
      }
      img.addEventListener('load', measure, { once: true });
      img.addEventListener('error', fallback, { once: true });
    });
  }

  /** A typographic cover, standing in for artwork that isn't there. */
  #jacketHTML(b, h) {
    const j = JACKETS[h % JACKETS.length];
    const title = this.#esc(b.title);
    const author = this.#esc(b.author);
    const skin = `background:${j.paper};color:${j.ink}`;

    switch ((h >> 17) % 3) {
      case 1:
        return `<div class="jacket j-v1" style="${skin}">
          <div class="j-band" style="background:${j.rule};color:${j.paper}">
            <div class="j-title">${title}</div>
          </div>
          <div class="j-author">${author}</div>
        </div>`;
      case 2:
        return `<div class="jacket j-v2" style="${skin}">
          <div></div>
          <div>
            <div class="j-hr" style="background:${j.rule}"></div>
            <div class="j-title">${title}</div>
            <div class="j-hr" style="background:${j.rule}"></div>
          </div>
          <div class="j-author">${author}</div>
        </div>`;
      default:
        return `<div class="jacket j-v0" style="${skin}">
          <div class="j-title">${title}</div>
          <div>
            <div class="j-rule" style="background:${j.rule}"></div>
            <div class="j-author">${author}</div>
          </div>
        </div>`;
    }
  }

  /**
   * Panel width, rotation radius and the shape of the cap. The rack sweeps a
   * circle wider than one panel — 2R across the corners — so it has to be
   * sized to its own footprint, or it clips on the way round.
   */
  #layout(sides) {
    const spread = 1 / Math.sin(Math.PI / sides);   // swept circle / panel width

    // Everything geometric follows from one number: the panel width.
    const apply = (faceW) => {
      const apothem = (faceW / 2) / Math.tan(Math.PI / sides);
      const R = (faceW / 2) / Math.sin(Math.PI / sides);
      const capScale = (apothem + CROWN_PROUD) / apothem;

      this.style.setProperty('--rack-perspective', `${PERSPECTIVE}px`);
      this.style.setProperty('--rack-origin-y', String(PERSPECTIVE_ORIGIN_Y));
      this.style.setProperty('--crown-proud', `${CROWN_PROUD}px`);
      this.style.setProperty('--face-w', `${faceW.toFixed(2)}px`);
      this.style.setProperty('--radius', `${apothem.toFixed(2)}px`);
      this.style.setProperty('--crown-w', `${(faceW * capScale).toFixed(2)}px`);
      this.style.setProperty('--lid-size', `${(R * 2 * capScale).toFixed(2)}px`);

      // Regular N-gon turned so an edge sits over each panel, not a vertex.
      const pts = Array.from({ length: sides }, (_, k) => {
        const phi = ((k + 0.5) * 2 * Math.PI) / sides;
        return `${(50 + 50 * Math.sin(phi)).toFixed(3)}% ${(50 + 50 * Math.cos(phi)).toFixed(3)}%`;
      });
      this.style.setProperty('--lid-clip', `polygon(${pts.join(',')})`);
      return R;
    };

    const fit = () => {
      const avail = this.clientWidth || 320;
      const max = parseFloat(getComputedStyle(this).getPropertyValue('--rack-max-width')) || 220;

      // Width first: the rack sweeps a circle wider than one panel, so it has
      // to be sized to its own footprint or it clips on the way round.
      const byWidth = Math.max(120, Math.min(max, (avail - 8) / spread));
      let R = apply(byWidth);

      // Then height. Covers divide the panel, so a rack sized only by width
      // gets TALLER on a narrow screen as the covers stay big — on a phone
      // that leaves you looking at two shelves of an 800px rack, unable to see
      // the thing you are meant to grab and turn. Measure what we just laid
      // out and scale the panel down if it overruns the budget.
      //
      // Always re-derived from byWidth, never from the corrected value, so
      // repeated resize callbacks land on the same answer instead of drifting.
      const rack = this.shadowRoot.querySelector('.rack');
      const budget = this.shadowRoot.querySelector('.hbudget')?.offsetHeight || 0;
      if (budget > 0) {
        // Height is not purely proportional to panel width — the shelf gaps are
        // fixed — so one scaling overshoots. A couple of passes close it.
        // Deterministic from byWidth and the budget, so repeated resize
        // callbacks land on the same answer instead of drifting.
        let faceW = byWidth;
        for (let i = 0; i < 3; i++) {
          const h = rack?.offsetHeight || 0;
          if (!h || h <= budget) break;
          faceW = Math.max(120, faceW * (budget / h) * 0.995);
          R = apply(faceW);
        }
      }

      // Reserve the overhang: the near bottom corner sits at z = +R, so it is
      // magnified by P/(P-R); applied to its distance below the vanishing
      // point, that is how far the rack paints past its own box.
      const finalH = rack?.offsetHeight || 0;
      if (finalH) {
        const drop = finalH * (1 - PERSPECTIVE_ORIGIN_Y);
        const overhang = (drop * R) / (PERSPECTIVE - R);
        // Plus real margin: the deepest painted pixel is a little below the
        // geometric corner, and 1px of clearance is not clearance.
        this.style.setProperty('--rack-clearance', `${Math.ceil(overhang + 18)}px`);
      }
    };

    fit();
    this.#resizeObserver?.disconnect();
    this.#resizeObserver = new ResizeObserver(fit);
    this.#resizeObserver.observe(this);
  }

  #wire(sides) {
    const root = this.shadowRoot;
    const stage = root.querySelector('.stage');
    const step = 360 / sides;

    stage.addEventListener('pointerdown', (e) => {
      if (e.button != null && e.button !== 0) return;
      this.#stopHint();
      this.#dragging = true;
      this.#pointerId = e.pointerId;
      this.#velocity = 0;
      this.#glideTarget = null;
      this.#samples = [{ t: performance.now(), a: this.#angle }];
      this.#dragX = e.clientX;
      this.#moved = 0;
      this.#swallowClick = false;
      // Remember what the press landed on. Pointer capture (below) retargets
      // the click to the stage, so by the time it fires, e.target no longer
      // knows which book was under the finger.
      stage.classList.add('dragging');
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', release);
      window.addEventListener('pointercancel', release);
      cancelAnimationFrame(this.#raf);
      this.#raf = 0;
    });

    const onMove = (e) => {
      if (!this.#dragging || e.pointerId !== this.#pointerId) return;
      const dx = e.clientX - this.#dragX;
      this.#dragX = e.clientX;
      this.#angle += dx * PHYSICS.DEG_PER_PX;
      this.#moved += Math.abs(dx);
      this.#samples.push({ t: performance.now(), a: this.#angle });
      if (this.#samples.length > 8) this.#samples.shift();
      this.#apply();
    };

    const release = (e) => {
      if (!this.#dragging || (e.pointerId != null && e.pointerId !== this.#pointerId)) return;
      this.#dragging = false;
      stage.classList.remove('dragging');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
      this.#velocity = this.#reduce ? 0 : this.#flickVelocity();
      // A drag that turned the rack must not also open whatever happened to be
      // under the finger when it stopped.
      this.#swallowClick = this.#moved > 6;
      this.#moved = 0;
      this.#start();
    };
    // Trackpad and shift-wheel. Only claim the gesture when it's clearly
    // horizontal, so the page still scrolls under an ordinary wheel.
    stage.addEventListener('wheel', (e) => {
      const dx = e.shiftKey ? e.deltaY : e.deltaX;
      if (Math.abs(dx) <= (e.shiftKey ? 0 : Math.abs(e.deltaY))) return;
      e.preventDefault();
      this.#stopHint();
      this.#glideTarget = null;
      this.#angle -= dx * PHYSICS.DEG_PER_PX * 0.9;
      this.#velocity = 0;
      this.#apply();
      clearTimeout(this.#wheelIdle);
      this.#wheelIdle = setTimeout(() => this.#start(), 90);
    }, { passive: false });

    stage.addEventListener('keydown', (e) => {
      const nudge = { ArrowLeft: 1, ArrowRight: -1, PageUp: 1, PageDown: -1 }[e.key];
      if (nudge) {
        e.preventDefault();
        this.#stopHint();
        this.#glideTo(Math.round(this.#angle / step) * step + nudge * step);
      } else if (e.key === 'Home') {
        e.preventDefault();
        this.#stopHint();
        this.#glideTo(0);
      }
    });

    root.querySelector('.prev')?.addEventListener('click', () => {
      this.#stopHint();
      this.#glideTo(Math.round(this.#angle / step) * step + step);
    });
    root.querySelector('.next')?.addEventListener('click', () => {
      this.#stopHint();
      this.#glideTo(Math.round(this.#angle / step) * step - step);
    });

    // Panels round the back are inert, so Tab walks the rack the way the eye
    // does. This catches the remaining case: focus arriving at a panel that's
    // only part-way round, which then has to be brought square on.
    root.addEventListener('focusin', (e) => {
      const face = e.target.closest?.('.face');
      if (!face) return;
      const target = -(+face.dataset.face) * step;
      if (Math.abs(shortestDelta(this.#angle, target)) > 1) {
        this.#glideTo(this.#angle + shortestDelta(this.#angle, target));
      }
    });

    root.addEventListener('click', (e) => {
      const link = e.target.closest?.('a.book');
      if (!link) return;
      if (this.#swallowClick) {
        e.preventDefault();
        this.#swallowClick = false;
        return;
      }
      const face = link.closest('.face');
      const index = [...root.querySelectorAll('a.book')].indexOf(link);
      const ok = this.dispatchEvent(new CustomEvent('rack-select', {
        detail: {
          book: this.#rendered[index] || null,
          index,
          face: face ? +face.dataset.face : -1,
          element: link,
        },
        bubbles: true,
        composed: true,
        cancelable: true,
      }));
      if (!ok) e.preventDefault();
    });
  }

  /**
   * Velocity over the last ~60ms rather than the last frame — one stuttered
   * frame at the moment of release shouldn't decide how far the rack travels.
   */
  #flickVelocity() {
    const s = this.#samples;
    if (s.length < 2) return 0;
    const now = s[s.length - 1];
    let ref = s[0];
    for (let i = s.length - 1; i >= 0; i--) {
      if (now.t - s[i].t >= 60) { ref = s[i]; break; }
    }
    const dt = (now.t - ref.t) / 1000;
    if (dt <= 0) return 0;
    return CLAMP((now.a - ref.a) / dt, -PHYSICS.MAX_FLICK, PHYSICS.MAX_FLICK);
  }

  #glideTo(target, instant = false) {
    if (instant || this.#reduce) {
      this.#angle = target;
      this.#glideTarget = null;
      this.#velocity = 0;
      this.#apply();
      this.#announce(this.#sides());
      return;
    }
    this.#glideTarget = target;
    this.#start();
  }

  #start() {
    if (this.#raf) return;
    this.#last = performance.now();
    this.#raf = requestAnimationFrame(this.#tick);
  }

  #park(sides) {
    this.#velocity = 0;
    this.#raf = 0;
    this.#apply();
    this.#announce(sides);
  }

  #tick = (now) => {
    const dt = Math.min(0.05, (now - this.#last) / 1000);
    this.#last = now;
    const sides = this.#sides();
    const step = 360 / sides;
    const snap = this.getAttribute('snap') === 'true';

    if (this.#glideTarget != null) {
      // A deliberate move — button, key, focus. Critically damped, no overshoot.
      const d = this.#glideTarget - this.#angle;
      this.#angle += d * (1 - Math.exp(-dt * 11));
      if (Math.abs(d) < 0.08) {
        this.#angle = this.#glideTarget;
        this.#glideTarget = null;
        this.#park(sides);
        return;
      }
    } else {
      let k = PHYSICS.DRAG_K;

      if (snap) {
        // The detent only bites once the rack is slow enough. Spin it hard and
        // it free-wheels straight past, exactly like a real ball-catch.
        const detent = Math.round(this.#angle / step) * step;
        const offset = detent - this.#angle;
        const grip = 1 - Math.min(1, Math.abs(this.#velocity) / PHYSICS.FREE_SPIN);
        this.#velocity += offset * PHYSICS.DETENT_K * grip * dt;
        k += PHYSICS.DETENT_DAMP * grip;

        if (Math.abs(this.#velocity) < PHYSICS.REST_SPEED && Math.abs(offset) < PHYSICS.REST_OFFSET) {
          this.#angle = detent;
          this.#park(sides);
          return;
        }
      } else if (Math.abs(this.#velocity) < PHYSICS.REST_SPEED) {
        this.#park(sides);
        return;
      }

      this.#angle += this.#velocity * dt;
      this.#velocity *= Math.exp(-k * dt);
    }

    this.#apply();
    this.#announce(sides);
    this.#raf = requestAnimationFrame(this.#tick);
  };

  /** One write per frame: the angle, plus how square-on each panel is. */
  #apply() {
    this.style.setProperty('--angle', `${this.#angle.toFixed(3)}deg`);
    const sides = this.#faces.length || 1;
    const active = this.shadowRoot.activeElement;
    for (let i = 0; i < this.#faces.length; i++) {
      const face = this.#faces[i];
      const rel = ((this.#angle + i * (360 / sides)) * Math.PI) / 180;
      const facing = Math.max(0, Math.cos(rel));
      face.style.setProperty('--facing', facing.toFixed(3));
      // Panels round the back take themselves out of the tab order — but never
      // the one holding focus, or the rack would throw focus to the body
      // mid-turn and lose the reader's place.
      const hide = facing < 0.35 && !(active && face.contains(active));
      if (face.inert !== hide) face.inert = hide;
    }
  }

  #announce(sides) {
    const step = 360 / sides;
    const i = ((Math.round(-this.#angle / step) % sides) + sides) % sides;
    if (i === this.#front) return;
    this.#front = i;

    const label = this.#crowns[i]?.textContent.trim() || `Panel ${i + 1}`;
    const count = this.shadowRoot.querySelector('.count');
    if (count) count.textContent = `${String(i + 1).padStart(2, '0')} / ${String(sides).padStart(2, '0')}`;
    const live = this.shadowRoot.querySelector('.sr');
    if (live) live.textContent = `${label}. Side ${i + 1} of ${sides}.`;

    this.dispatchEvent(new CustomEvent('rack-face', {
      detail: { face: i, label }, bubbles: true, composed: true,
    }));
  }

  /** One nudge, the first time it's seen, so it reads as something you turn. */
  #maybeHint() {
    if (this.#reduce || this.#hinted) return;
    const rack = this.shadowRoot.querySelector('.rack');
    this.#hintObserver?.disconnect();
    this.#hintObserver = new IntersectionObserver((entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        this.#hinted = true;
        rack.classList.add('hint');
        rack.addEventListener('animationend', () => rack.classList.remove('hint'), { once: true });
        this.#hintObserver.disconnect();
      }
    }, { threshold: 0.5 });
    this.#hintObserver.observe(this);
  }

  #stopHint() {
    this.#hinted = true;
    this.#hintObserver?.disconnect();
    this.shadowRoot.querySelector('.rack')?.classList.remove('hint');
  }

  #esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, (c) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }
}

if (!customElements.get('spinner-rack')) {
  customElements.define('spinner-rack', SpinnerRack);
}

export default SpinnerRack;
