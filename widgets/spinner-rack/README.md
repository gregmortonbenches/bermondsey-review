# `<spinner-rack>`

The wire spinner rack from the doorway of a good bookshop, built *into* a page
rather than imitated on top of one. Four facings of covers on a turning drum:
you push it and it keeps going.

There is no painted steel, no riveted shelf lip and no illuminated sign — that
treatment reads as a photograph of a shop fitting pasted onto a page, which is
the opposite of belonging to one. What's left is the part that was actually
worth having: the turn. Rows are separated by space alone, signs are set in
your own type, and a facing turning away fades into the page's own colour
rather than darkening like an object. Each facing gives up half of `--rack-gap`
at each edge, so the gap across a corner matches the gap within a row and the
whole drum reads as one grid. (`chrome="fixture"` puts the steel back if you want
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

## Trying it with your own stock

Open **`try.html`** from your desktop. No server, no install, nothing uploaded
anywhere — it all stays in the tab.

1. **Paste your books.** One line each, tab- or comma-separated:
   `title · author · link · category · review · source · cover`. Only `title`
   is required, and trailing columns you don't need can be left off. A
   spreadsheet column that contains commas is fine — paste with tabs, or quote
   the field. `category` names the panel a book lands on, so four categories
   fill four facings.
2. **Add covers, either way.** Put a URL in the `cover` column, or drag the
   image files onto the page. Filenames are matched to titles loosely, so
   `the-salt-path.jpg`, `The Salt Path.png` and `salt path 9780241.jpeg` all
   find the same book. It says how many matched and names what didn't, which is
   usually a filename that doesn't resemble the title. Dropped files win over
   URLs, on the grounds that you dropped them more recently.
3. **Copy the markup.** Once it looks right, take the `<spinner-rack>` block
   and paste it into your own template. Dropped covers come out as `data:`
   URLs, so swap those for your real image paths on the way through.

**If the shop is already live, you need none of this.** Your covers are on a
CDN with public URLs, so paste those into the `cover` column and the rack
loads them straight from there.

**Links only work as full `https://` addresses** in a file opened from disk —
a path like `/books/x` has nothing to resolve against.

## Attributes

| Attribute | Default | What it does |
|---|---|---|
| `sides` | `4` | Panels round the rack, 3–8 |
| `per-shelf` | `2` | Books per shelf, 1–4 |
| `rows` | derived | Shelves per panel. Left alone, the rack is only as tall as the stock needs |
| `label` | — | Fallback crown text. Each panel otherwise shows its own `data-category`, drawn exactly as you wrote it — the rack never re-cases it, because lowercasing is blind to acronyms and imprint names ("UK History" would read "Uk history") |
| `snap` | off | `snap="true"` makes it catch a facing square-on instead of free-wheeling to a stop anywhere |
| `preview` | off | `preview="tap"` makes the first tap on a book open a shelf card with its review and a link through to the product |
| `pick-label` | `Guardian review` | What the marker under a reviewed book reads, where the book doesn't name its own source |
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
| `data-price` | | Carried on the `rack-select` payload for the host to use. The rack never draws or announces it — see below |
| `data-category` | | First book on a panel names that panel's crown |
| `data-ar` | | Cover width ÷ height. Only needed for a title that differs from `--rack-cover-ratio` |
| `data-review` | | A short quote from a review. Its presence is what marks a book and gives it a card — see below |
| `data-source` | | Who reviewed it, e.g. `Observer`. Overrides `pick-label` for this book |

### Prices

The rack shows no prices — not on the shelf, not on the card, and not on the
`aria-label` either, since announcing a price nothing displays would tell a
screen-reader user about a sighted view that doesn't exist. A spinner is for
browsing; the price belongs on the product page you land on.

`data-price` is still read and still travels on the `rack-select` payload, so a
host that wants it can put it in its own furniture without the rack changing.
If you do want it on the rack, a strip along the shelf lip is closer to the
real fixture than an overlay on the artwork.

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

## Methods and properties

```js
rack.goToFace(2);     // turn to panel 2, smoothly
rack.spin(900);       // give it a shove — decelerates like a flick
rack.books = [...];   // set the stock instead of using light-DOM children

rack.angle;           // how far round it is, in degrees — live
rack.angle = -45;     // put it there at once, stopping whatever it was doing
```

`angle` is the real state, read straight off the physics. Don't reach for the
`--angle` custom property for either job: it is written only when the rack
comes to rest, and the drum's own transform overrides it, so setting it from
outside moves nothing. That trap is not hypothetical — two of the test suites
here drove the rack that way, and when the animation path changed they
silently swept nothing and kept reporting "pass".

---

## Styling

Set custom properties on the element:

```css
spinner-rack {
  --rack-cover-ratio: 0.6667;    /* standard hardback (2:3) */
  --rack-rule: rgba(0,0,0,0.16); /* hairline round each cover */
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

## The shelf card

`preview="tap"` gives a card to each book carrying a `data-review` — the quote
and a link onward to the product.

**Only reviewed books get one.** A book with no note has nothing a card could
add beyond the cover already on screen, so it taps straight through to the
product. Which means those books have to be *visible before you tap*, or the
differing behaviour is arbitrary: `data-review` puts a quiet "Guardian review"
under that book's cover, in the accent colour. That is the one place besides
focus rings where the accent earns its keep, because it is carrying
information rather than decorating.

The demo's notes are placeholder copy written for the mock, not real review
extracts — swap in your own before this goes anywhere public.

**The wording is data, not a constant.** A shop quotes whoever reviewed the
book, so a rack that says "Guardian review" under all of them is asserting
something untrue. `data-source` on a book names its own paper; `pick-label`
changes the rack's default for books that don't. The default is only a default.

The card repeats the attribution under the quote, because a note on a card with
no source reads as the shop's own voice while the shelf beside it names a paper.

The marker goes under the cover, not on it. Overlaying somebody's artwork is
the objection that removed the badges, and it applies just as much to a
review as to a "Signed" flash. It is out of flow, so a marked book occupies
exactly the height of a plain one and the facing's geometry doesn't shift with
how many reviews a category happens to have. The row gap is derived from the
marker's own type size (`--tick-band`) rather than set to a number, so the
marker can't end up sitting on the cover below it.

**Tap, not hover.** There is no hover on a phone, so a hover-only preview
would fire for nobody. Tap already had a job, so the card takes the first tap
and carries the real link inside it — an extra step on the way to the basket,
which is the right trade on a surface built for browsing rather than
beelining. Where a pointer exists, hover previews the card as well, after a
150ms delay so sweeping across the rack doesn't strobe. That costs nothing and
helps nobody on the target device.

**The card belongs to the facing, not the page.** It sits in the facing's
plane, turns with it, and fades with it — because in a shop the recommendation
is a card on the shelf, not a modal over the whole room. It anchors to whichever
half of the facing the tapped book *isn't* in, so the cover you just tapped
stays visible beside what is being said about it.

Dismissed by the close button, Escape, tapping another book, grabbing the rack,
or turning to another facing. A press that starts *inside* the card is the
reader using it, so it neither turns the rack nor closes the card.

## Weight, and what it costs a page

Measured, not estimated. Numbers from Chromium at 390×844, CPU throttled to
stand in for a phone.

| | raw | gzipped |
|---|---|---|
| source, as shipped (38% comments) | 65 KB | 22 KB |
| minified (esbuild) | 36 KB | **12.7 KB** |

Zero dependencies, no build step. For scale, that is less than any one of the
sample cover images (19–45 KB each).

| | desktop | CPU 4× slower | CPU 6× slower |
|---|---|---|---|
| Component's own init | 30 ms | 86 ms | 145 ms |
| Spinning | 60 fps | 60 fps | 60 fps |
| Tap → card | 7 ms | 21 ms | 30 ms |
| Script while idle | none — the loop parks | | |

- **Cumulative layout shift: 0.** The rack sizes itself before it paints.
- **Not render-blocking.** `type="module"` is deferred; measured against the
  same page with the script removed, first paint was unchanged.
- **Nothing runs when nobody is touching it.** Zero `requestAnimationFrame`
  calls over two seconds at rest.
- **All 239 nodes are inside the shadow root**, so the host page's DOM is
  untouched and neither stylesheet can reach the other. That is the main reason
  this is safe to drop into a themed store.

### The images cost more than the widget

`loading="lazy"` does **not** defer the facings turned away — they are rotated
out of view but still inside the viewport, so all of them fetch on load. Covers
render at about **119 × 179 CSS px**, so 238 × 358 covers a 2× screen; a
standard 600 × 900 product image is **6.3× more pixels than needed**. At
twenty-four of them that is the difference between roughly 1–2 MB and 400–600 KB.

If the rack sits below the fold, gate its render on an `IntersectionObserver`
so neither the images nor the init cost land during page load.

### Keeping 60 fps

Nothing in the per-frame path writes a custom property. Writing one invalidates
style for everything that inherits it, so an earlier version — `--angle` on the
host, `--facing` on each facing — recalculated the whole shadow tree every
frame and dropped to 30 fps the moment it moved on a throttled CPU, while
holding 60 sitting still. A transform on the drum and an opacity on each shade
touch one element each and stay off the style path. The shade opacity is
quantised to 1%, below which the change is invisible and the write is skipped.

If you extend the animation, keep that rule: **transform and opacity on single
elements, never a custom property.**

## Content-Security-Policy

Works under a strict policy — `style-src 'self'` with no `unsafe-inline` —
because nothing it needs arrives as inline style:

- the stylesheet is built with `new CSSStyleSheet()` and handed over through
  `adoptedStyleSheets`, which is CSSOM and so outside `style-src`. One sheet is
  shared by every rack on the page. Where constructable sheets are missing
  (Safari before 16.4) it falls back to a `<style>` element, which a strict
  policy will refuse — no worse than before, but worth knowing.
- per-element numbers (panel angles, cover ratios, jacket colours) are carried
  as `data-*` in the markup and applied with `el.style.setProperty()` after
  insertion. A style *attribute* that arrived as markup is refused; a property
  set from script is not.

Verified on a host page carrying no inline style or script of its own: zero
violations, correct geometry, turns normally. Before this, the shadow
stylesheet was refused outright — 19,077 characters of CSS, 0 rules applied —
and the rack rendered as a column of full-bleed unstyled covers. Every link
still worked, but it looked broken.

BigCommerce Stencil themes don't ship a strict CSP by default, so this may
never come up. It is the one thing that would have made the widget unusable
rather than merely slower.

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

- **No buttons, no counter.** Swiping is the gesture, the one-time nudge
  advertises it, and the facing's own heading says which one you are looking
  at — a counter only repeated that. Nothing about keyboard or screen-reader
  access depended on them.
- **Keyboard:** the rack is a focus stop; ← → turn one panel, Home returns to
  the front, and Tab walks the books on the panel facing you. Panels round the
  back are `inert`, so focus never disappears behind the rack — except for a
  panel that currently holds focus, which stays reachable while it turns.
- **Screen readers:** the panel and its category are announced through a live
  region on every turn. Each book is a real link labelled with its title and
  author — the same information the shelf shows, and nothing it doesn't.
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

## BigCommerce + Searchspring

### Getting the script onto the page

Two routes, and the choice decides whether the rack is crawlable:

| | Theme file | Script Manager |
|---|---|---|
| Where | `assets/js/spinner-rack.js` + an edit to a template | Storefront → Script Manager |
| Book list from | Handlebars, server-rendered | a JS call only |
| Crawlable links | yes | no |
| Survives a theme update | only if you carry the change | yes |
| Needs Stencil CLI | yes | no |

**Use the theme file.** The whole progressive-enhancement design rests on the
`<a>` list being in the HTML: with the script blocked, slow or broken you still
have twenty-four working product links, and a crawler sees the stock. Script
Manager can only populate the rack after a fetch, which throws that away.

Reference the asset the normal Stencil way so it gets the CDN and cache
busting:

```handlebars
<script type="module" src="{{cdn 'assets/js/spinner-rack.js'}}"></script>
```

### The markup

The light-DOM form maps straight onto a Stencil template — this is the case it
was designed for:

```handlebars
<spinner-rack label="{{category.name}}" sides="4" per-shelf="2" preview="tap">
  {{#each category.products}}
    <a href="{{url}}"
       data-title="{{name}}"
       data-author="{{brand.name}}"
       data-cover="{{getImageSrcset image 1x='320w'}}"
       data-price="{{price.without_tax.formatted}}"
       data-category="{{../category.name}}">{{name}}</a>
  {{/each}}
</spinner-rack>
```

`data-review` and `data-source` have no native home in the catalogue. Either
put them in a product custom field and read `{{#each custom_fields}}`, or hold
the notes in the template — there are only ever a handful.

### Covers: ask for a width, not a box

`getImageSrcset` takes size descriptors of the form `640w` or `2x`, and with
exactly **one** descriptor it returns a single URL rather than a srcset — which
is what `data-cover` wants. (`getImage image 'product_size'` also works, but it
resolves the name against the theme's `config.json` and clamps to
`Math.min(image.width, requested)`, so what you get depends on theme settings
you may not control.)

Ask for a **width only**. A width-only descriptor preserves the source's own
aspect ratio, so you know what you are getting. Whether a `WxH` request fits
inside that box or pads to fill it is not something the public docs state
plainly, and it decides whether the grid stays uniform — so don't rely on it.

Sizing follows from the measurement in *Weight*: covers render at about
119 × 179 CSS px, so **238w covers a 2× screen and 320w covers 2.7×**. A stock
600 × 900 product image is 6.3× more pixels than needed at 2×; at twenty-four
covers that is the difference between roughly 1–2 MB and 400–600 KB.

If your covers are already uniform 2:3 — most publisher artwork is — the grid
comes out uniform on its own. Where ratios vary, the rack measures each cover
and shelves it correctly anyway; you just lose the even grid rather than
breaking anything.

### Searchspring on top

Searchspring is the opposite shape: recommendations arrive as JSON from a
client-side call, so they go through the `books` property.

**Use both.** Server-render a default set into the light DOM and replace it when
Searchspring answers:

```js
customElements.whenDefined('spinner-rack').then(async () => {
  const rack = document.querySelector('spinner-rack');   // already painted, already crawlable
  const res = await fetch(recommendationsUrl);           // siteId + profile tag
  const [profile] = await res.json();                    // one entry per requested profile

  rack.books = profile.results.slice(0, 24).map((p) => ({
    href:   p.mappings.core.url,
    title:  p.mappings.core.name,
    author: p.mappings.core.brand,
    cover:  p.mappings.core.thumbnailImageUrl,
    price:  p.mappings.core.price,
    category: 'Recommended for you',
  }));
});
```

`mappings.core` carries `sku`, `name`, `url` and `thumbnailImageUrl`; the rest
depends on how your profile is mapped, so check yours rather than trusting the
field names above.

The `whenDefined` wrapper matters — see *Framework notes*. Assigning `.books`
before the module has loaded used to write an own property that shadowed the
accessor permanently, so the first assignment worked and every one after it
silently did nothing. The component recovers from that now, but waiting is the
cleaner shape and this is exactly the code path that hit it.

### Four things to get right

- **Ask for the same number of titles you server-rendered.** Setting `books`
  re-renders, and a different count can change the shelf count, so the rack
  visibly re-lays out under the reader.
- **All the covers load up front.** `loading="lazy"` does not defer the facings
  turned away — they are rotated out of view but still inside the viewport. If
  the rack is below the fold, gate its render on an `IntersectionObserver`.
- **Check your CSP if you have one.** The rack is clean under
  `style-src 'self'` (see *Content-Security-Policy*), but a Stencil theme that
  sets one will also need to allow whatever else you are injecting.
- **`thumbnailImageUrl` is a thumbnail.** At 238–320px wide a 200px thumbnail
  will look soft. Take the width off the product image rather than the
  thumbnail field if Searchspring gives you both.

### Not verified here

`developer.bigcommerce.com`, `docs.bigcommerce.com`, the Searchspring docs and
`cdn11.bigcommerce.com` are all blocked from the machine this was written on,
so the `WxH` fit-versus-pad question above is unresolved and the Searchspring
response shape comes from secondary sources. The helper signatures are taken
from the `paper-handlebars` source itself. You can settle the image question in
a minute against your own catalogue: request the same image at `238w` and at
`238x358` and compare the pixel dimensions you get back.

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

### Assigning `.books` before the module loads

`<script type="module">` is deferred, so an inline script that runs earlier and
does `el.books = data` writes an **own property** onto the element. Once the
element upgrades, that own property shadows the class's accessor: the first
render picks the data up, so it looks like it worked, and every assignment
after it silently does nothing.

The component recovers from this — on upgrade it adopts the value and deletes
the property — but the cleaner shape is to wait:

```js
customElements.whenDefined('spinner-rack').then(() => { el.books = data; });
```

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

**A test that cannot fail is worse than no test.** Two suites here drove the
rack by setting the `--angle` custom property; when the animation path changed
to a transform on the drum, both silently swept nothing and kept passing. If
you add a suite that asserts something visual, sabotage the thing it guards
once and check it actually goes red — that is how the crown show-through check
earned its keep (transparent cap → 3.1% show-through, failure).

Frame rate has to be measured against a baseline, not in isolation. Under CPU
throttling a bare `requestAnimationFrame` loop can sit at 30 fps for reasons
that have nothing to do with the code under test, so compare the rack spinning
against the same page with the rack at rest. The same goes for long tasks: this
page's own load work produced a 116–124 ms task with the widget's script
removed entirely.
