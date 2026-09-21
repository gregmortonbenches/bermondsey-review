# `<spinner-rack>` — integration notes

For the developers who own the BigCommerce theme and the Searchspring profile.
Everything you need is on this page. `README.md` is the full reference if you
want it; `CLAUDE.md` is design reasoning and is **not** for you.

---

## What it is

A custom element that renders a list of product links as a four-sided spinner
rack you can flick with a thumb. One JavaScript file, no dependencies, no build
step. **73 KB raw, 24.8 KB gzipped as shipped; 13 KB if you run it through a
minifier** — the source carries about a quarter comments. It reads plain `<a>`
elements out of its own light DOM, so
**with the script blocked, failed or still loading the page shows a working list
of product links** — and crawlers see the same.

It ships to the **phone experience only**. Decide what desktop gets before you
put it live; a responsive page serves the same markup to everyone.

## What's in this folder

| File | |
|---|---|
| `spinner-rack.js` | **The component.** The only file that has to ship. |
| `INTEGRATION.md` | This page. |
| `README.md` | Full reference — every attribute, event and property. |
| `try-standalone.html` | Paste a catalogue export in, see it render, copy the markup out. Open it from your desktop; no server. |
| `demo.html`, `host-page.html` | Worked examples. `host-page.html` is the rack on a retail-shaped page. |
| `CLAUDE.md`, `build-try.mjs`, `covers/`, `books.sample.json` | Design notes, harness build script, stand-in artwork. Ignore. |

---

## The markup

```html
<spinner-rack label="New in" sides="4" per-shelf="2">
  <a href="/the-salt-path/"
     data-title="The Salt Path"
     data-author="Raynor Winn"
     data-cover="/product_images/salt-path-320w.jpg"
     data-category="Nature"
     data-category-href="/collections/nature/">The Salt Path</a>
  <!-- …23 more… -->
</spinner-rack>
```

**Per book** — only `href` and a title are required:

| | |
|---|---|
| `href` | Where the book goes. |
| `data-title` | Falls back to the link text. |
| `data-author` | |
| `data-cover` | Omit it and a typographic jacket is generated instead. |
| `data-category` | The first book on a panel names that panel's sign. |
| `data-category-href` | Makes that sign a link. See **Requirement 1**. |
| `data-ar` | Cover width ÷ height. Only for a title that isn't 2:3; skips a reflow. |
| `data-price` | Never displayed. Carried on the `rack-select` payload if you want it. |
| `data-review`, `data-source` | A pull quote and who wrote it. Unused at present. |

**On the element:**

| | Default | |
|---|---|---|
| `sides` | `4` | Panels, 3–8. |
| `per-shelf` | `2` | Books per shelf, 1–4. |
| `rows` | derived | Shelves per panel. Leave it alone — it sizes itself to the screen. |
| `label` | — | Sign text for panels with no `data-category`. |
| `snap` | off | `snap="true"` catches a facing square-on instead of free-wheeling. |
| `preview` | off | `preview="tap"` opens a card carrying `data-review`. |
| `pick-label` | `Guardian review` | Wording of the marker under a reviewed book. |
| `chrome` | — | `chrome="fixture"` draws painted steel. CSS-only attribute. |

**Capacity is `sides × rows × per-shelf`.** Anything past it isn't rendered.
24 titles is the measured optimum on a phone — 32 shrinks the covers by a third
and buys nothing.

---

## Where it goes

Three routes, and the choice is about **where the book list comes from**, not
whether the rack works. It works in all three.

| | Page Builder widget | Script Manager + widget | Theme template |
|---|---|---|---|
| Book list | hand-picked | hand-picked | from the catalogue |
| Stays current by itself | no | no | **yes** |
| Merchandiser can move it | **yes** | **yes** | no |
| Needs Stencil CLI | no | no | yes |

**Recommended shape — host the script once, let the widget hold only markup:**

1. Upload `spinner-rack.js` over WebDAV into `content/` (Settings → File
   access). It then serves from the storefront root as `/spinner-rack.js`.
2. One line in Script Manager, footer, scoped to the page you're trialling:
   ```html
   <script type="module" src="/spinner-rack.js"></script>
   ```
3. The HTML widget holds the `<spinner-rack>` block and nothing else.

> **Measured, and the reason for that shape:** a `<script>` inside a Page
> Builder HTML widget runs **only if the widget server-renders**. Scripts
> inserted via `innerHTML` never execute — that's the HTML spec, not a
> BigCommerce quirk. You don't get a broken page, you get the plain-links
> fallback. Putting the script on the page sidesteps the question.

From a theme template, reference it the normal Stencil way so it gets the CDN
and cache busting:

```handlebars
<script type="module" src="{{cdn 'assets/js/spinner-rack.js'}}"></script>
```

### From the catalogue

```handlebars
<spinner-rack label="{{category.name}}" sides="4" per-shelf="2">
  {{#each category.products}}
    <a href="{{url}}"
       data-title="{{name}}"
       data-author="{{brand.name}}"
       data-cover="{{getImageSrcset image 1x='320w'}}"
       data-category="{{../category.name}}"
       data-category-href="{{../category.url}}">{{name}}</a>
  {{/each}}
</spinner-rack>
```

`{{../category.url}}` is written from memory rather than checked — confirm the
property name against your theme's context before relying on it.

### From Searchspring

**Treat this paragraph as a hypothesis, not documentation.** `mappings.core`
carries `sku`, `name`, `url` and `thumbnailImageUrl`; everything else depends on
how your profile is mapped. That shape came from search results rather than the
Searchspring docs, which weren't reachable from where this was written — check
it against a real response before building on it.

One thing to watch either way: `thumbnailImageUrl` is a *thumbnail*. The rack
draws covers at 120–135 CSS px, so 240–320 device px, and a 200px thumbnail
looks soft at that size. You probably want the full image field.

---

## Three requirements on the data

**1. Group the feed by category.** Each panel's sign takes its text from the
first book on that panel, so an interleaved feed produces signs that misname
their own shelves. The sign becomes a link only where *every* book on the panel
shares its category — so a mixed panel degrades to plain text by itself rather
than sending a customer somewhere wrong. You get a worse rack, not a broken one,
but group the query and the problem doesn't exist.

**2. Ask for a width, not a box.** `getImageSrcset` takes descriptors like
`640w` or `2x`, and **with exactly one descriptor returns a single URL** rather
than a srcset — which is what `data-cover` wants. Use `1x='320w'`. A width-only
request provably preserves the source ratio; a `WxH` request may pad to fill,
which would put white borders round every jacket. See **Open questions**.

**3. Budget for the covers.** All four facings load on page load — they're
rotated out of view but still inside the viewport, so `loading="lazy"` does not
defer them. Measured on stand-in artwork, scaled to 24 covers:

| 24 covers at | total |
|---|---|
| 600w JPEG (a stock product image) | 1022 KB |
| 320w JPEG | 405 KB |
| 320w WebP | 201 KB |

Those samples are flat-colour illustrations and compress unusually well; expect
1.5–2× for real photographic jackets. The ratios are the reliable part.

---

## Styling

Set custom properties on the element. These are the ones that matter:

```css
spinner-rack {
  --rack-page: #ffffff;          /* REQUIRED: your actual page colour */
  --rack-max-width: 250px;       /* panel width; the rack sweeps ~1.41× this */
  --rack-accent: #bf3b7c;        /* focus rings, review marker */
  --rack-rule: rgba(0,0,0,0.16); /* hairline round each cover */
  --rack-cover-ratio: 0.649;     /* B-format. 0.6667 hardback, 0.636 A-format */
  --rack-book-font: Georgia, serif;
  --rack-crown-font: Georgia, serif;
  --rack-max-height: 80vh;       /* what stops a rack you can only see half of */
}
```

`--rack-page` is the one you must set — it's what a facing fades into as it
turns away, so it has to be your real page background. The default is `Canvas`,
which is only a guess.

**Give it the width.** A four-sided rack sweeps a circle about 1.41× the panel
width. Divide your container width by 1.41 to get `--rack-max-width`, or it
clips at the corners.

A web font loaded by the host page applies inside the shadow root with no extra
plumbing, so your own masthead serif arrives for free.

---

## Events

```js
rack.addEventListener('rack-face',   e => analytics.track('rack_panel_seen', e.detail));
rack.addEventListener('rack-select', e => analytics.track('rack_book_tapped', e.detail));
```

`rack-face` fires on every change of facing — `{face, label}`. `rack-select`
fires on a tap — `{book, index, face, element}` — and **is cancelable**: call
`preventDefault()` and the link won't navigate, which is the hook for a
quick-view. Leave it alone and it behaves as an ordinary link.

---

## Checking it worked

- With JavaScript disabled, the page still shows every product link.
- `document.querySelector('spinner-rack').shape` reports what it laid out —
  `{rows, perShelf, sides, capacity, rendered, dropped}`. **`dropped > 0` means
  stock past capacity isn't being shown.**
- Rotate the phone. Landscape reshapes to one shelf of four, capacity 16 — so a
  24-title rack drops 8 in landscape. Known and deliberate; decide whether you
  can live with it.
- Check the covers over a throttled connection, not on the office wifi.
- Check the panel signs name their own shelves. If they don't, the feed isn't
  grouped.

---

## Open questions — you can settle these, we couldn't

The BigCommerce and Searchspring docs, and `cdn11.bigcommerce.com`, were all
unreachable from the environment this was built in. These are the points that
depended on them:

1. **Does `getImageSrcset` with a `WxH` descriptor fit inside the box or pad to
   fill it?** Request the same image at `238w` and at `238x358` and compare the
   pixel dimensions. It decides whether the cover grid stays uniform.
2. **Is the Searchspring response shape above correct for your profile?**
3. **Does your image CDN already serve WebP by content negotiation?** If so,
   requirement 3 is half solved already.
