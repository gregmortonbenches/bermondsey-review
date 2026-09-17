# CLAUDE.md — `<spinner-rack>`

Working notes for whoever changes this next. `README.md` is the reference for
*using* the component; this file is why it is the way it is, what was measured
rather than guessed, and the traps that cost time once already.

## Scope

**This widget is standalone.** It is not part of the Bermondsey Review site and
is **not** bound by the design direction in the repo's root `CLAUDE.md` — no
NYRA/Fence house style, no `river`/`brick` palette. It lives in this repo
because that is where the work happened. It imports nothing, has no build step,
and is meant to drop into any shop front end.

Everything it needs is one file: `spinner-rack.js`.

---

## Settled — don't re-open without asking

These were decided deliberately, several after being tried the other way. If a
change would reverse one, that is a conversation, not a cleanup.

| Decision | Why |
|---|---|
| **No chrome by default** | Painted steel, riveted lips and an illuminated sign read as a photograph of a shop fitting pasted onto a page, which is the opposite of belonging to one. `chrome="fixture"` keeps it for anyone who wants it. |
| **Free-wheel, no snap** | It coasts to a stop wherever it runs out, including at rest on a corner showing two half-facings — like the real fixture. `snap="true"` opts into a detent. |
| **Four facings, two per shelf, 24 titles** | Measured, see below. |
| **No prev/next, no "01 / 04" counter** | Swiping is the gesture, the one-off nudge advertises it, and the facing's heading says where you are. The counter only repeated that. |
| **No badges on covers** | Overlaying somebody's artwork is the objection; it applies to a "Signed" flash and to a recommendation alike. |
| **No prices anywhere** | Not on the shelf, not on the card, and not on the `aria-label` either — announcing a price nothing displays would describe a sighted view that doesn't exist. `data-price` is still read and still travels on `rack-select`. |
| **The review marker is a label under the cover** | "Guardian review" in the accent colour, out of flow so a marked book is exactly as tall as a plain one. A richer version that printed the pull quote on the shelf was built and rejected — see *Tried and rejected*. |
| **Category in the author's own casing** | Forcing sentence case gives "Uk history" and "Vintage classics". Casing belongs to whoever owns the data. |
| **Georgia for the sign and the jackets** | Set through `--rack-crown-font` / `--rack-book-font`; the host can change both. |

### Tried and rejected

**The shelf-talker.** The marker carried the pull quote itself (*"Nothing else
comes close" — Guardian*), the cover always navigated, and the quote was its
own button opening the full extract. It fixed real problems — the label names a
destination it can't reach, and two identical-looking covers behaved
differently — and it was rejected on sight. If those problems come up again,
the objection was to the look, not the analysis. Reverted in `30334a7`; the
implementation is in `ae6d339` if it is ever wanted back.

---

## Measured, not guessed

Re-measure rather than trusting these if the layout changes; they are outputs,
not inputs.

**Phone sizing** at 390×844, four facings, two per shelf, `--rack-max-width: 320px`:

| Titles | Panel | Cover | Shelves | Rack height |
|---|---|---|---|---|
| 16 | 270px | 125×188 | 2 | 519px |
| **24** | **245px** | **113×169** | **3** | **671px** |
| 32 | 190px | 85×127 | 4 | 674px |

**24 is the optimum.** On a phone the binding constraint is *height*, not
width, so capacity trades directly against cover size. 32 titles needs a fourth
shelf and squeezes the panel to 190px for the same screen height; 24 uses that
height with covers a third bigger. Below 24 the constraint flips back to width
and the spare height goes unused. Two things follow: giving the rack the page's
side gutters buys nothing at 32 titles, and `--rack-max-width` only bites when
there is height to spare.

**Gearing.** At the default 0.27°/px a half-screen thumb swipe coasts about 1.4
facings. A slow drag with no flick in it turns about 54° per 200px and stops
mid-corner — which is what free-wheeling means.

**Weight.** ~600 lines of JavaScript and ~550 of CSS in one file. 13 KB
minified and gzipped, which is less than any one of the sample cover images
(19–45 KB). Zero dependencies.

**Runtime**, Chromium at 390×844:

| | desktop | CPU 4× | CPU 6× |
|---|---|---|---|
| Component's own init | 30 ms | 86 ms | 145 ms |
| Spinning | 60 fps | 60 fps | 60 fps |
| Tap → card | 7 ms | 21 ms | 30 ms |

CLS is 0. The rAF loop parks completely at rest — zero calls over two seconds
untouched. All 239 nodes are inside the shadow root, so the host page's DOM is
untouched and neither stylesheet can reach the other.

**The images cost more than the widget.** `loading="lazy"` does *not* defer the
facings turned away — they are rotated out of view but still inside the
viewport, so all of them fetch on load. Covers render around 119×179 CSS px, so
238×358 covers a 2× screen; a stock 600×900 product image is 6.3× more pixels
than needed. At twenty-four of them, 1–2 MB versus 400–600 KB.

---

## Traps

Each of these cost real time. The symptom is given because that is how you will
meet it again.

**`setPointerCapture` breaks clicking.** *Symptom: a real mouse click on a book
does nothing; programmatic `.click()` works fine.* Capture retargets `pointerup`
**and** the click to the stage, so the click never targets the anchor and the
browser has no link to follow. Resolving the book afterwards cannot help — the
default action belongs to the event target. Drags are tracked with
`pointermove`/`pointerup` on `window` instead. Test with real mouse and touch
input, never `.click()`.

**`preserve-3d` on a facing mirrors the rear panels.** *Symptom: once the opaque
fixture panels came off, books on the far side rendered backwards.* Each facing
must stay `transform-style: flat` — one rotated plane of ordinary content — so
`backface-visibility: hidden` hides the whole facing at once. Don't fix it by
putting `backface-visibility` on the shelves or books: that makes them their own
composited surfaces, hit-testing resolves there, and clicks stop reaching the
books.

**`getComputedStyle` does not resolve custom properties.** *Symptom: a height
budget of `80vh` came back as the number 80.* It returns the raw token. A
zero-width probe element with `height: var(--rack-max-height)` resolves it
properly.

**The custom-element upgrade trap.** *Symptom: the first `el.books = data` works,
every one after it silently does nothing.* `<script type="module">` is deferred,
so an inline script that assigns earlier writes an **own property** onto the
element, which then shadows the class accessor for good. `connectedCallback`
adopts and deletes it, but hosts should use
`customElements.whenDefined('spinner-rack')`. A BigCommerce or Searchspring
integration is exactly the code that hits this.

**Custom properties in the frame path halve the frame rate.** *Symptom: 60 fps
sitting still, 30 fps the moment it moves, on a CPU 4–6× slower than a desktop.*
Writing a custom property invalidates style for everything that inherits it, so
`--angle` on the host plus `--facing` on four facings recalculated a ~240-node
shadow tree every frame. The frame path now writes a `transform` on the drum and
an `opacity` on each shade — one element each, off the style path — and
quantises the shade to 1%. **Keep that rule: transform and opacity on single
elements, never a custom property.**

**`--angle` is not a way in or out.** It is written only when the rack comes to
rest, and the drum's own transform overrides it, so setting it from outside
moves nothing. Use the `angle` accessor. This bit the tests, not just hosts —
see *Testing*.

**A strict CSP refuses inline style.** *Symptom: under `style-src 'self'` the
rack renders as a column of full-bleed unstyled covers — 19,077 characters of
CSS, 0 rules applied.* The stylesheet goes in via `new CSSStyleSheet()` and
`adoptedStyleSheets`, which is CSSOM and outside `style-src`. Per-element
numbers (panel angles, cover ratios, jacket colours) are carried as `data-*`
and applied with `el.style.setProperty()` after insertion — a style *attribute*
that arrived as markup is refused; a property set from script is not. **Don't
reintroduce `style="…"` into generated markup.**

**The height budget governs the element, not the drum.** *Symptom: an 80dvh rack
did not fit an 80dvh viewport, and below ~340px of viewport height the whole
rack was off screen.* The drum is only part of what the rack occupies — the
crown sits above it and a strip below reserves the perspective overhang. Measure
`this.offsetHeight`, not `.rack`.

**Predicting the shelf count is path-dependent.** *Symptom: a fresh load at
844×390 settled on two shelves; rotating into the same viewport settled on one.*
A shelf's height depends on the panel width, which depends on how many shelves
must fit. It now renders each candidate tallest-first and keeps the first that
fits — trying, not predicting. Costs a few layout passes on a resize, which
happens on rotation rather than per frame.

**A flat plate straddling z = ±R punches through the panel in front.** CSS 3D
sorts by average depth, so the old base plinth cut a hole in whatever was
nearer. Removed.

**Inline `</script>` truncates a single-file build.** The component's own usage
comment contains a literal closing script tag, which ends the inline module and
cuts 47 KB to 1.9 KB. Escape it as `<\/script>` when inlining.

**Text fitting needs measuring, not estimating.** *Symptom: "OLIGARC / HY".*
Bold uppercase Georgia is nearer 0.8em per character than the 0.68 an earlier
version assumed. `titleFit()` measures the real font on a canvas.

**Derive spacing from the thing it has to clear.** The row gap was the magic
number `17px` and the review marker cleared the cover below it by 1.5px — luck,
not design. Both now come from one pair of properties (`--tick-fs`,
`--tick-lead`, `--tick-band`) so they cannot drift apart.

---

## Testing

Suites live in the scratchpad, not the repo; `demo.html` is the fixture most of
them drive. Serve the directory and run them with node:

```sh
npx http-server -p 8907 .
```

| Suite | Guards |
|---|---|
| `verify` | behaviour: physics, keyboard, events, budgets, no-JS fallback |
| `click` | real mouse, touch and keyboard navigation |
| `card` | the shelf card, its dismissals, the marker's wording |
| `cardgrab` | a press inside the card doesn't turn the rack |
| `type` | text clipping in generated jackets |
| `mixed` | cover proportions and uniformity |
| `holes` | crown opacity swept 0°→−90° (fixture mode) |
| `overlap` | the rack paints inside its own box at every angle |
| `tryit` | `try.html`: parsing, cover matching, markup output |

**A test that cannot fail is worse than no test.** `holes` and `overlap` drove
the rack by setting the `--angle` custom property. When the frame path changed
to a transform on the drum, both silently swept nothing and kept reporting
"pass" — `overlap` reporting its worst case "at 0°" is what gave it away. If
you add a suite that asserts something visual, **sabotage the thing it guards
once and check it actually goes red.** That is how the crown check earned its
keep: transparent cap → 3.1% show-through, failure.

**Measure against a baseline, not in isolation.** Under CPU throttling a bare
`requestAnimationFrame` loop can sit at 30 fps for reasons unrelated to the code
under test, so compare the rack spinning against the same page with the rack at
rest. Same for long tasks: this page's own load work produced a 116–124 ms task
with the widget's script removed entirely. An early version of this file
reported a 177 ms long task as the widget's; most of it wasn't.

---

## Integration findings

Measured or read from source, because the docs were unreachable from the
machine this was written on (`developer.bigcommerce.com`, `docs.bigcommerce.com`,
the Searchspring docs and `cdn11.bigcommerce.com` are all blocked by the egress
proxy here).

**Where the markup can live.** All four arrangements measured, eight books:

| | Rack | Links in the DOM |
|---|---|---|
| Markup + inline module in one pasted block | works, turns | 8 |
| Same block injected with `innerHTML` | falls back to plain links | 8 |
| Script on the page, widget supplies markup | works | 8 |
| Script first, markup injected later | works | 8 |

Row two is the one to know: **scripts inserted via `innerHTML` never execute** —
HTML spec, not a BigCommerce quirk. So an inline `<script>` inside a Page
Builder HTML widget runs only if the widget server-renders. You don't get a
broken page, you get the light-DOM fallback. Rows three and four both work
because a custom element upgrades whenever it is inserted into the document,
which is why the recommended shape puts the script on the page and leaves the
widget holding only markup.

An earlier version of the README claimed Page Builder wasn't crawlable and told
people to use a theme file. **Both wrong.** Page Builder content is markup in
the page, so the links are there; it is Script Manager *supplying the data* that
loses them. And a curated shelf is chosen by a person anyway, so living in Page
Builder is a feature.

**Image helpers**, from the `paper-handlebars` source rather than the docs:

- `getImage(image, presetName, defaultImageUrl)` resolves the preset against the
  theme's own `config.json` and clamps to `Math.min(image.width, requested)` —
  so what you get depends on theme settings an integrator may not control.
- `getImageSrcset(image, defaultImageUrl, options)` takes descriptors of the
  form `640w` or `2x`, and with exactly **one** descriptor returns a single URL
  rather than a srcset. That's the one `data-cover` wants.

**Ask for a width, not a `WxH` box.** A width-only descriptor provably preserves
the source ratio. Whether a `WxH` request fits inside the box or pads to fill it
is not stated plainly anywhere public, and it decides whether the grid stays
uniform. Unresolved — settle it against a real catalogue by requesting the same
image at `238w` and at `238x358` and comparing the pixel dimensions.

**Searchspring** `mappings.core` carries `sku`, `name`, `url` and
`thumbnailImageUrl`; the rest depends on how the profile is mapped. The
response shape in the README's example comes from search snippets, not the docs
— check it against a real response. And `thumbnailImageUrl` is a thumbnail: at
238–320px a 200px thumbnail looks soft.


## Open

- **The category signs lie on an ungrouped feed.** The crown takes its text from
  the first book on the panel, which is only true if the feed arrives grouped by
  category. Interleaved, every sign misrepresents its panel and some categories
  are never named. A category feed is grouped; a cross-category list or a
  recommendation set has no order contract. The fix is for the deal to group by
  category itself, so the sign is honest by construction.
- **Small counts are unguarded.** One book renders as a single 260×390 cover
  filling a panel with three empty facings behind it — it reads as "a big book",
  not a rack. Below about eight books a four-sided drum is the wrong object.
  Undecided what it should do instead.
- **Landscape drops books.** Fewer shelves is less capacity, so 24 titles shows
  16 in landscape and 8 on anything shorter. `rack.shape` reports it; nothing
  surfaces it to a reader. Tallest-first also means it prefers more books to
  bigger covers — `rows="1"` flips that.
- **Dark themes untested.** Facings fade to `--rack-page`, so it should hold up,
  but it has only ever been rendered on cream.
- **No end to the shelf.** You spin, tap a book, or leave. In a shop the spinner
  sits next to a table; online it is on its own.
- **Real covers have never been through it.** Every measurement above used five
  stand-in jackets repeated, or generated ones. `try.html` exists so a real
  catalogue can be dropped in without a server.
- **Placeholder review copy.** The notes in `demo.html` and `books.sample.json`
  are written for the mock and attributed to real papers. Swap them before this
  goes anywhere public.
