# `<spinner-rack>`

The wire spinner rack from the doorway of a good bookshop, built *into* a page
rather than imitated on top of one. Four facings of covers on a turning drum:
you push it and it keeps going.

There is no painted steel, no riveted shelf lip and no illuminated sign — that
treatment reads as a photograph of a shop fitting pasted onto a page, which is
the opposite of belonging to one. What's left is the part that was actually
worth having: the turn. Shelves are hairline rules, signs are set in your own
type, and a facing turning away fades into the page's own colour rather than
darkening like an object. (`chrome="fixture"` puts the steel back if you want
it — see below.)

![the rack, mid-turn](docs/corner.png)

**Standalone.** This is not part of the Bermondsey Review site and is not bound
by the design direction in the repo's root `CLAUDE.md`. It imports nothing,
touches no global styles, and has no build step. Drop it into any shop front
end — plain HTML, Shopify/Liquid, WooCommerce, Next, whatever.

---

## Use it

```html
<script type="module" src="spinner-rack.js"></script>

<spinner-rack label="Picador" sides="4" per-shelf="2">
  <a href="/books/peterloo"
     data-title="Peterloo"
     data-author="Robert Poole"
     data-cover="/covers/peterloo.jpg"
     data-price="£10.99"
     data-category="History">Peterloo</a>
  <!-- …twenty-odd more… -->
</spinner-rack>
```

That's it. No init call, no config object.

### Why the books are plain `<a>` elements

Because with the script switched off — blocked, failed, still loading, or a
crawler looking — the custom element stays undefined, no shadow root is
attached, and the page renders a list of working product links. The rack is
pure enhancement on top of markup that already did the job. It also means your
stock stays indexable, which a JSON-fed carousel throws away.

Style the fallback if you like:

```css
spinner-rack:not(:defined) { display: block; }
spinner-rack:not(:defined) a { display: block; padding: 2px 0; }
```

### Or drive it from JavaScript

```js
document.querySelector('spinner-rack').books = [
  { title: 'Peterloo', author: 'Robert Poole', href: '/books/peterloo',
    cover: '/covers/peterloo.jpg', price: '£10.99', category: 'History' },
];
```

Setting `.books` re-renders and takes precedence over the light DOM. Handy in a
SPA, but you give up the no-JS fallback, so prefer the markup form where the
server can render it.

---

## Attributes

| Attribute | Default | What it does |
|---|---|---|
| `sides` | `4` | Panels round the rack, 3–8 |
| `per-shelf` | `2` | Books per shelf, 1–4 |
| `rows` | derived | Shelves per panel. Left alone, the rack is only as tall as the stock needs |
| `label` | — | Fallback crown text. Each panel otherwise shows its own `data-category`, drawn exactly as you wrote it — the rack never re-cases it, because lowercasing is blind to acronyms and imprint names ("UK History" would read "Uk history") |
| `snap` | off | `snap="true"` makes it catch a facing square-on instead of free-wheeling to a stop anywhere |
| `controls` | on | `controls="false"` hides the prev/next buttons |
| `chrome` | none | `chrome="fixture"` draws it as a painted-steel shop fitting: riveted shelf lips, an illuminated sign, books casting shadows |

### Sizing it for a phone

Measured at 390×844, four facings, two per shelf:

| Titles | Panel | Cover | Shelves | Rack height |
|---|---|---|---|---|
| 32 | 190px | 90×124 | 4 | 672px |
| **24** | **252px** | **121×167** | **3** | **674px** |
| 16 | 270px | 130×179 | 2 | 503px |

**24 titles is the optimum.** On a phone the binding constraint is *height*, not
width — so capacity trades directly against cover size. At 32 titles the rack
needs a fourth shelf and the panel is squeezed to 190px; at 24 it uses the same
screen height with covers a third bigger. Below 24 the constraint flips back to
width and the extra height goes unused.

Two things follow from height being the constraint. Giving the rack the page's
side gutters buys nothing at 32 titles (the panel stays at 190px either way),
though it is worth having once you are at 24. And `--rack-max-width` only bites
when there is height to spare.

**Capacity is `sides × rows × per-shelf`,** and `rows` is capped at 7 so a big
feed can't produce a skyscraper. Anything past capacity isn't rendered — a
spinner is a browsing surface, not a catalogue. 24–40 books suits a four-sided
rack; the stock is dealt out balanced, so six books give you 2/2/1/1 rather
than 4/2/0/0 and two bare panels.

## Book data

| Attribute | Required | Notes |
|---|---|---|
| `href` | yes | Where the book goes |
| `data-title` | yes | Falls back to the link text |
| `data-author` | | |
| `data-cover` | | Omit it and a typographic jacket is generated — see below |
| `data-price` | | Announced on the link. Nothing draws it on screen — see below |
| `data-category` | | First book on a panel names that panel's crown |
| `data-ar` | | Cover width ÷ height. Only needed for a title that differs from `--rack-cover-ratio` |

### Prices

Nothing draws the price on screen. It stays on each link's `aria-label`, so a
screen reader announces "Peterloo, by Robert Poole, £10.99", but a sighted
visitor only sees it after clicking through. If you want it visible, a strip
along the shelf lip is closer to the real fixture than an overlay on the
artwork.

### Cover proportions

Every book takes `--rack-cover-ratio`, which defaults to **0.6667 — standard
hardback, 156 × 234 mm, exactly 2:3.** A feed that serves covers at one uniform
size therefore comes out as a clean grid with nothing to configure. Paperback
lists want `0.649` (B-format) or `0.636` (A-format).

The default is written to four places deliberately: it's what the measuring
pass reports for a 2:3 image, so a generated jacket and a real cover land on
the same box to the pixel rather than differing by a hair.

A book whose cover genuinely differs is still handled. The ratio is measured
off the image as it loads, so a landscape photo book sits shorter in its column
rather than being cropped to a detail of itself; pass `data-ar` (width ÷
height) to skip the reflow when you already know. Anything outside 0.4–1.7 is
treated as a broken asset and clamped rather than allowed to wreck the shelf.

One thing to watch if your covers are normalised to a fixed canvas: whatever
padding that leaves around the jacket is part of the image, so a white-padded
canvas shelves as a white-bordered book against the dark rack. Transparent
padding, or a canvas matched to `--rack-metal`, avoids it.

### Missing cover images

Shops always have a few — a pre-order with no artwork yet, a backlist reissue
nobody scanned. An empty grey box in a rack of colour reads as broken, so
books without `data-cover` get a generated jacket instead. So do books whose
cover URL fails to load — a 404, a CDN hiccup, a path typo — because a missing
cover and a broken one should look the same to a customer.

A jacket is one of twelve ink/paper pairs and one of three layouts, picked by a
hash of the title, so a given book always looks the same. The type is sized to the longest word in the
title by measuring the actual font on a canvas, so nothing comes out as
`OLIGARC / HY`.

---

## Events

```js
rack.addEventListener('rack-select', (e) => {
  e.preventDefault();               // cancel navigation, open a quick-view
  openQuickView(e.detail.book);     // {book, index, face, element}
});

rack.addEventListener('rack-face', (e) => {
  analytics.track('rack_panel_seen', e.detail);   // {face, label}
});
```

`rack-select` is cancelable. Leave it alone and the link navigates as normal.

## Methods

```js
rack.goToFace(2);     // turn to panel 2
rack.spin(900);       // give it a shove — decelerates like a flick
```

---

## Styling

Set custom properties on the element:

```css
spinner-rack {
  --rack-cover-ratio: 0.6667;    /* standard hardback (2:3) */
  --rack-rule: rgba(0,0,0,0.16); /* shelf rules and cover edges */
  --rack-page: #f4f1ea;          /* YOUR page colour — facings fade into it */
  --rack-accent: #b8262b;        /* focus rings */
  --rack-max-width: 220px;      /* panel width; the rack sweeps ~1.41× this */
  --rack-display-font: "Helvetica Neue", Arial, sans-serif;   /* controls */
  --rack-book-font: Georgia, serif;                           /* generated jackets */
  --rack-crown-font: Georgia, serif;                          /* the sign */
}
```

Web fonts loaded in the host page apply inside the shadow root, so
`--rack-display-font: "Your Grotesk"` works with no extra plumbing.

`--rack-page` is the one you must set: it is what a facing fades into as it
turns away, so it has to be your actual page background. The default is
`Canvas`, which is only a guess.

**`--rack-max-height` (default `80vh`)** is what keeps it usable on a phone.
Covers divide the panel, so a narrow screen doesn't make the rack narrower — it
makes it *taller*, and a rack you can only see two shelves of is a rack you
can't browse. The layout pass measures what it just laid out and scales the
panel down until the whole thing fits. Set it to `none` to let the rack run to
whatever height its stock needs.

**Sizing.** A four-sided rack sweeps a circle about 1.41× the panel width, so
give it that much room or it clips as it turns. It sizes itself down to fit
both a narrow container and `--rack-max-height`. Covers divide the panel
evenly, so `--rack-max-width` is the dial for how big they get when there's
room.

### `chrome="fixture"`

The original treatment, kept because it works: steel panels, riveted shelf
lips, an illuminated sign, books with drop shadows leaning slightly in their
pockets. It needs `--rack-metal`, `--rack-crown` and `--rack-crown-ink`, and it
wants a dark ground to sit on.

---

## On mobile

- **`--rack-max-height` resolves through `dvh`** where supported. On iOS `vh`
  means the viewport with the URL bar hidden, so a `vh` budget can be taller
  than what is actually on screen — the exact failure the budget exists to
  prevent.
- **Hover is behind `@media (hover: hover)`.** Left unguarded, `:hover` sticks
  after a tap and the book you last touched stays dimmed.
- **Controls are 44px**, a thumb target rather than a cursor target.
- **A half-screen thumb swipe coasts about 1.4 facings** at the default
  gearing, because the free-wheel inertia carries it well past where your
  finger let go. A slow drag with no flick in it turns about 54° for 200px and
  stops there, mid-corner — which is what free-wheeling means.

## Accessibility

- **Keyboard:** the rack is a focus stop; ← → turn one panel, Home returns to
  the front, and Tab walks the books on the panel facing you. Panels round the
  back are `inert`, so focus never disappears behind the rack — except for a
  panel that currently holds focus, which stays reachable while it turns.
- **Screen readers:** the panel and its category are announced through a live
  region on every turn. Each book is a real link labelled with title, author
  and price.
- **`prefers-reduced-motion`:** no inertia, no attention nudge; turns are
  instant. It's still a rack, it just doesn't spin.
- **Pointer:** `touch-action: pan-y`, so a vertical swipe scrolls the page and
  only a horizontal one turns the rack. A drag that moved the rack swallows the
  click, so you never open a book you were only spinning past.
- **Clicks stay native.** A drag is tracked with `pointermove` on the window
  rather than `setPointerCapture`, because capture retargets the click to the
  rack and the browser then has no link to follow — a real mouse click would do
  nothing. Tracking on the window keeps a drag alive outside the rack while
  leaving clicks entirely to the browser, so middle-click and cmd/ctrl-click to
  open in a new tab keep working.

## Framework notes

**React** — custom elements work, but `books` is a property, not an attribute:

```jsx
const ref = useRef(null);
useEffect(() => { ref.current.books = books; }, [books]);
useEffect(() => {
  const el = ref.current;
  const onSelect = (e) => { e.preventDefault(); setQuickView(e.detail.book); };
  el.addEventListener('rack-select', onSelect);
  return () => el.removeEventListener('rack-select', onSelect);
}, []);
return <spinner-rack ref={ref} label="Picador" />;
```

Better still, render the `<a>` children from your product data as JSX and let
the rack read them — then it server-renders and you keep the fallback.

**Next.js** — `import 'spinner-rack.js'` inside a `'use client'` component, or
`<Script type="module" src="/spinner-rack.js" />`. The element upgrades
whenever the module lands; markup rendered before then is the fallback list,
which is the point.

**Shopify** — loop a collection into the `<a>` children in Liquid and load the
script with `defer`.

---

## How the turning works

Two things worth knowing if you tune it (constants live in `PHYSICS` at the top
of the file):

**It's real 3D, not a slide carousel.** N flat panels turned on a drum inside
`preserve-3d`. The far side is genuinely hidden, panels foreshorten as they
turn, and the corner is a real corner. None of that is reproducible by
translating slides sideways.

Each facing is deliberately `transform-style: flat` — one rotated plane of
ordinary content — so `backface-visibility: hidden` on it hides the whole
facing at once. In `preserve-3d` every shelf, book and cover sits in the shared
3D space and shows its own backface, so the rear facings render *mirrored*; the
fixture's opaque panels were only occluding them. Don't put
`backface-visibility` on the shelves or books to fix that either — it makes
them their own composited surfaces and hit-testing resolves there, so clicks
stop reaching the books.

**It free-wheels by default,** coasting to a stop wherever it runs out, like
the real fixture — including at rest on a corner, showing two half-facings.

**`snap="true"` adds a detent that only bites once the rack has slowed** — like
the ball-catch in a real rack's base. Above `FREE_SPIN` (300°/s) a facing has no
grip at all, so a hard flick free-wheels through several turns before anything
catches; below it, the pull ramps in and lands the rack square.

Release velocity is measured over ~60ms rather than the last frame, so one
stuttered frame at the moment you let go doesn't decide how far it travels.

---

## Testing

`demo.html` is a working integration example — open it over any static server:

```sh
npx http-server -p 8899 .
```

It covers the light-DOM form, the no-JS fallback, and a cancelled
`rack-select` wired to a quick-view.
