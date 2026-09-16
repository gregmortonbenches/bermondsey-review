# `<spinner-rack>`

An online version of the wire spinner rack that stands in the doorway of every
good bookshop. Four panels, shelves of paperbacks, a branded crown, and the
thing you actually came for: you push it and it keeps going.

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
| `label` | — | Fallback crown text. Each panel otherwise shows its own `data-category` |
| `snap` | off | `snap="true"` makes it catch a facing square-on instead of free-wheeling to a stop anywhere |
| `controls` | on | `controls="false"` hides the prev/next buttons |

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
| `data-ar` | | Cover width ÷ height. Optional — see below |

### Prices

Nothing draws the price on screen. It stays on each link's `aria-label`, so a
screen reader announces "Peterloo, by Robert Poole, £10.99", but a sighted
visitor only sees it after clicking through. If you want it visible, a strip
along the shelf lip is closer to the real fixture than an overlay on the
artwork.

### Cover proportions

Each book is sized from its cover's real proportions off a nominal height, so
an A-format, a B-format and the odd landscape photo book all shelve without
being cropped to a detail of themselves. If your feed serves covers at one
uniform size — which most do — every book simply comes out the same shape and
there's nothing to think about.

The ratio is measured off the image as it loads. Pass `data-ar` (width ÷
height) when you already know it and the shelf won't reflow when the image
lands. Anything outside 0.4–1.7 is treated as a broken asset and clamped,
rather than being allowed to wreck the shelf.

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
  --rack-metal: #16171b;        /* the frame */
  --rack-crown: #0e0f12;        /* the sign at the top */
  --rack-crown-ink: #fdfbf5;
  --rack-accent: #b8262b;       /* focus rings */
  --rack-max-width: 220px;      /* panel width; the rack sweeps ~1.41× this */
  --rack-display-font: "Helvetica Neue", Arial, sans-serif;
  --rack-book-font: Georgia, serif;
}
```

Web fonts loaded in the host page apply inside the shadow root, so
`--rack-display-font: "Your Grotesk"` works with no extra plumbing.

**Sizing.** A four-sided rack sweeps a circle about 1.41× the panel width, so
give it that much room or it clips as it turns. It sizes itself down to fit a
narrow container automatically.

---

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

**It's real 3D, not a slide carousel.** N flat panels on `preserve-3d` with
`backface-visibility: hidden`. The far side is genuinely hidden, panels
foreshorten as they turn, and the corner is a real corner. None of that is
reproducible by translating slides sideways.

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
