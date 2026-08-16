# The Bermondsey Review — step 1: design shell

This is the static front end from the tech plan's step 1: homepage, archive,
and individual article pages, styled and laid out, with mock data instead
of a real database. No Supabase, no auth, no email — that's step 2 onward.

## What's here

- `app/page.jsx` — homepage (featured article, "from this issue" extras, article list, newsletter band)
- `app/latest/page.jsx` — "The Latest," the full post listing, reverse-chronological, filterable
  by category (`/archive` used to be this page's URL — permanently redirected to `/latest` in
  `next.config.mjs` so old links/bookmarks keep working)
- `app/article/[slug]/page.jsx` — individual article page
- `app/crossword` — still a stub page, not built yet
- `app/geoguesser` — "Guess the Spot," a real game now — see the entry
  further down under "What you get"
- `components/Masthead.jsx` — header: centred serif wordmark, then a centred nav row under its own hairline
- `components/CoverArt.jsx` — placeholder line-illustration "covers" per category, swap for real images later
- `lib/articles.js` — mock article data, shaped to match the future `articles` table so swapping in real data is mostly a search-and-replace

## Design system

- **Colours:** paper `#FFFFFF`, ink `#1C1B17`, brick `#9C6B42` (warm warehouse brick/tan brown), river `#2B4C73` (dockside/Thames blue), mustard `#D3A121` (defined but currently unused), steel `#6E6C63` — a brown-and-blue duo drawn from the local warehouse brick and "Blue Bermondsey" shopping-area colours, rather than a generic template palette.
- **Type:** Zilla Slab for headlines (a free, commercially-usable slab serif in the same family as the DK Southwark reference you linked, which is personal-use-only), Source Serif 4 for article body copy, Inter for nav/captions/UI.
- **Masthead** (`components/Masthead.jsx`, `components/MastheadNav.jsx`): a centred serif wordmark over a centred nav row, each under its own hairline — restyled after comparing directly against the Observer's own masthead. Used to carry a hand-drawn skyline illustration (crane, warehouse, the Shard, river) and a solid brick bar as its one illustrated flourish; dropped both in favour of the same restrained, illustration-free masthead the Observer uses, leaving colour to the content below (the category-tinted article lead, the Subscribe button) rather than the masthead itself. The nav row switched from the sans-serif used for interface chrome to the same serif as the wordmark, since it's the paper's own section list, not a UI control. On mobile the wordmark stays left-aligned rather than centring — centring it there is what caused the original truncation bug (see below), so true centring is desktop-only, where the title sits in its own grid column independent of the Subscribe button beside it (mobile has no such button any more — see further down).
- **`components/HeaderArches.jsx` — the wordmark sits on top of a brick viaduct, walking back part of the "illustration-free masthead" call above.** A repeating line of brick arches — the actual railway out of London Bridge through Bermondsey, a real local landmark rather than a generic skyline — with a train that crosses in front of the title every so often. Took several tries to land on the right *style*, not just the right subject: the first passes were built from filled shapes, or a steam engine with a funnel and smoke (this line hasn't run steam since long before anyone reading it was born) — see git history for the abandoned versions. Settled on pure line art, New Yorker style: one stroke weight throughout, no fills anywhere, flat *segmental* arches matching a real viaduct's proportions, and a modern Southeastern Class 707-style unit (streamlined nose, flush skirt, no visible wheels or funnel) with three carriages, drawn from real photos of the actual line. Lengthened twice more since: first `viewBox` 260→300 (body span 8-226→8-266), then a fourth carriage added, `viewBox` 300→386 (body span →8-352) — each time keeping the same height and nose/cab shape throughout, just one more run of carriage, so it reads as a longer train rather than a bigger one, with joints recomputed each time to stay evenly spaced. The crossing itself also sped up (~9s → ~7s to cross), still once roughly every 30s — `.header-train`'s keyframes moved from a 70%/30% hold/cross split to 77%/23%, with `animation-delay` recalculated (-11s → -13.1s) to keep the *first* crossing landing at 10s post-load rather than drifting later as the hold phase grew.
  - **Originally a separate strip stacked above the wordmark row — now layered *into* it instead.** The standalone strip added a full extra block of height for what was, in the end, a fairly small illustration; the wordmark now visually sits on the bridge's own parapet line instead, with no extra layout height at all, since `HeaderArchesBackground` is an absolutely-positioned fill (`-z-10`) behind the title, and `HeaderTrain` an absolutely-positioned overlay (`z-20`) in front of it — both rendered inside `MastheadNav.jsx`'s own wordmark rows (mobile and desktop each get their own instance, tuned to that row's actual height) rather than as a `Masthead.jsx`-level strip.
  - **The arch pattern's own vertical geometry hangs from the parapet, not from the row's top edge.** An earlier version positioned the arch crown/springline/ground at fixed pixel offsets measured from the *row's* top — which put the arches overlapping the title itself, since that geometry had no relationship to where the parapet (or the title) actually landed once the strip stopped being a fixed 96px-tall standalone block. Fixed by making the whole arch band (`BAND_H`, a small fixed-pixel graphic) hang a fixed `GAP` below the parapet line, itself positioned via a CSS percentage (`top: parapetY`) tuned per breakpoint from the row's real measured height — so the arches always render *below* the parapet regardless of how tall the row is.
  - **Getting the train in front of the text needs two elements, not one.** `.header-train`'s `@keyframes` animate `transform: translateX(...)` for the horizontal crossing; the *vertical* placement (landing the train's skirt exactly on the parapet, regardless of row height) also needs a `transform` (`translateY(-100%)` from a percentage `top`). A single element can't carry both — a CSS animation's `transform` property fully replaces whatever static value shares that property, it doesn't compose with it — so an outer wrapper div holds the static vertical placement and an inner `<svg>` carries the animation.
  - **`isolate` on each wordmark row matters, not just `relative`.** `HeaderArchesBackground` sits at `z-index: -10` to stay behind the title — but a `position: relative` element with no `z-index` of its own doesn't establish a new stacking context, so a negative-z-index descendant can escape it entirely and render behind the page's *own* background instead of just behind its intended siblings. Adding `isolate` (which sets `isolation: isolate`, forcing a new stacking context with no arbitrary z-index number needed) to each row fixed arches that were rendering fully invisible, behind `<header>`'s own `bg-paper`.
  - **The site tagline moved out of the masthead.** It used to show under the wordmark (desktop only) and again in the footer — removed from both (`MastheadNav.jsx`, `Footer.jsx`) and moved to `Newsletter.jsx` instead, the one place it shows at all now, since "sign up" is the actual point being made there. `Newsletter.jsx` became an async Server Component to fetch it (same `getSiteSettingsSafe` call `Masthead`/`Footer` already made independently) — safe to do since every place it's used (`HomePageBody.jsx`, `article/[slug]/page.jsx`, and the admin layout canvas's `sectionContent.newsletter`) either renders it directly from a Server Component or receives it pre-rendered as a prop, the same pattern `Masthead`/`Footer` already use.
  - Crosses via one `@keyframes` loop (`.header-train`, `app/globals.css`) — mostly holds off-screen to the left (`translateX(-100%)`, relative to the train's own width so it fully clears itself on any screen size), then takes about 9s to cross, once roughly every 30s. No client JS at all; `prefers-reduced-motion` was already handled globally in `globals.css` (every animation site-wide, not just this one), so it needed no accessibility handling of its own.
  - The resting position (`translateX(-10vw)`, before that was fixed) also wasn't fully off-screen on ordinary desktop viewports — 10vw is narrower than the train's own rendered width, so part of it stayed visible even at rest. Fixed by switching the resting keyframe to `translateX(-100%)`, which is relative to the train's own bounding box rather than the viewport, so it fully clears itself regardless of screen size; the crossing endpoint stays `vw`-based since *that* one genuinely needs to clear the strip's width, not the train's own.
  - The repeating arch pattern's stroke is faded (`stroke-ink/[0.45]`, not full `stroke-ink`) — at full strength the arches were the same colour and near enough the same weight as the wordmark directly below them, competing for attention rather than one clearly leading. The parapet line stays full strength, as the one structural line meant to read clearly, with the arches beneath it receding into supporting texture.
  - **No more Subscribe button or hamburger menu on mobile.** The mobile wordmark row is now just the title — no button cluster on the right at all — and the nav links (`The Latest`/`Reviews`/`Cartoons`/`Puzzles`) show directly underneath, always, the same row desktop already used (just no longer `hidden` below the `sm:` breakpoint), rather than hidden behind a hamburger toggle. `flex-wrap` on that row is what keeps four items fitting on a narrow screen without needing a collapsible menu — checked as far down as a 320px-wide viewport, still one line, no wrapping. Since the hamburger's open/close toggle was the only reason `MastheadNav.jsx` needed client-side state at all, it dropped `"use client"` entirely along with the toggle — nothing left in it needs interactivity.
  - **Three real bugs from that first layering pass, caught after merging and comparing directly against the earlier standalone-strip version.**
    - **The arches had shrunk and picked up a different feel** — not because they were deliberately redesigned smaller, but because the version built for the new layered context used different, unrelated numbers (`TILE_W`, `ARCH_W`, `ARCH_RY`, etc.) at a much smaller scale, rather than the original standalone strip's own geometry scaled down. Fixed by rebuilding `HeaderArchesBackground`'s constants as a straight ~0.6x scale of the original (same ratio of pier width to arch span, same ratio of arch rise to pier height), so it's recognisably the same arches shown smaller, not a different, busier style with more, smaller repeats. The wordmark rows carry extra bottom padding (`pb-12`/`pb-14`, up from a plain `py-4`/`py-6`) specifically so that restored size has room to show without `overflow-hidden` clipping it back down to a sliver.
    - **The train visibly hovered above the parapet line instead of resting on it.** Its `viewBox` was `0 0 260 50`, but the drawn shape's lowest point (the skirt) was at `y=40` — 10 units of empty space sat below the visible train inside its own coordinate box. The wrapper's positioning math correctly landed the *bounding box's* bottom edge exactly on the parapet, but the visibly drawn train sat proportionally higher than that box, since the skirt wasn't the box's actual bottom edge. Fixed by trimming the `viewBox` to `0 0 260 40`, so the skirt *is* the bottom edge, with nothing left below it to create the gap.
    - **Mobile's title had gone small and left-aligned** — that was intentional back when a Subscribe/hamburger cluster sat next to it and centring risked truncation, but with that cluster now gone entirely (see the bullet just above), the constraint that justified it no longer applied. Centred it and bumped it from `text-xl` to `text-2xl` — not all the way to desktop's `2.5rem`, which (checked at 320px, the narrowest common phone width) wraps "The Bermondsey Review" onto two lines there; `text-2xl` is the largest size that still fits on one.
  - **Two more from the same review, once the arches were back to size: the bridge didn't reach the row's own hairline (a visible gap sat between the arch piers and the nav row above), and the train's first crossing didn't feel worth the wait.**
    - The arch band was positioned `top: parapetY%`, anchored to the parapet rather than to the row's own bottom edge — the row's extra bottom padding (added for the size-restoration fix above) created more room than the fixed-height band actually needed, leaving a gap between the arch piers' ground level and the hairline instead of the two meeting. Switched to `bottom: 0` (the band's ground level is now always exactly the row's own bottom edge, regardless of row height) — simpler and more robust than the percentage-based top offset, since it no longer needs tuning per breakpoint to land in the right place. `HeaderTrain` follows the same `bottom: BAND_H` logic, landing its skirt exactly on the parapet (the band's own top edge) — and since `bottom` is a plain positioning property, not `transform`, it no longer conflicts with `.header-train`'s own `transform: translateX(...)` crossing animation the way the earlier `transform: translateY(-100%)` trick did, so the whole component collapsed back down to one `<svg>` instead of needing a wrapper `<div>` around it just to keep the two transforms from clobbering each other.
    - The train's first crossing wasn't happening until 21s in (70% of the 30s cycle) — noticeably slower than the crossings after it, since the animation always starts a fresh loop at 0% on page load. Added `animation-delay: -11s` to `.header-train`: a *negative* delay makes the browser treat the animation as if that much of its cycle had already elapsed, so it starts 11s into the 30s loop rather than at the very beginning — landing the first crossing at 10s post-load instead of 21s, with every crossing after that still a plain 30s apart (a negative delay only shifts the starting phase, not the loop's own period).
- **Article lead** (`components/PostRenderer.jsx`): a full-width band tinted with the piece's own category colour (the same brick/river split the category label already uses), headline block and cover image side by side on desktop, stacking on mobile — a proper front-of-section lead rather than a plain white header sitting above the image. Has a `sm:min-h-[420px]` floor so a short headline with no dek doesn't leave the image looking like a thin sliver; longer copy still grows the row taller than that. The masthead's own site-title heading dropped its old fixed size + `truncate` in favour of a smaller mobile size that wraps to two lines instead — a real defect this surfaced: "The Bermondsey Review" was silently clipping to "The Bermondse…" on phone-width screens.
- **The homepage's featured article** (`components/ArticleCard.jsx`'s `size="featured"` branch) gets the same lead treatment as the article's own page — same category tint, same side-by-side headline/image — so "the most recent article" reads as one consistent design moment whether you're looking at the homepage or the piece itself. Kept as a rounded card within the normal content column rather than a true full-bleed band like the article page's own hero: "featured" is one of several reorderable homepage sections (see `components/admin/LayoutCanvas.jsx`), and a full-bleed treatment would mean pulling it out of that reorderable flow the way the newsletter band already is — a bigger change than the lead-treatment itself called for. The plain list-row layout used everywhere else (archive, category listings) is untouched.
- **A real, pre-existing layout bug, caught by that featured-card change making it visible**: the homepage (and separately, archive/crossword/geoguesser/forms) render their main content noticeably narrower than the masthead/footer above and below them. Root cause: `<main>` is `flex flex-col`, and each of these pages has a `max-w-* mx-auto ... flex-1` div as `<main>`'s *direct* child — but per the flexbox spec, auto margins on a flex item's cross axis (`mx-auto`, when the flex direction is column) disable `align-items: stretch`, so without an explicit width the item falls back to shrink-to-fit sizing based on its content instead of filling the available space. `components/admin/LayoutCanvas.jsx`'s own homepage preview already had `w-full` on the equivalent div (something already hit and fixed this there, just not in the actual public pages) — added the same `w-full` to all 5 affected files. Confirmed via direct `getBoundingClientRect()` measurement on both the local build and the actual broken production site (not just eyeballing a screenshot, which is how this stayed unnoticed) — every wrapper now measures exactly its intended `max-w-wide`/`max-w-content` value instead of a content-dependent one.
- **Link hover/press feedback is underline, not a colour change.** Headlines
  (`ArticleCard.jsx`'s list and featured variants, `ArticleCarousel.jsx`),
  cartoon captions (`CartoonsSection.jsx`), and the masthead/footer nav
  links (`MastheadNav.jsx`, `Footer.jsx`) used to swap `text-ink` for
  `text-brick`/`text-river` on hover (`group-hover:text-brick` etc.) — now
  they get `group-hover:underline` (`hover:underline` for the nav links,
  which aren't wrapped in a `group`) plus a matching `active:`/`group-active:`
  variant for touch devices, which don't fire `:hover` on tap. Text colour
  now stays fixed regardless of hover/press state. `PuzzlesSection.jsx`'s
  card CTAs already worked this way (`group-hover:underline`, no colour
  change) — this just brought the rest of the site's links in line with
  that existing pattern rather than inventing a new one. The footer's
  social-media icon links deliberately keep their old opacity-based hover
  (`text-paper/80` → `text-paper`) instead — they're bare SVGs with no
  text content, so `text-decoration` has nothing to underline.

## Article sidebar: author/illustration credits, text size, reading progress, share

- **A new metadata rail on article/video/podcast pages** (`components/ArticleSidebar.jsx`) — a true left rail on desktop, a stacked block above the body on mobile — showing the author, an illustration credit (new), a 3-step text-size control, a reading-progress on/off toggle (plus the actual progress bar it turns on), email/copy-link share buttons, the publish date, and the category. Modelled on a reference the user provided (a magazine site's own article sidebar), minus its magazine-issue promo module — that's advertising for their own print issue, not something that applies here. Cartoons keep their own separate centred layout (no split hero band, no body blocks) and don't get a sidebar; everything else does.
- **New `illustrator` column on `posts`** (`supabase/schema.sql`, existing-install alter statement included) — a second, separate credit from `author`, only shown in the sidebar when set. Wired into the admin post editor (`PostForm.jsx`) following the exact same pattern `author` already uses end to end: a default in `emptyPost`, a bound `<input>`, and added to `handleRestore`'s field whitelist so it round-trips through revision history correctly (a field left off that list silently wouldn't restore, even though it autosaves fine).
- **Text size only resizes the article's own paragraph text, not headings/quotes/captions** — matches how most reading-mode controls elsewhere work (NYT, Medium, etc.): the bulk reading content resizes, the piece's own designed structure doesn't. Implemented as a CSS custom property, `--article-font-size`, written onto `document.documentElement` by the sidebar's text-size buttons — the exact same technique `HeaderWormSpeed.jsx` already uses elsewhere in this codebase to hand a value from one component to a totally different part of the tree via plain DOM/CSS cascade rather than React state or context. `BlockContent.jsx`'s paragraph block reads it via a `font-size` arbitrary value, `1.125rem` fallback (what the old fixed `text-lg` utility already resolved to), so anywhere `ArticleSidebar` isn't mounted — any admin block-editor preview, any other page type — renders identically to before this existed.
- **First use of `localStorage` in this codebase** — both the text-size choice and the reading-progress on/off state are genuinely per-visitor preferences with no server-side equivalent to fall back to, unlike everything else this session has touched (site settings, theme colours, layout order), which all live in Supabase. A returning visitor's saved preference applies after the initial mount (one `useEffect` reads it), so there's a brief flash of the defaults on first paint — accepted rather than reached for a blocking inline `<head>` script, which felt like real complexity for a cosmetic preference that settles within one frame.
- **A real Tailwind gotcha caught by the build, not skipped past**: the production build failed with a CSS parse error the first time round — not from the actual `text-[length:var(--article-font-size,1.125rem)]` class itself, but from a *code comment* a few lines above it, which happened to contain the literal text `text-[length:var(...)]` (using `...` as prose shorthand). Tailwind's JIT scans raw file text for class-shaped tokens, not parsed JS/JSX — it doesn't know the difference between an actual `className` and a comment that merely mentions similar-looking syntax, so it tried to generate real CSS for a bracket expression that was never meant to be a class at all (`font-size: var(...)`, invalid CSS). Fixed by rewording the comment in prose instead of writing out the literal token — worth remembering for any future comment near an arbitrary-value class in this codebase.
- **Sticky on desktop** (`lg:sticky lg:top-8 lg:self-start` on the rail's own wrapper) — stays reachable while scrolling a long article rather than scrolling away after the first screen, which is when the text-size/reading-progress controls are actually useful. `lg:self-start` matters specifically: a grid item stretches to match its row's full height by default, which would leave the sticky rail with no shorter-than-container height to ever "stick" within.
- The reading-progress bar (`fixed top-0 left-0 right-0`) fills with the article's own category accent colour (`accentHex`, the same one already driving the hero band's tint and pull-quote borders), not a fixed colour — ties it to the piece it's actually measuring progress through. It's pinned to the true viewport top rather than under the masthead, since the masthead itself isn't sticky (scrolls away like the rest of the page) — there's nothing fixed for it to sit below.
- Verified via Playwright with a mock 15-paragraph article: confirmed clicking each text-size button changes the *body paragraph's* computed font-size specifically (18px → 16px → 21.6px) while the hero band's dek text stays fixed at its own unrelated size; confirmed the choice survives a full page reload via `localStorage`; confirmed the progress bar's width grows on scroll and disappears entirely when toggled off; confirmed copy-link actually writes the article's real URL to the clipboard; and screenshotted both the desktop rail and the mobile stacked layout against the reference images this was built from.

## New block type: raw HTML — a quicker fallback for pasted tables

- **The ranked-list block's bulk-paste field didn't actually work for the article it was built for** — the survey data lives in a Word doc, and copying a table out of Word (or Google Docs) produces HTML full of inline `mso-*` styling, `<o:p>` tags, and div/span wrapper soup, not the plain tab-separated text that parser expects. Rather than extend that parser to also understand Word's own export format, added a separate, more direct "HTML" block: paste the raw HTML straight in, and let sanitisation do the cleanup instead of a bespoke text parser.
- **`BlockContent.jsx`'s `sanitizeGenericHtml`** (exported, alongside a new `HTML_BLOCK_CLASS` styling constant) allows table/list/basic-formatting tags — `table`, `thead`/`tbody`/`tfoot`, `tr`/`th`/`td`, `caption`, `p`, `br`, `strong`/`em`/`b`/`i`/`u`, `ul`/`ol`/`li`, `a`, `h3`/`h4` — and strips every attribute except `<a>`'s `href`/`target`/`rel` and `<td>`/`<th>`'s `colspan`/`rowspan` (structural, not styling, so kept). sanitize-html's default behaviour for a disallowed tag is to unwrap it — keep the text/children, drop just the tag — so Word's own div/span/`<o:p>` wrapping collapses down to plain structure instead of losing content. `HTML_BLOCK_CLASS` then applies the site's own baseline table styling (hairline borders, `font-sans` uppercase headers, `font-body` cells) to whatever survives, since a sanitised table has no styling left of its own by the time it gets here — every inline style was stripped on purpose.
- **`components/admin/BlockEditor.jsx`'s new `HtmlField`** is a plain textarea (mirroring the existing `EmbedField`'s own simpler pattern — no rows-editor UI, no bulk-paste parsing, just paste and go) with a live preview underneath using the *exact* `sanitizeGenericHtml`/`HTML_BLOCK_CLASS` a reader would get, not an approximation — so pasting something messy shows immediately what actually survives rather than needing to publish and check.
- **Verified the security boundary directly, not just the visual result**: seeded a realistic messy-Word-paste sample (the mso-styled table, plus a `<script>` tag and an `onclick`-carrying `<a>` deliberately mixed in) through both the editor and the public renderer via Playwright. Confirmed the script never executed and no `<script>` tag survived at all, confirmed the link's `onclick`/`style` attributes were stripped while its `href` came through untouched, and confirmed every cell landed with no leftover `class`/`style` attributes — clean table structure, on the site's own type system, not Word's.

## Ranked list block: paste multiple rows at once

- **Follow-up to the ranked-list block, prompted directly by how tedious it'd actually be to use**: adding ~40 venues one at a time (click "+ Add row", tab through name/type/count, repeat forty times) is exactly the kind of thing someone with this data already sitting in a spreadsheet shouldn't have to do by hand. Added a "Paste multiple rows…" option to `RankedListField` (`BlockEditor.jsx`) — a textarea that accepts one venue per line, appending the parsed rows to whatever's already there rather than replacing it.
- **`lib/rankedList.js` gained `parseBulkRows(text)`**, the shared parser: splits each line on a tab if it has one (what pasting straight out of a spreadsheet produces) or a comma otherwise (typed by hand), in name/category/count order. A count written as `"36/39"` — the format this survey's own data happens to already be written up in — is accepted directly: the numerator becomes the row's count, and the *largest* denominator seen across every pasted line comes back as `suggestedTotal`, which the field only uses to fill in the block's `totalResponses` if that field is still at its default (0) — it won't silently overwrite a value someone already set on purpose.
- **A real bug caught before it shipped, not after**: the first version of the import handler made two separate `onChange` calls in the same click handler — one for the new `rows`, one for `totalResponses`. `BlockEditor`'s own `updateBlock` reads its `items` state synchronously rather than through a functional updater, so two `onChange` calls back to back in one handler both close over the *same* pre-update snapshot — the second call would have silently clobbered the rows the first one just set, since its own spread never saw them. Fixed by merging both into a single `onChange` object before calling it once, and left a comment explaining why, since the bug is easy to reintroduce by "helpfully" splitting the update into two calls later.
- Verified via Playwright with a simulated spreadsheet paste (tab-separated lines using the article's own `"x/39"` count format): confirmed the parsed row count reflected in the "Add N rows" button label, confirmed all three fields (name/type/count) landed in the right inputs after import, and confirmed `totalResponses` auto-filled to 39 from the pasted fractions when it started at 0.

## New block type: a ranked list, for the "Bermondseyness" pub survey

- **Prompted by a real article in progress** — a piece on Bermondsey's fuzzy borders ends with a ~40-venue leaderboard (pubs and Bermondsey Beer Mile taprooms, ranked by what share of a reader survey counted each one as genuinely "Bermondsey"). Worked through as a design discussion before any code: what should "interactive" mean here (a filterable directory? a map, reusing the Guess the Spot infrastructure? something embedded in the article itself?), then specifically whether it belonged in an iframe — it doesn't, since an iframe is this codebase's tool for genuinely *external* content (the `embed` block's YouTube/Spotify/etc., or the admin's own WYSIWYG preview panes), not for something authored as part of the site itself; it would only have cost isolated theme/font loading and manual resize syncing for no benefit. Landed on: a new block type, admin-editable, rendered as a real client component in the page tree — the same shape as the crossword/Guess the Spot games already are.
- **`lib/rankedList.js`** — the shared logic, used by both the public renderer and the admin editor's live preview. A block only ever stores each row's raw `name`/`category`/`count` plus one shared `totalResponses` — never a rank or a percentage. Both are always *derived* (`rankRows`), so reordering or editing rows in the admin can never leave a stale rank/percentage sitting in the stored data that then has to be kept in sync by hand. Ranking is competition-style (1, 2, 2, 4 — not 1, 2, 2, 3): two rows with the same count share the same rank and the next distinct count resumes at its real 1-based position, matching the "=2"/"=4" convention the source survey data was already written in. `categoriesIn` reads the distinct category values straight out of the actual rows rather than hardcoding "Pub"/"Beer Mile", so the filter toggle generalises to whatever categories get typed in.
- **`components/RankedListBlock.jsx`** — the actual sortable/filterable table (a Client Component: this is the one genuinely new interactive surface the feature needed). Click a column header (Rank/Venue/Type/Included) to sort by it, click again to reverse; category pills filter the rows down, all client-side, no server round trip since the data's fully in the page already. Each row's percentage gets a small horizontal bar alongside the number and its raw `count`/`totalResponses` fraction — legible at a glance, not just as a sorted number. A real `<table>` with `overflow-x-auto`/`min-w-[480px]`, not a squeeze-everything-to-fit layout — the same "scroll rather than shrink" convention already used for the crossword's clue lists and the homepage carousels.
- **`components/BlockContent.jsx`** gained a `"ranked-list"` case rendering `RankedListBlock` directly. **`components/admin/BlockEditor.jsx`** gained the type in `BLOCK_TYPES`/`emptyBlockFor`/`outlineLabelFor`, plus a new `RankedListField` — a rows editor (name/category/count inputs, add/remove/reorder, same arrow-button-not-drag convention `HeroCarouselField` already established for a nested list inside a single block) with a title field and a "total responses" denominator, and — more literally than most other blocks — the exact same `RankedListBlock` component rendered live underneath as the preview, since the whole point of this block is the sort/filter interaction itself, not just its resting appearance.
- Verified via Playwright, seeded with the actual ~40-row survey dataset from the article: default sort lands rank 1 first; tied rows (e.g. two venues both at 89.7%) both correctly show rank 2; sorting by Venue re-sorts alphabetically; filtering to "Pub" shows exactly 22 rows (hand-counted against the source data to confirm); editing a row's count in the admin editor live-updates its own preview's sort order; "+ Add row" adds a row. Also checked at a 390px mobile width to confirm the table scrolls horizontally rather than compressing illegibly.

## Footer: nudged a touch lighter still

- `Footer.jsx`'s `bg-[#F5F5F5]` → `bg-[#F8F8F8]` — a small further step in the same direction as the previous footer-lightening change, not a new decision. The `text-ink`/NN opacity hierarchy (nav links, social icons, `footer_text`, copyright) already had enough contrast headroom against `#F5F5F5` that a few extra points of lightness don't threaten legibility of the lightest tier (`text-ink/50`, the copyright line) — confirmed by screenshotting rather than assuming.

## The worm: light sky blue, matching the Subscribe button

- `HeaderArches.jsx`'s `HeaderWorm` — stroke and both eye fills changed from `#F5C518` (bright yellow) to `#87D6FF`, the same light sky blue the Subscribe button switched to. Still a literal fixed value, not a theme-token reference, same reasoning as before: the worm keeps its own colour regardless of what an admin sets the theme accents to. Third colour this has been now (pink, then yellow, then this) — each just a value swap in the same spot, nothing about the actual positioning/animation touched.

## Site title, sized down slightly

- `MastheadNav.jsx`'s wordmark text: `text-2xl sm:text-[2.5rem]` → `text-xl sm:text-[2.25rem]` (20px/40px → 20px/36px on mobile/desktop — mobile's own size moved too, from 24px). The title was reading larger than the rest of the masthead's own type scale (nav links, Subscribe) really called for. Verified via Playwright, not just eyeballed: at 320px (the narrowest common phone width) the title still wraps to two lines at this smaller size too, same as it did before — updated the file's own comment to say so, since that comment specifically documents what happens at that width and it needed to keep being true, not just read like it still was.

## Puzzles & games cards: horizontal, borders instead of colour fills

- **Prompted by a concrete complaint, worked through as options rather than a single fix:** the two "Puzzles & Games" cards (crossword, Bermy on the Map) read as too wide and too visually loud — solid colour tiles, each spanning half the homepage's own wide column, for just an icon and a couple of lines of text. Offered four different directions (narrower centred section; content-sized cards; horizontal icon-beside-text layout; one unified panel) rather than assuming which one; the user picked horizontal layout, then separately asked for the colour fill gone too — both landed in `PuzzlesSection.jsx`'s `GAMES` array and its render.
- **Layout: icon beside the text, not stacked above it.** Was `flex-col items-center text-center`, icon between the title/description and the CTA, with a forced `min-h-[280px]` to keep the tile looking substantial; now `flex items-center gap-6`, icon on the left (`w-16 h-16 sm:w-20 sm:h-20`, down from a flat `w-24 h-24`) and a left-aligned text column — title, description, then the CTA link — filling the rest of the row's width. No forced minimum height any more; the row is exactly as tall as its own content needs, which on its own cuts most of the previous bulk even before the colour changed.
- **Colour: `color-mix()` background tile → a plain hairline border (`border border-steel/25`), which itself tints to that game's own accent only on hover** (`hover:border-river` for the crossword, `hover:border-brick` for Bermy on the Map — a new `accent` field on each `GAMES` entry replacing the old `bg` one). Keeps a trace of each game's own colour identity — useful as a hover cue, and consistent with the accent this session already established for each — without either card wearing it as a permanent, dominant fill. Dropped the `hover:-translate-y-1` lift that went with the old tile treatment too; a border-colour change on hover reads as feedback enough on its own, and matches the flatter, underline-based hover convention already used for links/headlines elsewhere on the site rather than reintroducing a lift effect just for this one component.
- Verified via Playwright at both a 1280px desktop width and 390px mobile: confirmed the rest-state border is the neutral steel tone, confirmed hovering the crossword card's computed `border-color` reads `rgb(29, 78, 216)` (`--color-river`'s default), and confirmed the CTA underlines on hover — screenshotted both states, and the stacked mobile layout, to check the row doesn't feel cramped now that it's shorter.

## Homepage section headers, sized down a step

- `SectionHeader.jsx`'s `<h2>` — `text-2xl sm:text-3xl` → `text-xl sm:text-2xl` (24px/30px → 20px/24px). Checked against NYRA's own section dividers for comparison, per the ask: a section header here ("Reviews", "Puzzles & games", "Cartoons") is signage marking where one part of the homepage ends and the next begins, not a headline competing with the actual article titles below it — the previous size read closer to the latter. Scoped to this one shared component only, so every section using it (Featured has none of its own — see the file's own comment — Article Carousel, Puzzles & Games, Cartoons) stepped down together; the newsletter drawer's own "Get the newsletter" heading is a different kind of heading entirely (a dialog title, not a homepage section divider) and stayed as it was.

## Subscribe button: light sky blue instead of bright yellow

- `MastheadNav.jsx`'s Subscribe button's literal fixed colour changed again — `#F5C518` (bright yellow) → `#87D6FF` (light sky blue). Same fixed-value reasoning as before (not `bg-brick`/`bg-river`, so it can't drift if the theme's own accent colours change): only the actual colour value changed, not the pattern. `text-ink` stayed as the button's text colour — light enough a background that dark text is still the legible choice, same as it was against the yellow.

## The homepage's carousels centre themselves when they're short

- **`ArticleCarousel.jsx` and `CartoonsSection.jsx`'s horizontally-scrolling rails now centre their items when there are few enough to fit without overflowing** (e.g. only one or two articles/cartoons published so far, which is the actual current state of the live site) — they used to bunch up against the left edge under a centred section header, reading as misaligned rather than intentional. Once there are enough items to genuinely overflow and need scrolling, the row still starts from item one, unchanged.
- **`justify-content: safe center`, not plain `center`** — plain `center` has a well-known flex/overflow trap: once a row's content is wider than its container, centring splits the *excess* width evenly on both sides, which can push the first item(s) out of the scrollable area's start with no way to scroll back to them. The `safe` keyword (CSS Box Alignment) falls back to start-alignment specifically in that situation, so an overflowing row keeps scrolling normally from item one, and only actually centres when the content genuinely fits.
- **Two real build-pipeline issues found getting one CSS declaration to actually ship, not just written:**
  - First attempt used a Tailwind arbitrary value, `justify-[safe_center]` — silently generated no CSS at all. Tailwind's `justifyContent` core plugin is a fixed set of utilities (`addUtilities`), not the `matchUtilities` plugin type that arbitrary bracket syntax needs, so that class was never valid in the first place, just quietly ignored rather than erroring.
  - Switched to plain CSS instead (a new `.justify-safe-center` utility in `globals.css`), with the standard "unsupported value" progressive-enhancement pattern: two `justify-content` declarations in the same rule, `flex-start` first as the fallback, `safe center` second so a browser that understands it overrides the first (an unrecognised CSS value makes a browser ignore just that one declaration, not the whole rule or the block before it). Checked the actual compiled output, not just the source — and found Tailwind/PostCSS's own processing deduplicates same-property declarations within one rule down to the last one, silently discarding the `flex-start` fallback before any browser ever saw it. Fixed by splitting the fallback into its own rule and gating the enhancement behind an `@supports (justify-content: safe center)` feature query instead — two separate rules, so there's nothing left to collapse, and a browser without `safe`/`unsafe` support just never matches the `@supports` block, keeping identical behaviour to before this change.
- Verified via Playwright against the real components with mock data (the live site currently has too few published articles to exercise this itself): a 2-article row centres (first item measured well clear of the container's own left edge, not flush against it); a 10-article row overflows and still measures its first item flush against the container's start, reachable at `scrollLeft: 0`; a single-cartoon row centres the same way the 2-article row does.

## Newsletter sign-up: a drawer, not a static block; plus two small masthead tidies

- **The newsletter sign-up is a slide-in drawer now, not an in-page section.** It used to be a full-width `bg-river` band, static in the page flow — shown on the homepage (if enabled in the layout builder) and unconditionally at the bottom of every article, nowhere else. Now it's a fixed panel that slides in from the right, opened from the Subscribe button that's already on every page's masthead, and closed via its own × button, the Escape key, or clicking the dimmed backdrop behind it. New `components/NewsletterDrawer.jsx` (a Client Component — the only genuinely new interactive surface this needed) owns the open/close state and the panel/backdrop markup; `components/Newsletter.jsx` keeps its existing async settings fetch (for `site_tagline`) but now renders the drawer instead of the old `<section>`, still handing it the same `SupascribeEmbed` (the actual email-capture widget, a third-party script-driven embed, untouched).
  - **Mounted once, from `Masthead.jsx` itself** — right next to the Subscribe button that opens it, not threaded through every page that wants one. That's a deliberate difference from Footer (which every page opts into separately): pairing the drawer with the masthead guarantees it exists everywhere Subscribe does, including pages that never rendered `<Newsletter/>` before at all (the crossword, archive, forms, custom pages) — previously, clicking Subscribe from any of those actually navigated you to the homepage first (`href="/#newsletter"`), just to scroll to a section that might not even be enabled. Removed the now-redundant standalone `<Newsletter/>` renders from `HomePageBody.jsx` and `app/article/[slug]/page.jsx` — rendering it a second time on the same page would mean two drawers and two copies of the Supascribe embed div fighting over one `#newsletter` hash.
  - **The Supascribe embed div stays mounted in the DOM at all times**, just translated off-screen (`translate-x-full`) when closed rather than conditionally rendered — its loader script scans for that div once, so it needs to already exist by the time the script runs, regardless of whether anyone's opened the drawer yet.
  - **Subscribe's link changed twice, not once.** First, `/#newsletter` → `#newsletter` (a bare fragment resolves relative to whatever page you're already on, rather than forcing a homepage navigation just to open something that's now a same-page overlay). Second — caught by Playwright, not assumed — next/link's own `<Link>` component turned out to intercept the click and update the URL via `history.pushState` for this same-page hash change, which does **not** fire a real `hashchange` event; `NewsletterDrawer` listens for exactly that event to know when to open, so clicking Subscribe updated the address bar but visibly did nothing. Switched Subscribe to a plain `<a href="#newsletter">` instead of `Link` — a native anchor's own same-document fragment navigation does fire `hashchange`, and there's no route to prefetch here anyway.
  - **The homepage layout builder's "Newsletter Signup" toggle is gone**, not just visually skipped — it doesn't exist as a concept any more. It used to be the one fixed (non-reorderable, drag-handle-less) entry in the section list; now that Subscribe/the drawer are unconditional masthead chrome rather than a homepage section, there was nothing left to toggle. Removed its `SECTION_REGISTRY` entry (`lib/sections.js`), its `DEFAULT_HOME_SECTIONS` entry (`lib/layout.js`, whose `withCartoonsSection` migration helper no longer needs to special-case where it sits), and the `LayoutCanvas.jsx`/admin layout page wiring that rendered it as a separate fixed slot — `SectionSlot`'s now-unused `fixed` prop (and the drag-handle-hiding branch that existed only for this) came out too. An already-saved `page_layouts` row from before this change can still have a stale `"newsletter"` entry in its stored `sections` array; it's filtered out defensively wherever sections are read, since nothing left knows what to do with that type any more.
  - Verified via Playwright: the Supascribe embed div is present in the DOM on first paint (closed state); clicking Subscribe opens the drawer (confirmed via its actual `transform`, not just a class name) and sets `location.hash`; Escape closes it and clears the hash; and — the case that mattered most — clicking Subscribe from `/crossword` opens the drawer in place, with `location.pathname` staying `/crossword` throughout, not silently redirecting to `/`.
- **The nav row's own hairline underneath it is gone.** It sat directly below the already-hairlined title row above it, so two rules appeared close together right under the wordmark — reads as a stray leftover line rather than a deliberate double border. The hairline between the title row and the nav row stays; only the one directly under the nav links (`MastheadNav.jsx`'s `<nav>` itself) was removed.
- **The homepage's "Latest reviews" section header is now just "Reviews"** (`lib/sections.js`'s `SECTION_HEADER_DEFAULTS.carousel.title`) — shorter, and matches the masthead nav link of the same name pointing at the same content.

## Subscribe button: fixed bright yellow, not the theme's `brick` token

- **`MastheadNav.jsx`'s Subscribe button (`bg-brick` → literal `bg-[#F5C518]`), text flipped from `text-paper` to `text-ink`.** `bg-brick` already defaults to this exact bright yellow (`DEFAULT_SITE_SETTINGS.brick_color`, since the earlier NYRA colour pass), so on a freshly-provisioned site with no theme customisation this button already rendered this way — but `brick` is admin-editable (`/admin/theme`), and an existing site's `site_settings` row keeps whatever value it was set to independent of what the *code's* default later becomes, the same class of drift the display-font fallback hit earlier in this file's history. A fixed literal is the only way to guarantee this specific button reads as bright yellow regardless of that — matching the precedent already set for this exact accent elsewhere (the worm's stroke colour, the crossword's selected-cell highlight, the drop-cap's default) being hardcoded rather than theme-referenced.
- **The text colour needed to flip, not just the background.** White (`text-paper`) on `#F5C518` is a real contrast failure — light yellow behind white text is close to unreadable — and every other place this yellow already appears as a *background* (the puzzles-section cards, `PuzzlesSection.jsx`) already pairs it with dark `text-ink`, never white. `hover:bg-ink` (unchanged) needed a matching `hover:text-paper` added alongside it, since dark-ink text on the hover state's dark-ink background would otherwise vanish.
- Verified via Playwright: computed background/colour at rest read `rgb(245, 197, 24)` / `rgb(28, 27, 23)` (`#F5C518` / `ink`), and after a real `hover()` read `rgb(28, 27, 23)` / `rgb(255, 255, 255)` (`ink` / `paper`) — both states screenshotted to confirm the text is actually legible against each background, not just contrast-checked numerically.

## Masthead goes full-bleed, everything else gets a wider column

- **The masthead now runs edge-to-edge; the rest of the page didn't, but got wider.** Prompted by a screenshot: the header's hairline border visibly stopped short of the viewport edges while the article lead band below it ran full-width, an inconsistency that read as a bug even though the boxed masthead was actually the original, deliberate layout. Two separate asks, both now done: make the masthead itself full-bleed, and make everything else (which was staying boxed on purpose) noticeably less cramped without going all the way to edge-to-edge.
- **`Masthead.jsx` dropped `max-w-wide mx-auto`** from the div wrapping `MastheadNav` — just the horizontal padding (`px-4 sm:px-6 lg:px-12`) remains, so the header's `bg-paper` background, the tiled arch illustration (`HeaderArchesBackground`, already `w-full` and pattern-tiled — no changes needed there), and the nav row all now stretch to the true viewport width. Nothing about `MastheadNav.jsx` itself needed touching: the desktop row's `grid-cols-[1fr_auto_1fr]` already centres the wordmark and pins Subscribe to the far edge relative to whatever width its container actually is, and the nav links row is already `justify-center` — both scale up to a full-bleed container exactly the way they scaled to a boxed one.
- **A new `max-w-wider` (1440px) Tailwind token, distinct from the existing `max-w-wide` (1180px)** — deliberately not just bumping `wide` itself, since that token is also reused throughout `/admin`'s own dashboard chrome (toolbars, the media library, form pages) for its own internal consistency, unrelated to the public site's width; widening it in place would have widened admin screens nobody asked to change. `wide` stays exactly as it was; every public-facing (and public-mirroring) place using it swapped to the new `wider` token instead: `HomePageBody.jsx`'s main content column, `Footer.jsx`, `Newsletter.jsx`'s full-bleed-band-with-boxed-content pattern, `PostRenderer.jsx`'s article lead grid (its separate `max-w-content` prose column, further down the same file, stayed untouched — that's a reading-line-length measure, unrelated to this), and the crossword page/archive-detail page's own wide columns. `components/admin/LayoutCanvas.jsx` needed one matching change too — its homepage-builder canvas explicitly mirrors the real public homepage ("This is the actual homepage, in edit mode"), so its content wrapper tracks `wider` now to stay accurate, while the sticky admin toolbar bar just above it (a different div, admin-only chrome, not part of the mirrored page) deliberately stayed on `wide`.
- Verified via Playwright at a 1920px-wide viewport: the header element's real bounding box spans the full `0–1920` viewport width, while `#main-content` and the footer's inner div both measure exactly `1440px`, centred — confirmed at a standalone page (`/crossword`) too, not just the homepage, plus a 390px mobile check that nothing broke at narrow widths (both rows already collapse to their existing mobile layout regardless of the container's max-width, since neither was ever the thing constraining them on phone-sized screens).

## Footer: lighter still — near-white grey, not warm charcoal

- **`Footer.jsx`'s `bg-[#403E38]` (warm charcoal, previous entry below) → `bg-[#F5F5F5]` (near-white grey).** The charcoal version was correct in isolation but read as flat black in practice, sitting directly beneath the bold blue newsletter band above it — that much brighter blue made the charcoal look like the site's old near-black `ink` by simultaneous contrast, which is what prompted this follow-up (confirmed the charcoal *had* actually shipped and rendered correctly first — see the previous README entry — before concluding a lighter value was the right fix rather than a caching issue).
- **Every text/border colour in the footer flipped from the `text-paper`/NN opacity family to `text-ink`/NN** — nav links, social icons, `footer_text`, the copyright line, and the divider above `footer_text` (`border-paper/15` → `border-ink/15`). White text on `#403E38` was legible; white text on `#F5F5F5` would not be. This is the same dark-on-light hierarchy already used everywhere else on the page (article body copy, the masthead), not a new pattern invented for the footer — the footer was the one place still running the *inverse*, light-on-dark version of it.
- Verified via Playwright: `getComputedStyle(footer).backgroundColor` reads `rgb(245, 245, 245)` and `.color` reads `rgb(28, 27, 23)` (== `--color-ink`), confirmed screenshotted with all footer text legible against the new light background.

## The worm-weave reverted: back to a straight crossing, yellow kept, first entrance pushed to 15s

- **The weaving-through-the-letters motion (previous section, below) didn't work as intended once it was actually live — reverted back to the original straight horizontal crossing below the wordmark.** The user's own words: "That didn't work, please revert to previous worm movement." Sandbox Playwright verification at the time had forced the element through each keyframe stop and screenshotted convincingly overlapping the title — that check evidently didn't catch whatever went wrong on the real site (a live-data rendering difference, a real-browser interpolation quirk across the mixed `%`/`vw` `calc()` stops, or something else this sandbox doesn't reproduce). Rather than chase the discrepancy, reverted outright to the last known-good design, which is simpler and was never in question before the weave attempt.
- **What actually reverted**, all three files the weave restructuring touched:
  - `components/HeaderArches.jsx`'s `HeaderWorm()` — back to a single `<svg>` positioned by `bottom: BAND_H` (a static, non-`transform` property, so it never conflicts with the crossing animation's own `transform: translateX(...)`), no `top-1/2` centring, no nesting inside the wordmark's box.
  - `components/MastheadNav.jsx` — `<HeaderWorm />` moved back out of the wordmark's own wrapper div (dropping that div's `relative` class along with it, no longer needed once nothing inside it is absolutely positioned against it) and back to being a plain sibling of `HeaderArchesBackground` at the top of each masthead row, mobile and desktop both.
  - `app/globals.css`'s `header-worm-cross` keyframes — back to the plain two-stop form (`0%,77% { transform: translateX(-100%) }` / `100% { transform: translateX(110vw) }`), dropping the three intermediate `±14px` wobble stops and the `-50%` Y-centring folded into every stop. Also dropped `.header-worm`'s static base `transform: translate(-100%, -50%)` — that existed only to give `prefers-reduced-motion` visitors something sane to fall back to once *all* positioning lived inside the animated `transform`; with `bottom: BAND_H` back as the (always-present, animation-independent) vertical anchor, reduced-motion visitors correctly see the worm parked off-screen with no extra static rule needed, the same as before the weave attempt.
  - **Kept, deliberately, per the user's explicit instruction**: the bright yellow colour (`#F5C518`, stroke and both eye fills) — the weave detour's one change that did work as intended.
- **First crossing pushed from ~0.5s to ~15s post-load.** `components/HeaderWormSpeed.jsx`'s `FIRST_CROSSING_AT_S` constant (`0.5` → `15`) is the only input that changes — the negative-`animation-delay` technique itself is unchanged: `delay = -(holdDuration - FIRST_CROSSING_AT_S)`, where `holdDuration` (how much of the ~41s cycle is spent parked off-screen before crossing) doesn't depend on `FIRST_CROSSING_AT_S` at all, so it's unaffected by this change. For the ~1280px desktop case the CSS fallback is tuned for: `crossDistance = 1280×1.1 + 288 = 1696px`, `crossDuration = 1696/180 = 9.422s`, `cycleDuration = 9.422/0.23 = 40.966s` (unchanged from before), `holdDuration = 40.966×0.77 = 31.544s` (also unchanged), so the new `delay = -(31.544 - 15) = -16.544s` — replacing the old `-31.044s` fallback in `globals.css`'s `--worm-cross-delay`. Every crossing after the first is still one full ~41s cycle apart either way, since the delay only shifts which point in the cycle playback starts at, not the cycle's own length.
- Verified via Playwright against the real components (not the weave-era harness): confirmed `.header-worm` is once again a direct sibling of `HeaderArchesBackground` in both masthead rows (not nested inside the wordmark), confirmed `bottom: 40px` / no `transform` set on the resting element, confirmed the stroke/eye-fill colour is still `#F5C518`, confirmed the live `--worm-cycle-duration`/`--worm-cross-delay` custom properties on `document.documentElement` read `40.966s`/`-16.544s` exactly matching the hand-computed values above, and forced the animation to a mid-crossing `transform` to screenshot the worm as a plain horizontal line under the title (not weaving through it).

## The worm: bright yellow, and now weaves through the wordmark's letters

- **Colour**: the worm's stroke/eye fill went from its original literal pink (`#E8809B`) to bright yellow (`#F5C518`) — the same value the NYRA restyle already established as the site's bold-yellow accent (the crossword's selected-cell highlight, `brick_color`'s default). Still a literal hardcoded value, not `var(--color-brick)` — the worm keeps its own fixed colour regardless of what an admin sets the theme accents to in `/admin/theme`, the same reasoning as before this change, just matching that variable's *current* value on purpose rather than by reference.
- **Motion: the worm now weaves through the wordmark's own letters as it crosses, instead of sliding along a flat line below them in the arch band.** This needed a real restructuring, not just new keyframe numbers:
  - `HeaderWorm` moved from being an independent sibling of the wordmark at the masthead row level to being nested *inside* the wordmark's own wrapper (`MastheadNav.jsx`, both the logo-image and plain-text branches) — its vertical positioning (`top-1/2`) is now relative to the wordmark's own box specifically, not a fixed pixel offset from the row bottom tuned for one text size. Moving it doesn't change how far it travels horizontally: `translateX`'s `%` values resolve against the worm's *own* width regardless of which element contains it, not the container's, and `vw` is viewport-relative either way — only the vertical anchor actually depends on the new container.
  - `header-worm-cross` (`globals.css`) gained three intermediate keyframe stops inside the existing 77%-100% crossing window, each bobbing the worm ±14px around dead centre while `translateX` blends linearly from `-100%` to `110vw` at that stop's fraction of the crossing — enough undulation to read as weaving in and out of the letters as it passes, confirmed visually rather than assumed: forced the element through each stop's exact computed `transform` directly (the same "forced-into-view" Playwright technique used for every previous header-illustration change) and screenshotted each one, at both a width where the title wraps to two lines and one where it doesn't.
  - **Centring via `top: 50%` needs a `translateY(-50%)` to actually land on-centre** (`top: 50%` alone only aligns the SVG's own top edge to the container's midpoint) — folded into every keyframe's own `transform` value instead of set as a separate static one, since a CSS animation's transform fully replaces whatever static value shares that property rather than composing with it (the exact conflict the *original* bottom-anchored version sidestepped a different way, by keeping the static value on a non-transform property).
  - **A real accessibility regression caught before it shipped, not after:** with every position now living inside the animated `transform` and none of it static, a `prefers-reduced-motion` visitor (whose browser disables the animation entirely, per this file's existing blanket rule) would have seen the worm fall back to no transform at all — frozen fully visible at the left edge of the wordmark, not parked off-screen the way it always used to render for those visitors. Fixed by giving `.header-worm` a static base `transform: translate(-100%, -50%)` matching the animation's own resting keyframe — invisible while the animation runs (every frame overwrites it), but exactly what reduced-motion now falls back to. Verified directly with Playwright's `reducedMotion: "reduce"` context option, not just reasoned about: confirmed the element's real bounding box sits off-screen left, not at x≈0.

## Footer: warm charcoal grey instead of near-black

- `Footer.jsx`'s `bg-ink` → a literal `bg-[#403E38]`, a warm charcoal — closer to how NYRA's own footer reads (grey, not a solid black band) than the site's near-black `ink`. Chosen deliberately over the site's existing `steel` token (the established "grey," used for hairlines/captions): `steel` is light enough that it would have washed out the `text-paper/50`-style opacity hierarchy already used for the copyright line and footer_text — the new value is dark enough to keep all of that legible unchanged, while still reading unambiguously as grey rather than black. A one-off arbitrary value rather than a new named theme colour, matching how the crossword's own single-use `#F5C518` highlight is handled — nowhere else currently needs this exact shade.

## Sentence case on headers

- **`SectionHeader.jsx`'s `<h2>` no longer forces `uppercase`** — the shared homepage section heading (Article Carousel/"Latest reviews", Puzzles & Games, Cartoons) used to render whatever `title` text it was given as all-caps regardless of the underlying string's own casing. Also dropped the `tracking-[0.06em]` letter-spacing that went with it — that much tracking is tuned for all-caps legibility, and reads as unusually loose on ordinary mixed-case text.
- **The underlying title strings changed to match** — `lib/sections.js`'s `SECTION_HEADER_DEFAULTS`: "Latest Reviews" → "Latest reviews", "Puzzles & Games" → "Puzzles & games" ("Cartoons" was already one capitalised word, unaffected either way). "The Crossword" → "The crossword" (`app/crossword/page.jsx`'s `<h1>` and its card title in `PuzzlesSection.jsx`'s `GAMES` array), "Bermy on the Map, SE1" → "Bermy on the map, SE1" (`lib/theme.js`'s `page_copy.geoguesser.title` default and the matching `PuzzlesSection.jsx` card title) — "Bermy" stays capitalised as the game's own nickname, "Map" doesn't, matching ordinary sentence-case rules (capitalise the first word and proper nouns only).
- **Scoped to actual heading elements, not the small tracked-out category/kicker labels** ("BERMONDSEY", "FILM", "Across"/"Down" in the crossword's clue lists, the site's own wordmark) — those are a different, deliberate editorial convention (a magazine's eyebrow/section tag), not what "headers" meant here, and every one of them was left exactly as it was. Same reasoning for admin-only labels (`SECTION_REGISTRY`'s "Puzzles & Games"/"Article Carousel" — the layout builder's internal section-picker names) and `<title>`/meta tags, neither of which a visitor reads as an on-page header.
- Verified via Playwright, rendering the real `SectionHeader`/`PuzzlesSection` components directly: confirmed the rendered text is genuinely sentence case (not just visually — checked the actual DOM `textContent`, not a CSS transform hiding the real casing) and that the centred-hairline layout is otherwise untouched.

## NYRA-inspired restyle, part 2: square corners, stark rules, a text-only index

- **Every `rounded-sm`/`rounded-md`/`rounded-full` on the public site removed** — cards, buttons, images, category-filter pills, the crossword's own controls, form inputs. Squared-off corners are a small change individually, but consistently applied across ~40 elements they're a big part of what actually reads as "severe print journal" rather than "modern web design," which soft `rounded-sm` corners (even at a subtle 2px) quietly signal throughout. Scoped to public components only — admin's own dashboard chrome wasn't touched, same "stays on its own fixed design system" reasoning `ThemeVars.jsx` already documents for colour/fonts, even though corner radius isn't actually theme-driven the way those are.
  - Mechanical enough to do as a sweep (`sed` across ~13 files) rather than by hand, which is exactly what surfaced two real breakages a manual pass might have caught but a lazier one wouldn't: `focus:rounded-sm` and `[&_iframe]:rounded-sm` (`Masthead.jsx`'s skip-link, `BlockContent.jsx`'s embed block) both left a dangling, meaningless `focus:`/`[&_iframe]:` fragment behind — harmless (an incomplete Tailwind class generates no CSS, it doesn't error), but genuinely wrong syntax. Caught by grepping specifically for `variant:` immediately followed by a space or quote after the sweep, not just trusting the sed ran cleanly, and fixed by hand in both places.
- **`--rule` (the one CSS variable every `hairline`/`hairline-b` border already shares — masthead, article-listing dividers, section headers, the carousel) went from a soft warm grey (`#c9c1af`) to solid `ink` (`#1C1B17`).** One variable, every structural rule line on the site darkens together — a stark black hairline reads as a genuine print rule; the old warm grey read as a gentle web-design divider.
- **The article list itself: dropped the thumbnail entirely, text-only.** `ArticleCard.jsx`'s "regular" (list) variant used a 96–140px image/illustration next to every headline — removed, along with the two-column grid it needed, in favour of a dense stacked block (category, headline, dek, byline) with tighter `py-4` spacing (was `py-6`, no longer needing room for an image-height row). This is the actual "big" structural change, not just a colour/corner pass: NYRA's own listings read as a text index, not a photo grid, and repeating a thumbnail in every row of every list was the most decorative-feeling, least essential piece of imagery on the site. Deliberately kept the *single* lead image on the homepage's "featured" story and each article's own top-of-page hero band — one visual anchor per page is still reasonable; one per list row wasn't.
- Verified via Playwright with mock articles rendered through the real `ArticleCard`/`PostRenderer`/`Masthead`/`Newsletter`/`Footer` components (not just eyeballing CSS): confirmed the list renders text-only with visibly darker dividers between rows, square corners throughout, at both a desktop and a 390px mobile width.

## NYRA-inspired restyle: stripped-back colour, Libre Baskerville

- **Palette pared back to black/grey plus bold yellow and blue** — inspired by *The New York Review of Architecture*'s severe, unglamorous design language (one of three references the user brought — NYRA was picked as the one to actually chase, over *The Fence* and *The Paris Review*'s different, more polished directions). Concretely: `lib/theme.js`'s `DEFAULT_SITE_SETTINGS.brick_color` (`#9C6B42`, warm tan-brown) → `#F5C518` (the same bold yellow the crossword's selected-cell highlight already uses), and `river_color` (`#2B4C73`, muted dockside navy) → `#1D4ED8`, a genuinely bold blue rather than a darker tint of the old one. Since brick/river are the site's actual theme-editable accent colours (`components/ThemeVars.jsx`, `/admin/theme`), this one two-value change cascades everywhere they're already used — category-tinted article leads, link hovers, buttons, the newsletter band — without touching individual components. `ink`/`paper`/`steel` (the fixed black/white/grey trio) were left as they already were — they already matched the target look. **The viaduct/worm header illustration was deliberately kept** — the user was explicit about that; this is a colour and type change, not a strip-down of every illustrated element.
  - The token names `brick`/`river` stay as-is rather than a mechanical rename to something like `yellow`/`blue` — same reasoning as keeping the `archive` page-copy key when its public label became "Articles": renaming an internal identifier across every file that references it is real churn for zero behavioural difference, when a comment explaining "this used to be brick-brown, it's yellow now" does the same job.
  - **Every other hardcoded fallback matching the old hex values also needed updating, not just the two `DEFAULT_SITE_SETTINGS` entries** — found by grepping for the literal old hex strings rather than assuming the two "real" definitions were the only ones: `PostRenderer.jsx`/`PostForm.jsx`'s `accentHex` JS-level fallbacks, `PageForm.jsx`/`PageRenderer.jsx`/`BlockEditor.jsx`'s fixed `ACCENT_HEX`/`DEFAULT_ACCENT` constants, `PuzzlesSection.jsx`'s `color-mix()` card backgrounds, `globals.css`'s `--drop-cap-color` fallback, `GeoMap.jsx`'s guess/correct marker-dot colours and keyboard-picking crosshair stroke, and `tailwind.config.js`'s own `--color-brick-rgb`/`--color-river-rgb` fallback numbers (recomputed via the same `hexToRgbChannels` logic `lib/color.js` uses) — each of these is a real fallback used when `ThemeVars` hasn't loaded or doesn't apply (admin chrome, a component rendered before settings resolve), not just documentation, so leaving any of them on the old hex would have meant "the site is yellow/blue, except in this one spot which is still brown/navy."
- **Display font: Zilla Slab → Libre Baskerville.** The user asked for "Baskerville Pro" specifically — that's a commercial/licensed typeface, not available through Google Fonts, which is how every font this site's theme editor offers actually gets loaded. "Libre Baskerville" (a free, open, well-regarded Baskerville revival) was already sitting in `DISPLAY_FONT_OPTIONS` as a selectable option before this — the closest legitimate match, not a silent substitution invented on the spot.
  - **Changing `DEFAULT_SITE_SETTINGS.display_font` alone wasn't sufficient — and the reason why is worth understanding, not just the fix.** `ThemeVars.jsx` only injects a separate Google Fonts `<link>` when the *live* `display_font` differs from the coded-in default, specifically so the common case (nobody's touched the font picker) costs zero extra requests, since the default font is already self-hosted via `next/font/google` in `app/layout.jsx`. That optimisation assumed the self-hosted font and the coded-in default were always the same font — true by construction, until this change made them different (default now says "Libre Baskerville", but `app/layout.jsx` was still self-hosting Zilla Slab). The result: the "no extra loading needed, this is the default" fast path would have kept serving Zilla Slab forever, silently, on any install that never touches the theme editor — the exact common case the optimisation exists for. Fixed by actually swapping what `app/layout.jsx` self-hosts (`Zilla_Slab` → `Libre_Baskerville`, weights `400`/`700` — this family has no true `600` in Google's catalog, unlike Zilla Slab), and renaming the CSS variable it feeds (`--font-zilla` → `--font-libre-baskerville`, updated everywhere it's referenced: `tailwind.config.js`'s font-family fallback chain, `globals.css`'s drop-cap rule) so a future reader isn't looking at a variable called "zilla" holding Baskerville.
- Verified via Playwright: the new brick/river RGB values actually reach `--color-brick-rgb`/`--color-river-rgb` at render time, `getComputedStyle` on the rendered heading confirms Libre Baskerville is genuinely the applied font (not silently falling back), and the wordmark at 320px (the narrowest common phone width, the same threshold every previous title-length check in this file used) still wraps cleanly without colliding with the arch band underneath — same graceful-growth mechanism confirmed when the name itself got longer.

## Renamed back to "The Bermondsey Review of Books"

- Same rename mechanics as the "Bermy Review" and "The Worm" ones before it: every hardcoded occurrence of "The Worm" updated — `lib/theme.js`'s `DEFAULT_SITE_SETTINGS.site_title` (the fallback, not the live value), the root layout's static `<title>`, the admin login screen and sidebar, Guess the Spot's static metadata title, the post-preview iframe's title template, and `supabase/schema.sql`'s own column default (both the live `create table` default and the "existing installs" migration comment). **The live site's actual name is still stored `site_settings` data** — change it at `/admin/site` → Identity → Site title.
- **A real, caught-by-testing regression, not a hypothetical one: the masthead's mobile wordmark first appeared to overlap the arch illustration strip underneath it once the (longer) new name wrapped onto two lines at 320px.** Dropped the mobile size from `text-2xl` to `text-xl` to force it back onto one line — but then measured the *actual* two-line case precisely (bounding boxes of the wordmark vs. the arch band's SVG, not just eyeballing a screenshot) before shipping that fix, and found no real collision: the row's `pb-12` is padding *after* the title, so the row (and the arch band bottom-anchored to it) grows to fit however many lines the title takes, preserving the same ~8px gap whether it's one line or two — exactly the same mechanism desktop's own wordmark row already relies on, one line at ≥1024px and two between 640–1023px, with nothing special done for it there. What actually looked like an overlap in the first screenshot was the animated worm creature (`HeaderWorm`, which periodically crosses the strip) happening to be mid-transit at that exact screenshot moment, not a static collision. **Reverted the font-size change** — `text-2xl` is back, two-line wrapping for a longer `site_title` is confirmed-handled, not a bug — and rewrote the comment explaining the sizing to describe what's actually true instead of a plausible-but-wrong theory.

## Guess the Spot: optional Esri vector basemap

- **`components/GeoMap.jsx` can now use Esri's styled vector basemap instead of plain OpenStreetMap raster tiles** — the same basemap `github.com/gregmortonbenches/benches-map` (a separate, sibling project) already uses, and noticeably nicer-looking than OSM's default raster style. Gated behind a new `NEXT_PUBLIC_ESRI_TOKEN` env var (documented in `.env.local.example`): set, it renders via `esri-leaflet-vector`'s `vectorBasemapLayer("arcgis/colored-pencil", { token })`; unset, it falls back to the original free OSM `<TileLayer>`, unchanged. Esri's vector basemaps need a paid/metered ArcGIS Location Platform account token — rather than reuse `benches-map`'s own token (hardcoded in that project's client-side JS, tied to its account's billing/quota), this app reads its own from its own env var, so turning it on is a deliberate choice made once, in this project's own hosting config, not a silent cross-project credential share.
- **A real bug, caught by testing rather than just reasoning about it: the natural-looking `L.esri.Vector.vectorBasemapLayer(...)` global-namespace call throws under Next.js** ("Cannot read properties of undefined (reading 'Vector')"). That pattern only exists on `esri-leaflet`'s classic UMD `<script src="...">` build — what a plain static site loading it off a CDN gets (again, exactly what `benches-map` does) — patching a global `L.esri` namespace as a side effect. A bundler resolves the package's ESM entry instead (its `"module"` field), which is just plain named exports and never touches `L.esri` at all. Fixed by switching to `import { vectorBasemapLayer } from "esri-leaflet-vector"` and calling it directly, no global namespace involved.
- Verified via Playwright with the token unset (OSM tiles still load, zero regression) and set to a placeholder value (no thrown errors, the map container renders, the attribution control correctly swaps from "© OpenStreetMap" to Esri's, and the existing click-to-guess crosshair/marker UI is untouched) — actual tile *imagery* couldn't be confirmed in this sandbox, which has no outbound network access to either tile provider, so the real visual difference will only be checkable once a genuine token is set on a deployed environment.

## Crossword: Check/Reveal/Clear moved above the grid, one consistent style

- The three action buttons moved from below the grid to just above it (still inside the same column, right after the hidden solving input) — a small layout change, not a functional one; `handleCheck`/`handleReveal`/`handleClear` are untouched. "Reveal puzzle" also shortened to just "Reveal", matching "Check" and "Clear"'s one-word labels.
- **All three now share the same bordered-button styling** (`border border-steel/40 ... hover:border-river`) — Reveal and Clear used to be plain underlined text links, a lighter treatment that read as "secondary" next to Check's bordered button, even though all three are equally valid, equally reversible actions (Clear undoes Reveal, Check doesn't destroy anything). One consistent style for all three removes that implied hierarchy.

## "The Latest" renamed to "Articles"; its sub-heading removed

- `lib/theme.js`'s `page_copy.archive.title` default: "The Latest" → "Articles" — the same admin-editable heading `components/ArchiveBody.jsx` renders at the top of `/latest`. The one-line description underneath it (`copy.description`) is gone from that page entirely, not just blanked — `ArchiveBody.jsx` no longer renders it at all.
- **The admin's WYSIWYG editing canvas for this page (`PageCopyEditCanvas.jsx`, shared with Guess the Spot's own copy-editing tab) had to lose the description *field* too, not just the real page's paragraph.** That canvas's whole premise, per its own doc comment, is "click what you see" — leaving an editable description textarea there once the real page no longer shows one would mean editing something with no visible effect, silently orphaned. Added a `showDescription` prop (default `true`, so Guess the Spot's own description field is untouched) and pass `showDescription={false}` only from the "archive" tab in `AdminLayoutTabs.jsx`. Verified via a harness rendering both canvases side by side: the Articles one has no textarea, Guess the Spot's still does.
- Every other on-page mention of the old name updated to match, so the rename doesn't leave stale references dotted around: the admin's tab strip and preview-frame switcher (both previously labelled "The Latest"), the 404 page's "Browse The Latest" link and body copy, and a hint string in the post editor's cover-image field. The nav link labelled "Reviews" (which also points at this same page) was deliberately left alone — that's a separate, already-intentional public label this request didn't touch.

## Crossword: Clear button, and an archive of past puzzles

- **Clear** joins Check/Reveal puzzle under the grid (`CrosswordGame.jsx`'s `handleClear`) — resets every guess back to blank, clears any Check-marked wrong cells, and drops the `revealed` flag, the same three pieces of state `handleReveal` touches, just resetting them rather than filling them in.
- **A public archive of every past puzzle**, not just the current one — `/crossword` only ever showed the single most-recently-published crossword (by design, see the "current puzzle = most recent row" note above), with no way to reach anything published before it. Added `/crossword/archive` (a listing, newest first, mirroring the admin list page's own row style — date, grid size, a "Current" pill on the top one) and `/crossword/archive/[id]` (the same `CrosswordGame` component, just fed a specific past puzzle via the id in the URL instead of always the most recent one), plus a link to the archive at the bottom of `/crossword` itself. `lib/crossword.js` gained `listCrosswordsForArchive` — the identical query `listCrosswordsForAdmin` already ran, exposed under its own name rather than reused directly, since a public page importing something named "ForAdmin" would read as a permissions bug even though RLS already makes the table public-read either way. `getCrosswordById` (already existed for the admin edit route) is what the `[id]` page reuses to fetch one specific puzzle. Verified via Playwright: Clear wipes guesses and wrong-marks in one click, the archive listing and a bogus `/crossword/archive/[id]` both fail gracefully (empty state / real `notFound()` 404) rather than crashing when Supabase is unreachable, and the archive link renders correctly on the main page.

## Crossword tagline: "an SE1 twist"

- `app/crossword/page.jsx`: "A fortnightly crossword with a Bermondsey twist." → "A fortnightly crossword with an SE1 twist" — the postcode instead of the neighbourhood name, no trailing period. Updated in both spots it appeared: the page's own tagline text and its `generateMetadata` description.

## The Crossword: a full in-browser fillable grid

- Built out `/crossword` from its old stub into a real NYT-style solver, backed by a new admin authoring UI — the `crosswords` table already existed in `supabase/schema.sql` (RLS-enabled, zero policies, so deny-all except `service_role`) but nothing wrote to or read from it. Follows "Guess the Spot"'s established shape wherever it applies: one row = one puzzle, "the current puzzle" is just the most recently created row (`getCurrentCrossword`, `lib/crossword.js` — same pattern as `getCurrentRound`), and the RLS policies are the same 4-policy split (public `select`, admin-only `insert`/`update`/`delete` gated on `profiles.role = 'admin'`) already used for `geoguesser_rounds`. Deliberately did *not* route this through the pre-existing `issues` table (which has an unused `crossword_id` column clearly meant for "bundle a crossword with a specific issue") — that's a real feature nothing else in the app uses yet, and building it out wasn't what was asked for.
  - **Existing installs need the 4 new `create policy ... on crosswords` statements run once** (added to `supabase/schema.sql` right after the `geoguesser_rounds` policy block) — the table itself and its RLS-enabled state already exist, only the policies are new.
- **The puzzle's solution ships to the browser, in full, with the page load — a deliberate, explicit divergence from Guess the Spot's coordinates, which stay server-only and are checked via a round trip to `app/api/geoguesser/guess/route.js`.** Asked and confirmed before building: a crossword's fun is the solving, not the secrecy — same trust model as a printed puzzle, where the answer key is one page away the whole time — and instant, no-network per-letter/per-word checking needs the answer available locally. Guess the Spot's coordinates hide *because* hiding them is the entire point of that game; a crossword has no equivalent reason to keep its grid secret from someone who's decided to peek. Documented directly in the RLS policy comment in `schema.sql` and again at the top of `components/CrosswordGame.jsx`, so the asymmetry with Guess the Spot reads as intentional to the next person touching either file, not as an inconsistency to "fix."
- **One shared layout function, so the admin editor and the public solver can never disagree about numbering.** `lib/crossword.js`'s `computeCrosswordLayout(grid)` takes the raw `grid_json` — just a rows×cols array of single-letter cells, `"#"` for blocked — and derives everything else a crossword needs: standard row-major numbering (a cell gets a number if it starts an across and/or down word of length ≥2; a single cell can start both and shares one number between them), and the full list of "slots" (each a direction, start position, length, and ordered list of cell coordinates) that both the clue-authoring UI and the solving grid key off. Nothing about numbering or slot boundaries is authored directly or stored separately — an admin only ever edits the letter grid itself, and both surfaces derive the same layout from it live.
- **Admin authoring** (`app/admin/crossword`, `components/admin/CrosswordForm.jsx`): a list/new/edit trio mirroring the Guess the Spot admin routes exactly. The grid editor is click-and-type rather than drag-and-drop — click a cell then type a letter (auto-advances), `.`/`#` toggles a cell blocked, arrow keys move the selection — with clue inputs generated live underneath, one per slot `computeCrosswordLayout` finds, labelled by its number and direction. Resizing (rows/cols number inputs + Apply) asks for confirmation via the same `ConfirmDialog` the delete flow uses, and preserves overlapping cell contents rather than blanking the whole grid on every size change. Autosaves 1.5s after the last edit, same debounce pattern as elsewhere in the admin.
- **The public solver** (`components/CrosswordGame.jsx`) uses a single always-focused `<input className="sr-only">` to capture keystrokes rather than 49+ individually-focusable per-cell inputs — the standard technique for reliable virtual-keyboard support on mobile, since a real `<input>` is what actually triggers a keyboard to appear. Clicking a cell selects it and infers a direction (preferring whichever direction was already active if the new cell still participates in a slot that way); clicking the *already-selected* cell toggles between across/down, the same convention NYT-style solvers use for word-dense cells. Backspace follows the standard convention verified against real crossword apps: if the selected cell has a letter, clear it and stay put; only retreat to the previous cell if the selected cell was already empty (delete-then-retreat, not retreat-then-delete). "Check" marks any filled, non-blocked, incorrect cell; "Reveal puzzle" fills in the full solution and swaps the completion banner's copy accordingly; solving correctly (all cells filled and correct, checked via a live `useMemo` diff against `grid.cells`) shows a "Solved it! 🐛" banner.
  - **A real bug found via testing, not a pre-existing one: the very first click of a session could silently flip the starting direction.** `selected` defaults to the first slot's start cell on mount so the grid doesn't look inert before any interaction — but the "click the already-selected cell toggles direction" handler had no way to distinguish that default pre-selection from a genuine repeat click, so a visitor whose first-ever click happened to land on that same pre-highlighted cell got toggled from across to down before typing a single letter. Fixed with a `hasInteractedRef` (a plain `useRef(false)`, flipped `true` on every real click/keystroke) gating the toggle branch — confirmed fixed by typing immediately after one first click and checking the letters land across, not down.
  - **Follow-up: blocking a cell in the admin editor was reported as "not really working."** The underlying logic was fine — verified via testing that blocking a mid-row cell correctly splits a 7-letter across word into two shorter ones and renumbers everything live — but the *only* way to trigger it was the "." keyboard shortcut, which depends on the grid container reliably holding focus after a click (fragile across browsers) and has no equivalent on touch devices, where there's no easy "." without switching keyboards. Added an explicit "Block/Unblock cell (row, col)" button under the grid, driven by a plain click with no keyboard/focus dependency, alongside the existing shortcut.
  - **Follow-up: the on-screen keyboard didn't appear when tapping cells on mobile.** The public solver's hidden always-focused `<input>` was styled with Tailwind's `sr-only`, which hides via `clip: rect(0,0,0,0)` — mobile Safari (and some Android browsers) treat a clipped-to-nothing element as effectively not on the page, so `.focus()` still succeeded (it genuinely became `document.activeElement`) without the browser ever raising its virtual keyboard, since that decision is a separate, stricter heuristic than plain focusability. Switched the input's hidden styling from clip-based to `opacity: 0` on a real, unclipped 1px box — same visual invisibility, but reads to the browser as a genuine focus target. Confirmed via a touch-emulated Playwright tap that the input still becomes `document.activeElement` and typing behaves identically; the on-screen-keyboard behaviour itself isn't something a headless/emulated browser can verify directly, so this rests on the well-documented clip-vs-opacity distinction rather than a reproduced screenshot of an open keyboard.
  - **Follow-up: the admin grid editor had no path to a mobile keyboard at all, not just the same clip-vs-opacity issue.** Unlike the public solver, it never used a real `<input>` for typing — a `<div tabIndex={0} onKeyDown={...}>` captured physical keydown events directly, which works for a mouse-and-keyboard admin but can never raise a virtual keyboard on a touch device, since browsers only do that for actual form controls regardless of focus. Brought it in line with `CrosswordGame.jsx`'s architecture: letters are now captured via a real hidden `<input>`'s `onChange` (opacity-hidden the same fixed way, not `sr-only`), while Backspace/arrow-keys/`.`-to-block stay on that same input's `onKeyDown` — same split the solver uses, and for the same reason: mobile virtual keyboards commit characters as input events, not always as reliable, individually-keyed `keydown`s. Verified via a touch-emulated Playwright tap that the hidden input (not the grid div) becomes `document.activeElement` and that typing still lands letters correctly, plus a full desktop regression pass (block-toggle via `.`, Backspace, arrow navigation) to confirm nothing existing broke.
  - **Follow-up: the admin editor still only ever typed rightward, unlike the NYT-style tap-to-switch-direction the public solver already had.** Once typing worked on a touch device, the next real gap was that filling a down word meant arrow-keying one row at a time — every letter typed still auto-advanced across regardless. Added a `typeDirection` state ("across"/"down") mirroring the solver's `direction`: tapping the already-selected cell again toggles it (same `hasInteractedRef`-guarded pattern as the solver, so the very first click on the default (0,0) cell doesn't spuriously toggle it), letter auto-advance and Backspace-retreat both follow whichever direction is active, and arrow keys set it to match whichever way you just navigated, so a letter typed right after arrowing down continues downward instead of snapping back to across. The instructions text now names the live direction ("typing advances across/down") as its own feedback, rather than a separate indicator.
  - **Follow-up: the public solver's selected-cell highlight (`bg-brick/[0.28]`, brick at low opacity over paper) read as beige rather than a colour, so it was swapped for a solid `#F5C518` yellow** — the same punchy, fully-opaque yellow real crossword apps use to make the active square unmistakable, rather than another translucent tint in the same family as the "active word" highlight next to it. Scoped to just that one spot (an arbitrary Tailwind value, `bg-[#F5C518]`, not a new named theme colour) rather than touching the palette itself — the admin editor's own selected-cell colour is blue (`bg-river/[0.18]`), not beige, and was left alone.

## Admin sidebar: collapsible on mobile

- `components/admin/AdminShell.jsx`'s `<aside>` was a fixed `w-56` (224px) column with no responsive behaviour at all — permanently visible, permanently eating a third or more of a phone-width viewport out of the already-narrow space left for the actual editing canvas next to it. Below the `lg:` breakpoint it's now an off-canvas panel: hidden by default, toggled open by a hamburger button in a new fixed mobile top bar, with a dimmed backdrop behind it (click to dismiss) and its own close (✕) button, reusing the existing `CloseIcon` from `components/admin/icons.jsx` plus a new `MenuIcon` added alongside it in the same style (16×16 viewBox, stroke `currentColor`). Implemented as a `translate-x-0`/`-translate-x-full` toggle on a `fixed` sidebar rather than actually unmounting it, so it's a cheap CSS transition rather than a remount on every open/close. From `lg:` up, nothing changed: the sidebar goes back to a normal static flex column, always visible, no hamburger bar, no top padding on the content area — the mobile-only chrome is entirely `lg:hidden`/overridden by `lg:static lg:translate-x-0`.
  - Closes itself automatically once a nav link's navigation actually completes (a `useEffect` on `pathname`, not an `onClick` per link) — covers every link in the panel, including the dynamically-rendered outline/page-switcher ones, without needing to thread a close handler through each.

## Worm slowed again

- `components/HeaderWormSpeed.jsx`'s `WORM_SPEED_PX_PER_S` — `210` → `180` (another ~15% slower, same relative step as the previous slowdown). `app/globals.css`'s fallback values recalculated to match again: `40.966s` cycle, `-31.044s` delay. Verified the same way as both previous timing changes: ~172px/s at 375px, ~177px/s at 1280px — close to the new 180px/s target and still matched between viewport widths.

## Footer back to black; worm slowed slightly

- **Footer reverted**: `bg-paper text-ink` → back to `bg-ink text-paper` (and every dark-on-light colour from that change back to its white-on-dark equivalent — `text-ink` nav links → `text-paper/80`, `text-steel hover:text-ink` social icons → `text-paper/80 hover:text-paper`, etc.), undoing the earlier "footer background to white" request — asked for, tried, didn't land, reverted back to the original exactly as it was.
- **Worm slowed**: `components/HeaderWormSpeed.jsx`'s `WORM_SPEED_PX_PER_S` — `245.8` → `210` (roughly 15% slower). Since this one constant is what the constant-speed calculation (see the entry below on making the crossing speed viewport-independent) derives everything else from, slowing it applies equally on every screen size, not just one — "on both" was already guaranteed by the fix that made them match in the first place. The CSS fallback values in `app/globals.css` (rendered before `HeaderWormSpeed`'s effect runs, or with JS disabled) recalculated to match: `35.114s` cycle, `-26.538s` delay, replacing the previous `30s`/`-22.6s`. Verified by re-running the same real-position-sampling check used for the original constant-speed fix: 210.3px/s at 375px, 209.0px/s at 1280px — both landing on the new 210px/s target, still matched to each other.

## A favicon: the worm's face

- `app/icon.svg` — Next's file-based convention (drop `icon.svg`/`.png`/etc. straight into `app/`, no `layout.jsx` metadata needed; confirmed it auto-injects `<link rel="icon" href="/icon.svg" type="image/svg+xml">`). Just the worm's head, not the full segmented body — a favicon renders as small as 16px, where five thin ring-lines on a long capsule would just blur into noise, and the header illustration's own 1.75-unit stroke weight all but disappears at that size regardless. Filled solid pink with two white eyes instead of line art, for the same reason: a silhouette with contrasting eyes still reads at 16px; a thin outline doesn't. Checked at 16/32/64px — legible-if-abstract at 16px (about as good as favicons generally get), clearly a face by 32px.

## The worm now crosses at a constant speed on every screen

- The crossing always took a fixed ~7s regardless of viewport width, but the *distance* it covers never was fixed — the endpoint is `translateX(110vw)`, so a wide desktop window makes it travel much further than a narrow phone in that same fixed time. Same time, different distance reads as different speed, even though the animation itself never changed between screens.
- **Not fixable in pure CSS** — there's no way to derive a time value (`animation-duration`) from a length value (`vw`) inside `calc()`. Needed a little JS, kept as small and isolated as possible: `components/HeaderWormSpeed.jsx`, a new client component that renders nothing — its only job is computing the right crossing duration for the current viewport and setting it as a CSS custom property on the document root, which `.header-worm` (`app/globals.css`) reads via `var(--worm-cycle-duration, 30s)` / `var(--worm-cross-delay, -22.6s)`. The rest of the header illustration (the arches, the worm's own shape, `MastheadNav.jsx`) stays server-rendered, untouched — one tiny client component bolted on, not a wholesale conversion.
  - The math: `crossDistance = viewportWidth * 1.1 + wormWidth` (the same distance the old fixed `-100%` → `110vw` keyframes always implied, just computed explicitly now), divided by a target speed (`245.8px/s`, chosen as *the original fixed animation's own speed at a 1280px desktop* — so that reference case is completely unchanged) gives the cross-phase duration. Dividing that by the keyframes' own 23% cross-phase fraction gives the full cycle duration, and the same negative-delay technique used for every previous "when's the first crossing" tweak this session derives the delay needed to still land the first crossing at 0.5s. The var() fallbacks in globals.css are the original fixed values — what renders before the effect runs, or with JS disabled.
  - Runs once on mount and again (debounced 200ms) on window resize — found the visible `.header-worm` instance the same way this session's own verification scripts have all season (`getBoundingClientRect().width > 0`, since the mobile/desktop rows share the class and only one is ever actually visible at a time; `display:none` collapses the hidden one's width to zero).
  - Verified by sampling the worm's real on-screen position at fixed intervals at both 375px and 1280px viewports and computing speed from the slope of the moving samples: 245.4px/s and 245.6px/s respectively — matching the 245.8px/s target at both, and the 1280px case's computed CSS variables (`30.000s` cycle, `-22.600s` delay) landing exactly on the original fixed values, confirming the reference calibration is exact.

## Footer: white background instead of dark ink

- `components/Footer.jsx`: `bg-ink text-paper` → `bg-paper text-ink`, plus a `border-t border-steel/20` hairline added — without a dark background to set it apart from the page above, a plain colour swap with no separator would leave the footer reading as a continuation of whatever's above it rather than its own section, so the hairline (the same separator convention used everywhere else on the site: the masthead's own rows, the crossword/geoguesser page headers) does that job instead. Every text colour built for white-on-dark needed the equivalent dark-on-light swap, not just the background: `text-paper/80` nav links → plain `text-ink` (dropping the opacity now that full contrast doesn't need softening, matching how the masthead's own nav links are styled); `text-paper/80 hover:text-paper` social icons → `text-steel hover:text-ink` (the site's standard muted→full-strength hover pattern, same reasoning as everywhere else — icons have no text content, so this stays opacity/colour-based rather than an underline the way text links get); `text-paper/70`/`border-paper/15` footer-text paragraph → `text-steel`/`border-steel/20`; `text-paper/50` copyright line → `text-steel/70`, preserving the original relative hierarchy (copyright was the most faded line before, still is).

## Newsletter heading: "Get the newsletter"

- `components/Newsletter.jsx`: "Get the next issue in your inbox" → "Get the newsletter" — shorter, plain copy for the sign-up band's heading.

## Worm pink, bigger eyes, first crossing at 0.5s

- **Colour**: the worm's stroke switched from `stroke-river` (one of the site's two theme accents, admin-editable at `/admin/theme`) to a literal `stroke-[#E8809B]` — a deliberate, non-theme-tied "worm pink." Using `river` was inherited from the train it replaced, where a theme colour made sense (a train has no inherent colour of its own); a worm's colour is its own, not something that should shift if someone later changes the site's brick/river accents. The eye dots' fill switched to match, from `fill-river` to the same literal pink.
- **Eyes**: radius bumped `1.3` → `1.8` (roughly 40% bigger) so they read as more clearly "eyes" rather than barely-visible flecks — a worm's eyes are more central to its own personality than the train's single headlight dot ever was, so it earns a bit more visual weight.
- **Timing**: same negative-delay technique used for every previous "when does the first crossing happen" tweak this session — `animation-delay` (`app/globals.css`) `-20.1s` → `-22.6s`. With a 30s cycle split 77% hold (23.1s) / 23% cross (6.9s), the remaining hold time before the first crossing is `23.1s - |delay|`, so `-22.6s` leaves 0.5s of hold instead of the previous `-20.1s`'s 3s. Every crossing after the first is still a plain 30s apart. Verified two ways: an isolated harness (not the real homepage — this sandbox's missing Supabase env crashes `PageViewTracker`'s client-side effect, wiping the DOM mid-test) sampling the worm's actual position at browser-clock-measured intervals (immune to Node↔browser navigation-timing noise, unlike wall-clock `Date.now()` sampling from outside the page, which turned out too coarse for a sub-second window — page load itself took ~0.8s) — off-screen through 0.64s, visibly moving by 0.79s.

## The worm's first crossing now starts at 3s, not 10s

- `.header-worm`'s `animation-delay` (`app/globals.css`): `-13.1s` → `-20.1s`. Same negative-delay technique used for every previous "when does the first crossing happen" tweak this session — with a 30s cycle split 77% hold (23.1s) / 23% cross (6.9s), the remaining hold time before the first crossing is `23.1s - |delay|`, so `-20.1s` leaves 3s of hold before the worm starts moving, instead of the previous `-13.1s`'s 10s. Every crossing after the first is still a plain 30s apart — a negative delay only shifts where in the cycle the animation *starts*, not the cycle's own length. Verified by sampling the worm's actual `getBoundingClientRect()` at fixed real-time intervals after page load (an isolated harness, not the real homepage — this sandbox's missing Supabase env crashes `PageViewTracker`'s client-side effect within a couple of seconds, wiping the DOM before a real 10s-plus timing test could finish): off-screen through 2.7s–3.1s, visibly moving by 3.3s.

## Renamed to "The Worm"; the header train is now a worm

- Same rename mechanics as the previous "Bermy Review" one: every hardcoded occurrence of "Bermy Review" updated to "The Worm" — `lib/theme.js`'s `DEFAULT_SITE_SETTINGS.site_title` (the fallback, not the live value), the root layout's static `<title>`, the admin login screen and sidebar, Guess the Spot's static metadata title, the post-preview iframe's title template, and `supabase/schema.sql`'s own column default. **The live site's actual name is still stored `site_settings` data** — change it at `/admin/site` → Identity → Site title.
- **The header's crossing train (`components/HeaderArches.jsx`) is now a worm** — same size, crossing the same way, only what's actually drawn changed. Renamed `HeaderTrain` → `HeaderWorm` (and the CSS class `.header-train` → `.header-worm`, `MastheadNav.jsx`'s import/usage) throughout, so a future reader isn't looking at a component called "train" that draws a worm — the crossing *timing* values themselves (30s cycle, `-13.1s` delay, the 77% hold/23% cross split) were left completely untouched, only the identifier strings changed.
  - The shape: the train's straight-sided body with a pointed nose (`M8 8 H438 Q458 8 464 24 Q466 32 460 40 H8 Z`) became a rounded capsule — a soft single-curve taper at the tail (left, trailing) and a fuller double-curve round at the head (right, leading, keeping the train's "leading edge on the right" convention so it still reads as moving forward once it starts crossing): `M8 24 Q8 8 24 8 H442 Q466 8 466 24 Q466 40 442 40 H24 Q8 40 8 24 Z`. Same viewBox (`0 0 472 40`), same stroke width, same bounding box (x: 8–466, y: 8–40) — a literal "same size" swap, not a rescale.
  - The train's four carriage-joint lines stayed at the same four x-positions (94/180/266/352), reinterpreted as worm segment rings — this is what actually reads as "worm" rather than "blank capsule": a plain rounded-rectangle outline alone looks like a pill, not a creature, the same way the joint lines were doing real work for the train (nothing said "railway carriage" about an unbroken rectangle either). The train's single headlight circle and cab-window detail (both train-specific, no worm equivalent) were replaced with two small dot eyes near the head instead.
  - Verified with the same forced-into-view / forced-off-screen Playwright technique used for every previous header-illustration change this session: confirmed the segment count and rounded-capsule shape at a close crop, and separately confirmed the resting position (`translateX(-100%)`) still clears the strip fully now that the outline shape (not just the bounding box) has changed.

## The newsletter form is now a real Supascribe embed

- `components/Newsletter.jsx`'s placeholder `<form>` (never wired to anything — see the previous "Wired to Supabase + Resend in step 2" comment it carried) replaced with a real, working sign-up widget: [Supascribe](https://supascribe.com), a third-party service the user found that customises a Substack embed. Two pieces, both exactly as Supascribe's own snippet specifies: the target `<div data-supascribe-embed-id="4462233900" data-supascribe-subscribe />` their script finds and replaces with the actual form, and their loader script, added via `next/script` (`strategy="lazyOnload"`, since this is a below-the-fold sign-up box with no reason to compete with anything on the critical rendering path) rather than a raw `<script>` tag, so Next handles injection timing and dedup itself.
- **Checked what the script actually does before wiring it in**, since embedding it means giving a third party code-execution on the site: fetched it directly and read the source rather than taking it on faith. It's a legitimate-looking embeddable widget product, not anything that reads as malicious (no obfuscated `eval`, no credential harvesting) — but it does three things worth knowing about, all normal for this category of tool but not obvious from the two-line snippet alone: a subscriber's email POSTs to Supascribe's own API (`supascribe.com/api/subscribe`), which forwards it on to the linked Substack (`thebermondseyreview.substack.com`) rather than the browser talking to Substack directly; it sends a view-tracking beacon to `events.supascribe.com` on every impression; and it loads Tailwind's CDN build (`cdn.tailwindcss.com`) at runtime for its own styling, which Tailwind's own docs say isn't meant for production use — a bit heavier than a minimal embed ideally would be, though not a security concern, just a performance one.
- **Not fully end-to-end verified** — the widget itself couldn't be rendered live in this sandbox: Chromium's proxy negotiation resets the connection to `js.supascribe.com` specifically, even though the exact same URL fetches fine via `curl` through the identical proxy (confirmed the script itself, its content, and this app's own `<script>`/`<div>` tags are all correctly wired via direct inspection instead — see above). Worth a quick visual check on the real site once deployed, to confirm the widget actually renders and its colours (currently a white card/blue button, set on Supascribe's own dashboard) read well against the newsletter band's dark `river` background.

## Cartoons rail: one full card on mobile, swipeable

- Mobile previously used the same peek-carousel pattern as the article carousel above it (`w-[80%]`, later `xs:w-[55%]`) — always showing a bit of the next cartoon at the edge. Changed to `w-full sm:w-[38%] lg:w-[30%]`: below `sm:` (640px), each card takes the entire available width (inset by the container's own `px-4`, so it sits centred with even margins either side, not left-aligned with empty space to the right), meaning exactly one cartoon is visible at a time — swipe (the same native `overflow-x-auto`/`snap-x` scrolling that was already there, no new interaction code needed) to bring the next one fully into view. `sm:`/`lg:` untouched, so desktop keeps the existing multi-card peek layout exactly as it was. The image's `sizes` hint updated to match (`80vw` → `100vw` below 640px), so the browser now requests a properly-sized image for how wide it's actually rendered, not a deliberately-undersized one.

## Fixed: `xs:` was a dead breakpoint

- `components/ArticleCarousel.jsx` and `components/CartoonsSection.jsx` both used an `xs:` variant (`w-[68%] xs:w-[46%] sm:w-[27%]`, `w-[80%] xs:w-[55%] sm:w-[38%] lg:w-[30%]`) as their middle sizing tier — but `xs` was never actually defined as a breakpoint anywhere (`tailwind.config.js` had no `screens` entry at all). Tailwind's JIT only emits CSS for a variant it recognizes, so every `xs:` utility in the whole codebase was silently generating nothing — confirmed by grepping the compiled build output for `xs\:`, zero matches. The practical effect: both carousels kept their smallest-phone width (68%/80%, meant only for the very narrowest screens) all the way up to `sm:` (640px) instead of stepping down partway there, so on a mid-size phone the first two cards showed noticeably wider — and the second one correspondingly less-peeked — than the three-tier design intended. Fixed by actually defining the breakpoint the code was already written assuming existed: `theme.extend.screens: { xs: "480px" }`. Verified before/after with an isolated harness measuring the first carousel item's rendered width across several viewport widths — 320-460px unchanged (68%, correctly still the smallest tier), 480-600px now genuinely narrower (46%) rather than stuck at 68%.
- **A related, separate finding — a design call rather than a bug, since fixed structurally**: `CartoonsSection.jsx`'s cover images cropped to `aspect-[4/3]` (landscape) via `object-cover`, defaulting to a *centred* crop when a post has no saved focal point (`cover_image_focal_x/y`, set per-image in the post editor — see `lib/media.js`'s `focalPointStyle`). For any cartoon whose source art is taller than 4:3 — plausible, since single-panel cartoons are often square or portrait — a centred crop discards roughly equal amounts off the *top and bottom alike* (confirmed with a marked test image: a 2:3 portrait source lost its outer top and bottom quarters, keeping only the middle half). If a cartoon's punchline or signature sits low in the frame, that reads as "cut off at the bottom" even though the top lost just as much. Chose the structural fix over relying on per-image focal points: `aspect-[4/3]` → `aspect-square`, keeping two-thirds of a tall source's height instead of half (re-verified with the same marked test image — all three coloured bands stay visible now, not just the middle one with slivers either side). `aspect-square` over the more portrait `aspect-[4/5]` alternative — enough of an improvement without the cards reading as unusually tall in a horizontally-scrolling rail sitting right below the article carousel's own landscape cards.

## Nav: "The Latest" jumps straight to the newest article

- Split what "The Latest" and "Reviews" actually mean in the top nav, which had drifted apart from their labels: "The Latest" pointed at `/` (the homepage) and "Reviews" at `/#carousel` (the homepage's carousel section) — neither one actually opened an article, and `/latest` (the real full-listing/archive page, despite its own name) wasn't linked from the nav at all. Now "Reviews" points at `/latest`, the archive of every past piece, matching what a visitor would expect that label to mean.
- **"The Latest" needed a genuinely new piece of infrastructure**: there's no fixed URL that could ever *be* "whichever article is newest" — every article has its own slug, and a new one is likely to publish every fortnight. Added `app/latest-article/route.js`, a route handler with no page of its own: it looks up whatever post is newest right now (`getLatestPublishedPost` in `lib/posts.js`, a dedicated `.limit(1)` query rather than reusing `getPublishedPosts()[0]`, which would fetch every published post's full row just to discard all but one) and issues a **307** (temporary, not permanent) redirect straight to that post's real `/article/[slug]` page. Temporary is deliberate — a 301/308 here risks a browser or CDN caching *this issue's* article as the permanent target, which is exactly wrong the moment a newer one publishes. The route is also explicitly `force-dynamic` with `revalidate = 0`: without both, a plain GET handler that never reads `cookies()`/`headers()` is a candidate for Next's static/ISR caching, which would freeze the redirect target at whatever was newest at *build* time — the one thing this route can never be allowed to do. Falls back to the homepage if the site has no published posts yet, or if Supabase is unreachable.
- `DEFAULT_SITE_SETTINGS.nav_links` (`lib/theme.js`) updated to match — same "code default, not the live value" caveat as every other `site_settings` field this session has touched: the actual live nav is edited at **`/admin/site`** → **Identity** → **Navigation**, where each link's href is already a free-text field (see its own "grab the exact link... from Layout" helper text) — just point "The Latest" at `/latest-article` and "Reviews" at `/latest`.

## A fifth carriage for the header train

- `components/HeaderArches.jsx`'s `HeaderTrain`: body span extended 8-352 → 8-438 (one more 86-unit carriage, same width as the existing four), viewBox widened 386 → 472 to match, and a fourth joint line added at the old body-end (352) to keep five carriages evenly spaced. The nose geometry — both paths past the body, plus the headlight circle — shifted the same +86 as a block, same shape throughout, just moved further right along with the now-longer body. Same pattern as the two previous "make it longer" changes: the rendered width classes also bumped (`w-56 sm:w-64` → `w-64 sm:w-72`, the same +32px jump used for the last +86-unit viewBox increase) — without that, a fixed CSS width with a wider viewBox would just squeeze the extra carriage into the same on-screen size rather than genuinely lengthening it. Verified via an isolated Playwright pass: forced the animation still and translated the train into view to confirm five evenly-spaced carriages and an unchanged nose/skirt shape, and separately confirmed the resting position (`translateX(-100%)`) still clears the strip fully now that the box itself is wider.

## Style: hex codes in the colour pickers

- The Primary/Secondary accent pickers on `/admin/theme` (`components/admin/ThemeEditor.jsx`) were bare `<input type="color">` swatches — the browser's own picker UI, no way to type or paste a hex code directly. Added a paired text field (`ColorField`, a small helper component in the same file) that stays in sync with the swatch either direction: pick a colour visually and the text updates, or type/paste a hex code and the swatch follows. Accepts a hex with or without the leading `#`, and the 3-digit shorthand (`f80` → `#FF8800`) — normalized and upper-cased before being saved, matching the format `DEFAULT_SITE_SETTINGS` already stores (`#9C6B42`, `#2B4C73`). While typing, an incomplete/invalid string (`#12`) is kept in the text field's own local state rather than pushed into the saved colour or force-corrected mid-keystroke — the native `type="color"` input would otherwise reject anything that isn't already a complete 6-digit hex. Only reverts (back to the last real colour) on blur, if what's left in the field still isn't valid.

## Article carousel: landscape covers, not portrait

- The homepage's "Latest Reviews" rail (`components/ArticleCarousel.jsx`) switched its cover image ratio from `aspect-[4/5]` (portrait, taller than wide) to `aspect-[4/3]` (landscape, wider than tall) — after a reference screenshot from The New Yorker's own "Today's Mix" rail, which uses clearly rectangular, landscape covers rather than a portrait crop. Same change applies to both branches that render there: a real uploaded cover image (`next/image` with `object-cover`) and the `CoverArt` placeholder icon shown when a post has none — `CoverArt` takes its aspect ratio entirely from the className passed in, so it needed no changes of its own to follow along. Verified with an isolated harness (mock articles, a locally-generated placeholder image, since this sandbox has no live Supabase cover images to test against) rather than eyeballing the class name change.

## Renamed to "Bermy Review"

- The site's display name changed from "The Bermondsey Review" to "Bermy Review" everywhere it was hardcoded in code: `lib/theme.js`'s `DEFAULT_SITE_SETTINGS.site_title` (the fallback used until a site has its own saved value), the root layout's static `<title>` (`app/layout.jsx`), the admin login screen and sidebar (`app/admin/login/page.jsx`, `components/admin/AdminShell.jsx`), the Guess the Spot page's static metadata title (`app/geoguesser/page.jsx` — the only public page whose `<title>` is still a hardcoded literal rather than a `generateMetadata()` reading live settings), the post-preview iframe's title template (`app/admin/posts/[id]/preview/frame/page.jsx`), and `supabase/schema.sql`'s own column default (so a brand-new install matches the code-side default too).
- **The live site's actual name is stored data, not code** — same as every other `site_settings` field this session has touched (nav order, the carousel's default title). These edits only change the *fallback* shown until a site has its own saved value, plus every place that was hardcoded outside that fallback entirely. The actual live name needs changing at **`/admin/site`** → the **Site title** field.
- **The admin's "Site" tab is now labelled "Identity"** (`components/admin/AdminShell.jsx`'s nav entry, and the matching `<h2>` heading inside `components/admin/SiteSettingsEditor.jsx` itself) — the URL stays `/admin/site` (unchanged, so nothing already bookmarking it breaks), only the label visitors actually read changes, matching the panel's own description text ("Your site's identity, navigation, and footer").

## Guess the Spot: scoring

- **A points score, not just a raw distance** (`lib/geo.js`, `app/api/geoguesser/guess/route.js`, `components/GeoguesserGame.jsx`): a guess now scores 0–5,000 (`scoreFromDistance`), shown as the headline number on the result card — `formatDistance`'s "187m away" still shows too, but underneath, as supporting detail rather than the main event. Scored via exponential decay, `5000 * e^(-distance / 500)`, not lifted from real GeoGuessr's own formula — that decays over a whole country/map's extent (hundreds of km), which would flatten every guess in a neighbourhood-sized game to a score near the maximum. 500m as the decay scale keeps the full board in play: roughly 4500+ within 50m, 3000 within 250m, 1800 within 500m, under 100 past 2km — tuned to Bermondsey's own size (checked against the actual play area) rather than an arbitrary round number. A one-line qualitative label (`scoreLabel`: "Spot on!" down to "Way off") sits next to the number so it doesn't need mental translation from "out of 5000" to "was that good?". Scored server-side alongside the existing distance calculation in the same API route, for the same reason the distance already was — the correct coordinates never reach the browser until after a guess is scored.

## Accessibility & SEO

- **One `<h1>` per page, and a skip-to-content link** (`components/Masthead.jsx`, `components/MastheadNav.jsx`): the masthead's wordmark now carries the page's actual `<h1>` only on the homepage — everywhere else (an article, a custom page, the crossword, Guess the Spot) the real content already supplies its own heading, so the wordmark there is a plain `<p>` instead. Non-trivial because `MastheadNav.jsx` keeps *both* its mobile and desktop wordmark rows in the DOM always, toggling only CSS `display` per breakpoint (`sm:hidden`/`hidden sm:grid`) rather than conditionally rendering — tagging the shared `wordmark` markup used by both rows as `<h1>` would put two `<h1>`s in the document at once on the homepage (caught by a Playwright `h1Count` check, not by eye — both rows render identical text, so nothing *looks* wrong). Fixed by keeping the wordmark itself a `<p>` in both rows unconditionally, and adding one separate, visually-hidden (`sr-only`) `<h1>` outside both rows, rendered once, only when `isHomepage` is true — same visible page, exactly one real heading in the DOM. Caught the same rule's *other* violation while auditing: `/latest`'s own page title (`ArchiveBody.jsx`) was an `<h2>` with no `<h1>` anywhere on the page at all — fixed to `<h1>`, matching every other top-level page. A `Skip to content` link (`Masthead.jsx`, the first element in the DOM, `sr-only focus:not-sr-only`) jumps keyboard/screen-reader users straight past the nav to `id="main-content"`, now present on every top-level page's content wrapper (home, archive, article, custom pages, crossword, Guess the Spot, forms, and the 404 page).
- **Page-specific `<title>`/meta description** (`app/page.jsx`, `app/latest/page.jsx`, `app/crossword/page.jsx`): all three previously fell through to the root layout's static site-wide metadata, so the browser tab, a search result, and a social share card all showed identical generic text for the homepage, the archive, and the crossword page alike. Each now exports its own `generateMetadata()`, reading the same live `site_settings` (via `getSiteSettingsSafe`, with the same try/catch-to-`DEFAULT_SITE_SETTINGS` fallback used throughout the site) that the page itself already renders from — the archive/crossword titles reuse the actual admin-editable copy (`page_copy.archive`, `site_title`) rather than a second, separately-maintained string.
- **Guess the Spot is keyboard-operable** (`components/GeoMap.jsx`, `components/GeoguesserGame.jsx`, `components/admin/GeoguesserRoundForm.jsx`): the game's map used to only accept a mouse click to place a guess, with no keyboard equivalent at all. Leaflet's `MapContainer` already gives arrow-key panning for free (`keyboard: true` is the default, which also puts `tabindex="0"` on the container) — the missing half was picking a point, since that only ever fired from a mouse `click` event. Added a `KeyboardPickHandler` (`useMap()` plus a native `keydown` listener on `map.getContainer()`, since Leaflet has no built-in keyboard-pick API of its own): Enter or Space, while the map has focus, picks whatever point is currently centred. A small crosshair SVG overlay (plain CSS-positioned, `pointer-events-none`, dead centre) marks that point so a keyboard user has a visible target to aim for while panning — the map pans underneath it, the crosshair itself never moves. Verified with an isolated Playwright harness rather than the real page (this sandbox has no live Supabase round for the actual game to load): tab to the map, arrow keys pan it, Enter/Space drops the guess at the panned-to coordinates — confirmed both keys independently, `Space` needed a short pause after the preceding pan key in the test itself (Leaflet's own pan is a brief animation) or the keydown landed mid-animation and looked like a no-op; the handler itself was firing correctly either way. Instruction copy on both the public game and the admin round editor updated to mention the keyboard path alongside the click.
- **Found while auditing, not fixed here (pre-existing, out of scope for this pass):** `app/[slug]/page.jsx` and `app/article/[slug]/page.jsx` call Supabase directly in `generateMetadata`/the page body with no try/catch — every other route in the app wraps its Supabase calls and falls back to `DEFAULT_SITE_SETTINGS` (or, here, should fall back to `notFound()`) if the call throws. In this sandbox, with no `.env.local` configured at all, that gap turns visiting *any* article or custom-page slug (including a nonexistent one, which should show the styled 404 page) into a raw framework error screen instead. Doesn't affect the live site, where Supabase is actually reachable — but it means a real Supabase outage would 500 those two routes instead of degrading gracefully like the rest of the site.

## Running it locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Admin (step 2 + 3: the real editing flow)

Articles, videos, podcasts, and cartoons are now editable through a real
`/admin` area backed by Supabase — this is no longer mock data.

### One-time setup

1. Create a free project at [supabase.com](https://supabase.com).
2. In the SQL editor, run everything in `supabase/schema.sql` — this creates
   the `posts`, `subscribers`, `crosswords`, and `issues` tables plus the
   Row Level Security policies.
3. In **Storage**, create a new **public** bucket named `media`, then run the
   two `create policy` statements commented at the bottom of `schema.sql`
   (they're commented out because the bucket has to exist first).
4. In **Authentication → Users**, manually add an account for yourself and
   each co-editor (email + password). There's no public sign-up — this is a
   small trusted team, not an open platform.
5. Copy `.env.local.example` to `.env.local` and fill in your project's URL
   and anon key (Project Settings → API in the Supabase dashboard).
6. `npm install && npm run dev`, then visit `http://localhost:3000/admin/login`.

### What you get

- **A persistent sidebar** — Posts, Pages, and Media for everyone;
  Forms, Analytics, Redirects, Design, Site, and Homepage layout for
  admins — instead of a growing row of buttons across the top. Lives in
  `app/admin/(dashboard)/layout.jsx` + `components/admin/AdminShell.jsx`,
  applied to every dashboard page but deliberately *not* to
  `/admin/login` or any `*/preview/frame` route (both live outside that
  route group on purpose), so neither the sign-in screen nor an iframe
  rendering the public site ever picks up admin chrome. Nav items are
  grouped under small "Content" / "Engagement" / "Design & settings"
  labels, and clicking the site name at the top always goes home — so
  there's a clear sense of where any given page sits, not just a flat
  list of links.
- **A real dashboard at `/admin`** — logging in lands on an overview
  (post/draft/scheduled counts, a page count for admins, quick actions
  for New post/New page/View site, and the 5 most recently edited posts)
  rather than straight on the post list. The post list itself moved to
  `/admin/posts`; `getPostStatusInfo` in `lib/posts.js` computes the
  Published/Draft/Scheduled badge once, shared by both the list and the
  dashboard's recent-posts widget so they can't drift apart on what
  counts as which status.
- **A consistent icon set and in-app dialogs for the block/layout
  canvases.** The toolbar glyphs (⠿ ↑ ↓ ✕ 🔗 🎨 ⚙) were unicode/emoji
  characters, which render differently — or not at all — depending on
  the OS and browser's emoji font, the kind of thing that quietly reads
  as unfinished. `components/admin/icons.jsx` is a small shared set of
  line icons (grip, chevrons, close, trash, link, palette, gear) in the
  same stroke style as the post-type icons already in `PostForm.jsx`,
  used by both `BlockEditor.jsx` and `LayoutCanvas.jsx` so the two
  canvases' toolbars match. Deleting a post or page now goes through
  `components/admin/ConfirmDialog.jsx` — an in-app modal — instead of
  `window.confirm()`, which breaks the illusion of an app the moment it
  pops up, styled by the OS rather than the site; image-upload failures
  in the block/hero-carousel editors show inline instead of a blocking
  `alert()`, for the same reason. `window.prompt()` stayed for the
  paragraph toolbar's "add link" action specifically — replacing it with
  a normal popover would blur the paragraph's contentEditable and lose
  the text selection `execCommand("createLink")` depends on, a real
  behavioural risk rather than a purely cosmetic one. The same sweep now
  covers the rest of the admin: deleting a form (`FormBuilder.jsx`), an
  image (`MediaLibraryManager.jsx`), or a redirect (`RedirectsManager.jsx`)
  all go through `ConfirmDialog` too, each with its own specific,
  consequence-stating message (a redirect's warns that the old path will
  just 404 once it's gone) rather than a single generic "Are you sure?".
  Failed uploads/saves — the logo in `SiteSettingsEditor.jsx`, plus the
  create/delete calls in the other three — show the same inline
  `bg-brick/[0.08]` error banner already used on the post/page editors,
  instead of `alert()`.
- **Real drag-and-drop, not the native HTML5 kind.** Reordering nav
  links (`SiteSettingsEditor.jsx`), post/page blocks (`BlockEditor.jsx`),
  and homepage sections (`LayoutCanvas.jsx`) used the browser's built-in
  `draggable` attribute, which has no animation — the list just snaps to
  its new order on drop — and no keyboard support at all. All three now
  use [`@dnd-kit`](https://dndkit.com), wired up through a shared
  `components/admin/dnd.jsx` (sensor config: a small pointer-movement
  threshold so clicking the handle doesn't register as a drag, plus a
  keyboard sensor that makes every one of these lists reorderable with
  Space/arrow keys/Space, not just a mouse). The drag handle — previously
  just a decorative grip icon, since the *whole row* was the native drag
  source — is now the only thing you can actually grab, which as a side
  effect stops a text selection inside a block from ever being mistaken
  for a drag. One real bug caught along the way: `LayoutCanvas`'s section
  controls only appeared on `:hover`, unlike `BlockEditor`'s (which also
  had `:focus-within`) — harmless with a mouse, but it meant a
  keyboard-focused drag handle could be operated while invisible, so
  `:focus-within` was added there too. A `columns` block's own two
  columns still reorder with the up/down arrows only, not drag — a
  second drag handle nested inside the outer canvas's own, for a list
  that's almost always one or two blocks long, wasn't worth the added
  chrome, though nothing about `@dnd-kit` stops it if that changes later.
- **A focal point picker for the cover image**, Squarespace-style. A
  post's cover image shows at very different crops — a square archive
  thumbnail, a 4:5 carousel card, a 4:3 hero — so a plain, always-centred
  `object-cover` can crop an off-centre subject right out of frame in the
  narrower ones. `PostForm.jsx`'s `FocalPointPicker` shows the image
  uncropped (`object-contain`, nothing hidden) with a draggable-looking
  marker you click to place; two live swatches beside it preview the
  actual square and 4:3 crops at that point, so you see the effect while
  setting it rather than publishing and going to check the homepage.
  Stored as `posts.cover_image_focal_x/y` (0-100, null = CSS's own
  "center" default — an existing post with none set looks exactly as it
  did before this existed) and applied via `object-position` everywhere
  the cover image renders with `object-cover` — `ArticleCard.jsx`,
  `ArticleCarousel.jsx`, `PostRenderer.jsx` — through one shared
  `focalPointStyle()` helper in `lib/media.js` rather than four places
  reimplementing the same fallback logic. Resets automatically whenever
  the cover image itself is replaced, since a new photo's subject is
  essentially never in the same spot as the old one's.
- **A dedicated Cartoons section, New Yorker–style.** Cartoons used to be
  a post `type` mixed into the same flow as everything else — eligible
  for the homepage's Featured slot, the Article Carousel, and the
  Archive listing, sitting next to headline-and-dek rows built for
  text-first pieces. `components/CartoonsSection.jsx` is a new homepage
  section (`lib/sections.js`) showing cartoons large, in their own row,
  near the bottom of the page — `HomePageBody.jsx` and the admin's
  `app/admin/(dashboard)/layout/page.jsx` both split `type === "cartoon"`
  posts out before computing Featured/Carousel, so a cartoon can't also
  turn up in either; `app/archive/page.jsx` excludes them from the
  archive listing outright (and its category-pill filter dropped the
  "Cartoon" pill, which never actually matched anything — cartoons are a
  post *type*, not a *category*, so that filter compared the wrong
  field). Each cartoon keeps its own full page — the same `PostRenderer`
  every other post uses — and gets a small share button (copies a direct
  link to that page) right on its homepage card, the New Yorker's own
  pattern for a cartoon shown on a listing page. The masthead's
  "Cartoons" nav link now points at `/#cartoons` instead of the archive
  category filter that never worked. Worth knowing: a site whose
  homepage layout was already saved before this section existed won't
  have a "cartoons" entry in its stored `page_layouts` row —
  `lib/layout.js`'s `withCartoonsSection` injects one (enabled, right
  before Newsletter) automatically rather than requiring a manual fix
  through the layout builder; the equivalent nav link, though, lives in
  `site_settings` and *is* just admin-editable data, so an already-saved
  custom nav list needs its "Cartoons" href updated by hand in `/admin/site`.
- **A real, previously-silent bug: admin edits not showing up on the live
  site without a code deploy.** Found while testing the Cartoons nav
  link above — changing it in `/admin/site` didn't take effect. Root
  cause: nothing in the app ever told Next.js to regenerate a
  statically-rendered page (the homepage, the archive, an
  already-known article/page slug — anything not forced dynamic by
  reading `cookies()`, which every admin route already does). Those
  pages were generated once at build/deploy time and served from that
  cache indefinitely — editing site settings, an existing post's body,
  or the homepage layout updates Supabase immediately, but none of it
  would show up on the live site until the *next* code deploy, which
  isn't how a CMS should work. `export const revalidate = 60` in
  `app/layout.jsx` fixes this for every route at once (a layout's
  `revalidate` applies to everything under it) — admin routes are
  unaffected since they're already fully dynamic, so this only touches
  the routes that were silently stuck on stale data. 60 seconds keeps
  most of static rendering's caching benefit while making the admin
  feel like it's actually in control of the live site, rather than every
  edit needing "wait for the next deploy" as an unstated caveat.
- **"Guess the Spot" is a real game now**, not the "coming in phase 2"
  placeholder it shipped as. One round at a time, like the crossword —
  a photo, an optional hint, and a real interactive map
  ([Leaflet](https://leafletjs.com) + OpenStreetMap tiles, no API key or
  paid map provider needed) to click a guess on. Publishing a new round
  in `/admin/geoguesser` automatically supersedes the last one —
  `lib/geoguesser.js`'s `getCurrentRound` just takes the most recently
  created row, so there's no separate "is this the current one" flag to
  manage, the same reasoning as the crossword's own `issues` table
  linking to whichever `crosswords` row is current.
  - `supabase/schema.sql`'s new `geoguesser_rounds` table stores the
    photo, an optional hint and location name (revealed only after a
    guess), and the correct `lat`/`lng`. **Existing installs need to run
    the new `create table`/RLS block by hand** — see the comment right
    above the table in schema.sql.
  - The correct coordinates never reach the browser on page load —
    `app/geoguesser/page.jsx` only ever passes the photo/hint down to
    `components/GeoguesserGame.jsx`; a guess is scored by posting to
    `app/api/geoguesser/guess/route.js`, which resolves the answer
    server-side and returns just the distance and the reveal. Not
    airtight (the `geoguesser_rounds` table is still openly readable via
    Supabase's REST API, same as `redirects`/`forms`/etc.), but it
    stops the actually-likely case — a casual view-source — for a free
    community puzzle where that's the realistic bar, not a determined
    attacker.
  - `components/GeoMap.jsx` is the one Leaflet wrapper shared by both
    the public game (click to guess) and the admin's round editor
    (click to set the answer) — coloured-dot markers (river for a
    guess, brick for the correct spot) instead of Leaflet's default pin
    icon, which references relative image paths that break once
    bundled; dynamically imported with `ssr: false` everywhere it's
    used, since Leaflet needs a real DOM.
  - `/admin/geoguesser` follows the same list-then-edit pattern as
    Forms — `components/admin/GeoguesserRoundForm.jsx` autosaves like
    every other editor in this admin, with the same delete-through-
    `ConfirmDialog` pattern, and won't let you save without both a photo
    and a correct spot set (`correct_lat`/`correct_lng` are `not null`
    columns).
- **`/admin/layout` is a tabbed, whole-site true canvas, not just the
  homepage's.** Two rounds of the same underlying gap: the CMS's
  admin-editable-content story was really only "posts/pages, plus
  whatever's on the homepage" — Archive's heading, Guess the Spot's,
  had no editing surface anywhere, hardcoded straight in each page's own
  JSX. A first pass added `site_settings.page_copy` (a new jsonb column
  — `{ archive: { title, description }, geoguesser: {...} }`, with
  `DEFAULT_SITE_SETTINGS.page_copy` in `lib/theme.js` supplying the
  fallback each page already had, so an unconfigured site looks
  identical) and a small form above the homepage canvas to edit it. That
  form broke the site's own "click what you see" rule everywhere else
  — so it moved into a real per-page canvas instead:
  - `components/admin/AdminLayoutTabs.jsx` is `/admin/layout`'s outer
    shell now — a Home / Archive / Guess the Spot tab strip. Home
    renders the existing `LayoutCanvas.jsx` (reorderable sections)
    unchanged; Archive and Guess the Spot — pages with no sections of
    their own, just a heading and description — get
    `components/admin/PageCopyEditCanvas.jsx`, a lighter true canvas:
    the real Masthead/Footer for context, and the heading/description as
    actual `<input>`/`<textarea>` styled to match the real heading (same
    device PostForm's title/dek fields already use), plus read-only
    context below it (Archive's real post list, Guess the Spot's current
    round photo) — editing an individual post or round still happens on
    its own screen. `page_copy`'s autosave lives in `AdminLayoutTabs`
    rather than each canvas, since Archive's and Guess the Spot's copy
    share one jsonb column — saving one page's slice without resending
    the other's would silently wipe it (a plain column update replaces
    the whole value, it doesn't merge).
  - `components/ArchiveBody.jsx` and `components/GeoguesserBody.jsx` are
    new — `app/archive/page.jsx` and `app/geoguesser/page.jsx` were
    split the same way `app/page.jsx`/`components/HomePageBody.jsx`
    already were, so the real route and a new preview frame
    (`app/admin/layout/preview/archive-frame`,
    `.../geoguesser-frame`) render the exact same component rather than
    two implementations that could drift. `app/admin/layout/preview/page.jsx`
    gained a matching tab strip so "Preview" from any of the three edit
    canvases opens straight to the right one (`?tab=`) without losing
    your chosen device size.
  - `components/admin/canvasNav.js`: the click-suppression that keeps a
    canvas's real links (masthead nav, article links) from navigating
    you away — previously duplicated inside `LayoutCanvas.jsx` — is now
    shared by all three canvases. Gained one escape hatch,
    `data-canvas-allow`, for the one legitimate exception: a link from
    inside a canvas to a *different admin screen* (Guess the Spot's
    round preview links to `/admin/geoguesser` to manage rounds) —
    without it, that link would be permanently unreachable from inside
    the canvas that displays it.
  - The sidebar's nav label changed from "Homepage layout" to plain
    "Layout" to match — that route covers more than just the homepage
    now. Colours, fonts, and the masthead/logo stay out of every one of
    these canvases on purpose — they're still Design's and Site's job,
    shown read-only here for context, not editable in place.
- **A real 404 page, and richer "nothing here yet" states.** A broken or
  outdated link used to hit Next's bare default 404 — unstyled, no
  masthead, reads as the site being broken rather than one link being
  wrong. `app/not-found.jsx` (the public site) keeps the real
  masthead/footer/theme and points back to the front page or the
  archive; `app/admin/(dashboard)/not-found.jsx` handles the admin
  equivalent (an edit/preview URL whose post, page, or form id no longer
  exists) inside the normal sidebar chrome rather than breaking out of
  it. Both are plain Next special files — `notFound()` calls (a bad
  article/page/form slug) and genuinely unmatched URLs land here
  automatically, nothing at the call sites changed. Separately,
  `components/admin/EmptyState.jsx` replaces the single line of grey
  text several list screens showed for "you have none of these yet"
  (Posts, Pages, Forms, the dashboard's recent-posts widget, Media,
  Redirects) with a dashed box, a real heading, and — on the screens
  where creating one means navigating to another route — the same "New
  X" action as a button right there, rather than only as prose pointing
  at a button elsewhere on the page.
- **"On this page" — a live outline in the sidebar, Squarespace-style.**
  Open a post, page, or the homepage layout builder and the sidebar
  grows a section listing every block/section currently on the canvas,
  top to bottom, updating as you add, remove, or reorder them; click
  one to scroll straight to it with a brief highlight pulse. Text
  blocks show their own (trimmed) content rather than a generic "Text"
  label, and hidden homepage sections show muted with a "Hidden" hint,
  so the list doubles as a map of what's actually live. The canvas
  publishes this up to `AdminShell` via a small React Context
  (`components/admin/EditorOutlineContext.jsx`) rather than `AdminShell`
  needing to know anything about blocks or sections itself — it clears
  again the moment you navigate to a page that isn't a content canvas.
  See the `usePublishOutline` calls in `components/admin/BlockEditor.jsx`
  and `components/admin/LayoutCanvas.jsx`.
- **"Switch post"/"Switch page" — jump straight to editing another one,**
  without backing out to the list first. Shows in the sidebar only while
  a post or page editor (or its "new" screen) is open — not on the
  homepage layout builder, since there's only one homepage to switch to
  — listing every post/page with its status (Published/Draft/Scheduled),
  the one you're on highlighted, and a "+ New" link at the bottom. See
  `components/admin/PageSwitcher.jsx`. Worth knowing: clicking between two
  posts (or two pages) navigates between routes that only differ in a
  dynamic `[id]` segment — verified with a throwaway harness first that
  Next's App Router genuinely remounts the destination page's Client
  Components in that case (rather than reusing the old instance with
  stale `useState`-seeded content), since getting that wrong would mean
  autosave could silently overwrite the newly-opened post/page with the
  previous one's content.
- `/admin` — every post, draft and published, with a type badge and status
- **`/admin/pages` — standalone pages** (About, Contact, whatever isn't
  part of the fortnightly issue cycle), sharing the same block editor as
  posts. Site-structure concern like layout/theme/redirects, so
  admin-only. Check "Show in navigation" and a published page is
  appended to the masthead/footer nav automatically (see
  `getSiteNavLinks` in `lib/pages.js`) — live at the root, e.g.
  `/about`, via `app/[slug]/page.jsx`. A reserved-slug check stops a
  page from claiming an address the site itself already uses
  (`/latest`, `/admin`, etc.).
- **`/admin/forms` — a general-purpose form builder**, not just the
  newsletter signup. Build a form with any mix of short text, long
  text, email, dropdown, and checkbox fields — drag to reorder them the
  same way article blocks reorder, mark any field required, publish it,
  and it's live at `/forms/[slug]`. Responses land in `/admin/forms/[id]/submissions`,
  readable by admins only. A hidden honeypot field on the public form
  gives basic spam protection without needing a CAPTCHA.
- **`/admin/theme` — "Design."** A visual theme editor: two colour
  pickers (the brick and river accents), two font pickers (headline and
  body, from a curated list of real Google Fonts), and an "Advanced:
  Code injection" section for raw custom CSS/JS — with the same live
  device preview as everywhere else. Deliberately narrow: paper, ink,
  and hairline colours stay fixed in code, so there's no way to
  accidentally pick black-on-black and make the whole site unreadable.
  Worth knowing how this actually works — it's not cosmetic paint
  splashed on top:
  - Colours and fonts used to be hardcoded values scattered across SVG
    icons and inline styles (the cover-art placeholders, the puzzle
    cards, the drop-cap letter). All of that
    was rewired to route through CSS custom properties
    (`--color-brick`, `--color-river`, `--font-display`, `--font-body`)
    with sensible fallbacks — see `tailwind.config.js` and
    `components/ThemeVars.jsx` — specifically so this editor wouldn't
    be the kind of feature that changes some things and silently misses
    others.
  - `ThemeVars` is included in public-facing pages (the homepage,
    archive, article, etc.) and, scoped, in the post/page/homepage
    canvases — never unscoped in `/admin`'s own dashboard chrome — so
    admin chrome always stays on the fixed default design system, the
    same way Squarespace's own editor UI doesn't reskin itself based on
    your site's custom theme. The post/page/homepage canvases are the
    exception: they're inside `/admin`, but since they're meant to be a
    true mirror of the live page (see "A true visual canvas" below),
    they need the real accent colours and fonts too. `ThemeVars` takes
    an optional `scope` prop for exactly this — pass a selector like
    `.theme-canvas` and it writes `--color-brick`/`--color-river`/font
    variables scoped to that selector instead of `:root`, and skips
    `custom_css`/`custom_js` entirely (those assume they're running on
    the real public page, not a sub-tree of the dashboard). Every canvas
    wraps its content in a `.theme-canvas` div and passes
    `<ThemeVars scope=".theme-canvas" />` in from its server-rendered
    parent — without the scope, the same `:root` colours the canvas
    wants also leak into the surrounding sidebar (its active-link colour
    reuses `--color-brick`, for one).
  - The custom JS field is real, unsandboxed code that runs for every
    visitor — restricted to admins by RLS, with a clear warning in the
    UI, but worth treating with the same care as editing the repository
    directly.
- **`/admin/site` — site identity, navigation, and footer.** Title,
  tagline, and logo (upload one and it replaces the text title in the
  masthead); a drag-to-reorder navigation menu shown in both the masthead
  and the footer; social links (Twitter/X, Instagram, Facebook — shown as
  footer icons, only for whichever you fill in); and an optional footer
  note (address, charity number, whatever belongs in small print). All of
  it lives in the same `site_settings` row as `/admin/theme`'s colours and
  fonts (see `lib/theme.js`), so there's one place that owns "what does
  this site look/say like," not several. See `components/Masthead.jsx`
  and the new `components/Footer.jsx` for how it's actually applied.
- **`/admin/redirects` — automatic and manual redirects.** Rename a
  post's URL in the SEO section and a redirect from the old address to
  the new one is created automatically (see `updatePost` in
  `lib/posts.js`), so old links and search results don't just 404.
  Resolved in `proxy.js`, scoped to `/article/*` only on purpose —
  checking every single request against the database would be needless
  overhead for a feature that's used occasionally. Add one manually here
  too, e.g. for an old external URL.
- **`/admin/analytics` — a minimal, privacy-friendly pageview
  dashboard.** No cookies, no per-visitor tracking, just "this path was
  viewed at this time" — enough to answer "which articles are people
  actually reading." The tracker lives in `components/PageViewTracker.jsx`
  and is deliberately wired into the real public pages directly (homepage,
  archive, article), not into `HomePageBody`, since that component is
  shared with the admin layout-builder's live preview — previews
  shouldn't count as visits.
- **Image optimization** — every image (cover images, body images,
  media library thumbnails) now renders through `next/image` instead of
  a raw `<img>` tag. Uploads to Supabase Storage aren't compressed or
  resized on their own, so this is what actually keeps the site fast:
  automatic resizing, lazy loading, and modern formats (WebP/AVIF) are
  handled for you the moment this is deployed to Vercel — see the
  `images.remotePatterns` entry in `next.config.mjs`.
- **Alt text** — a cover image (post or body image block) grows a small
  "Describe this image for screen readers…" field the moment you add
  one, right underneath it in the canvas. Optional, not enforced, but
  no longer absent by default the way it was before — every cover image
  and body image had a hardcoded empty `alt=""` regardless of what it
  showed.
- **Roles: admin vs. contributor** — new editor accounts default to
  "contributor" (see the `profiles` table and its auto-create trigger in
  `supabase/schema.sql`). Contributors can write and save drafts;
  publishing, scheduling, deleting posts, deleting media, and editing
  the homepage layout are admin-only — and this is enforced by the
  database's row-level security, not just hidden buttons, so it holds
  even if there's a bug in the UI. To make yourself (or anyone) an
  admin, run the one-line SQL comment above the `profiles` table once
  they've signed in at least once.
- **A real sitemap and robots.txt** (`app/sitemap.js`, `app/robots.js`)
  — built from actual published posts once Supabase is connected, with
  a graceful fallback to just the static routes if it isn't yet. Set
  `NEXT_PUBLIC_SITE_URL` in `.env.local` once you have a real domain.
- **SEO & sharing fields** — a collapsible "SEO & sharing" section in the
  editor with an editable URL slug (auto-generated from the title, but
  overridable), a meta description with a 155-character guide, and a
  social share image (falls back to the cover image if left blank).
  These aren't just stored — the preview page's `generateMetadata`
  actually reads them into real `<title>`/`<meta>` tags, so you can
  verify they're working by viewing the page source of a preview.
- **Version history** — every explicit Save draft / Publish / Schedule /
  Update saves a snapshot. The "History" button in the editor lists
  every version with a timestamp and a one-click "Restore." This is
  separate from autosave on purpose: autosave protects against losing
  work between checkpoints (e.g. a browser crash mid-sentence);
  revisions protect against a checkpoint itself being a mistake (e.g.
  publishing over a paragraph you actually wanted to keep). Restoring
  brings back the *content* — title, body, images — without touching
  the post's current live status, so restoring an old draft can't
  accidentally un-publish something that's since gone live.
- **Scheduled publishing** — pick a "Schedule for" date/time in the
  editor and the primary button becomes "Schedule" instead of "Publish."
  The post goes live on its own at that moment — no cron job or server
  function required, since the database's own row-level security rule
  treats a scheduled post as publicly visible the instant its time
  arrives (see the comment above the "Public can read published posts"
  policy in `supabase/schema.sql`). The trade-off, documented right there
  in the schema: the `status` column stays literally `scheduled` forever
  unless someone reopens the post — the admin list and editor compute
  "is this actually live?" the same way the database policy does, so
  what you see in `/admin` always matches what visitors see.
- **`/admin/media` — a real media library.** Every image uploaded
  anywhere (cover images, body images) is automatically recorded in a
  `media_library` table, not just attached to whatever it was uploaded
  for. Browse and delete everything from `/admin/media`, or click
  "Choose from library" wherever you're adding an image to reuse one
  instead of re-uploading it.
- **`/admin/layout` — the visual page-layout builder, also a true
  canvas.** This is the actual homepage — real Masthead, real theme
  colours, the real featured post and carousel, a real Footer — not a
  section-name list next to an iframe of the real thing. Hover a
  section for its controls (drag handle, move, hide/show); hidden
  sections stay visible but dimmed, with a clear "Hidden from homepage"
  badge, so you can see what you're switching back on rather than
  guessing from a label. Newsletter is toggle-only, not reorderable, on
  purpose — it always renders full-bleed at the very bottom regardless
  of its position in the list (see `components/HomePageBody.jsx`), so
  offering a drag handle that silently did nothing would be worse than
  not offering one. Autosaves to the same real `page_layouts` table as
  before. See `components/admin/LayoutCanvas.jsx`.
  - **Edit mode vs. Preview.** Since this canvas is the real Masthead,
    real `PuzzlesSection`, real article cards — actual production
    components, not editor stand-ins — every link on it is a real
    `<a href>` (nav items, the puzzle cards, the newsletter's own
    "Subscribe" anchor). Left alone, clicking any of them does exactly
    what it does on the live site: navigates away from the layout
    builder entirely, mid-edit. A single capture-phase click handler on
    the canvas (`suppressCanvasNavigation`) intercepts and blocks
    anything routed through an `<a>` tag, while leaving the admin's own
    controls — drag handle, move, hide/show, the carousel settings gear
    — untouched, since those are all `<button>`s, never anchors. The
    **Preview** button in the top bar (opens `/admin/layout/preview` in
    a new tab) is the real thing, full navigation intact, for actually
    clicking around as a visitor would.
  - **The Puzzles & Games cards' text is editable from here too**, via
    the same ⚙ settings gear the carousel's item-count controls use —
    title, description, and CTA per card, stored on the "puzzles"
    section object itself (`PuzzlesSection`'s `overrides` prop) rather
    than a separate settings page, since that's where you're already
    looking when you notice a card's copy needs changing. A blank field
    falls back to the coded-in default (`PUZZLE_DEFAULTS` in
    `components/PuzzlesSection.jsx`), shown as the field's placeholder so
    it's obvious what ships if you leave it alone. Like the carousel
    settings, `PuzzlesSection` has no server-only dependencies, so the
    canvas renders it live from state instead of a pre-rendered prop —
    typing updates the preview instantly, no save-and-reload needed to
    see it. Each card's illustration is now the same kind of override:
    the settings gear's `ImageDropzone` lets you upload a photo that
    replaces the hand-drawn line art (`overrides[slug].imageUrl`, same
    fallback-to-default pattern as the text) — and the line art itself
    got a pass, swapping a pigeon-with-pencil and a fox-with-compass for
    something that actually says what the card is: a plain crossword
    grid, and Tower Bridge (the landmark someone would actually place
    near Bermondsey, rather than an unrelated character).
- **A consistent divider between homepage sections**, New Yorker
  "Goings On"–style: a hairline, a centred uppercase title, an optional
  italic one-line description underneath — `components/SectionHeader.jsx`,
  shared by Recent Reviews (the Article Carousel — renamed from a bare
  "Reviews" to match), Puzzles & Games, and Cartoons, none of which had
  any section header before this (Puzzles' was left-aligned prose-style;
  Carousel and Cartoons had none at all, just ran straight into content).
  Featured — the lead post at the very top of the page — deliberately
  doesn't get one: it's the first thing on the page regardless of section
  order, so a divider there would either double up against the
  masthead's own hairline or need special-casing depending on position,
  and the piece's own headline already reads as its own section without
  one. No illustration above the title yet, unlike the reference — the
  site has no artwork for one — just the rule and the type. Each
  section's title/description is now admin-editable too, same gear icon
  as everything else on that section — `SECTION_HEADER_DEFAULTS`
  (`lib/sections.js`) supplies the fallback, `SectionHeaderFields`
  (`components/admin/LayoutCanvas.jsx`, `PuzzleCardFields`'s sibling)
  is the shared field pair. Doing this properly meant fixing a real gap
  first: Cartoons was still pre-rendered server-side and handed to
  `LayoutCanvas` as an opaque prop (`sectionContent.cartoons`), unlike
  Carousel and Puzzles, which render live from the section's own
  state — so a Cartoons header edit wouldn't have shown up until a
  save-and-reload. Moved it into the same live-render path as the
  other two (`LayoutCanvas` now takes a `cartoons` prop instead of
  baking it into `sectionContent`), so all three settings panels behave
  identically: type, and the heading updates instantly.
  - **"No sub-heading" as its own checkbox, not just an empty text
    field.** Every other overridable field in this admin follows one
    rule: blank means "use the default." That rule breaks for a
    description whose default *is* text (Recent Reviews, Cartoons) —
    clearing the box wouldn't ask for no description, it would just
    reset to the coded-in one, with no way to actually get a header with
    no sub-heading at all. `hideHeaderDescription` is a separate boolean
    on the section object precisely to give that third state a place to
    live, alongside "unset" (blank, falls back to default) and "set"
    (blank, uses your text). `SectionHeaderFields` disables (greys out,
    doesn't clear) the description textarea while it's ticked, so
    switching it back off restores whatever you'd written rather than
    losing it — and both live-render paths (the admin canvas in
    `LayoutCanvas.jsx`, and the real homepage in `HomePageBody.jsx`)
    check the flag the same way: `hideHeaderDescription ? "" : headerDescription || default`.
- **Cartoons got their own post page and authoring form, instead of
  reusing the article ones as-is.** Both had gaps that only showed up
  once cartoons became a real, live feature rather than a placeholder:
  - `PostRenderer.jsx` — a cartoon post used to fall through into the
    same split hero band every article gets (a category eyebrow and
    headline on one side, the cover image cropped into a 4:3 box with
    `object-cover` on the other), then nothing at all below it, since no
    article/video/podcast branch ever matched `type: "cartoon"` — a
    single illustration doesn't have "body blocks." Cartoons now get
    their own compact, centred layout: the full image shown large with
    `object-contain` rather than `object-cover`, since cropping a
    single-panel drawing can cut off the actual joke (the homepage
    rail's thumbnail can still afford to crop — that's just a preview),
    with the caption (`post.title` — the same field the homepage rail
    already shows under the thumbnail) and artist underneath.
  - `PostForm.jsx` — creating a cartoon showed the full article form:
    a "Headline"-labelled title, a dek input captioned "One or two
    sentences under the headline…" that nothing ever displayed for a
    cartoon, and a Category dropdown offering Bermondsey/Books/Film/
    Culture, none of which actually fit a single illustration (`lib/
    articles.js`'s `categoryFamily` already special-cased a `"Cartoon"`
    category for the brick accent colour — it just had nowhere to come
    from, since it wasn't in the picker's list). The cartoon type now
    hides the dek input and the category picker entirely, relabels the
    title field's placeholder to "Caption (optional)" to match what it
    actually is, and auto-assigns `category: "Cartoon"` when you pick
    the type (`handleTypeChange`, resets back to the default if you
    switch away and hadn't picked a different category in between).
- **The Archive is now "The Latest"** — both the on-page heading (the
  `page_copy.archive` default in `lib/theme.js`, still overridable from
  `/admin/layout`) and the URL itself (`app/archive/page.jsx` →
  `app/latest/page.jsx`, so it's `/latest` now, not `/archive`). Renamed
  everywhere the label showed up in the admin (the `/admin/layout` tab,
  its canvas's own heading, the preview shell's tab) and in the few
  places the public site links to it (the 404 page's "browse" link,
  `sitemap.js`). The internal `page_copy` JSONB key stays `archive`,
  though — that's an implementation detail no one but this code sees,
  and renaming it would silently drop whatever an admin had already
  saved under the old key, for zero user-visible benefit. Old `/archive`
  links (bookmarks, search results, anything already indexed) get a
  permanent redirect to `/latest` — added in `next.config.mjs` rather
  than through the admin's own `/admin/redirects` feature, since that
  one is deliberately scoped to `/article/*` slugs only (see the comment
  in `proxy.js`) to avoid a database round-trip on every request
  site-wide; a one-off structural route rename doesn't need that, a
  static config-level redirect (checked at the edge, no DB lookup) is
  the right tool. Also updated `RESERVED_SLUGS` in `lib/pages.js`
  (`archive` → `latest`) — that list stops a custom `/admin/pages` page
  from claiming a slug one of the site's own real routes already uses;
  leaving the stale `archive` entry in place would've left `/latest`
  itself unprotected, so a custom page could have shadowed the real one.
- `/admin/posts/new` — a type picker (article/video/podcast/cartoon) with
  plain-language descriptions instead of jargon
- **A true visual canvas, not a form describing the content.** The
  headline, standfirst, and every body block render using the exact
  same classes as the public page (`components/BlockContent.jsx`) — so
  editing means clicking directly on a real headline-sized heading, a
  real drop-capped paragraph, a real coloured button, and typing, rather
  than filling in a stack of generic text boxes and imagining the
  result. Hover a block for its controls (drag handle, move, delete —
  plus bold/italic/link for text); hover the gap above or below any
  block for a "+" that inserts a new one exactly there. See
  `components/admin/BlockEditor.jsx`.
- **Eleven block types** — paragraph, heading, image, image carousel,
  video, quote, button, embed, spacer, divider, and columns, so a piece
  can be more than a wall of paragraphs (a pull quote, a gallery, an
  embedded YouTube video, a section break, a side-by-side layout) without
  needing a full page-builder.
  - **Video** embeds a YouTube URL (reuses `lib/youtube.js`, same as the
    top-level video post type — this just makes it available *inside*
    any post or page too, not only as the whole piece).
  - **Image carousel** is a small multi-image list within one block —
    add, remove, and reorder (arrow buttons, not drag — the block
    itself is already a drag source for reordering among other blocks,
    and nesting a second drag zone inside it invites conflicting
    browser drag events).
  - **Embed** is deliberately *not* a raw-HTML/paste-any-script block.
    RLS lets any contributor write body content directly via the
    Supabase client, and that content renders in an admin's browser
    during preview before anyone's reviewed it — the same reasoning
    that led to sanitizing paragraph HTML (see `components/
    BlockContent.jsx`) applies here, more so. Scripts and inline event
    handlers are always stripped, and any `<iframe>` whose `src` isn't
    one of a handful of known embed providers (YouTube, Vimeo, Google
    Maps, Spotify, SoundCloud) is dropped entirely, so an
    attacker-controlled iframe can't be used for phishing/clickjacking
    either. That covers plain-iframe embed codes from those providers;
    script-hydrated embeds (e.g. Twitter's default snippet) fall back to
    plain text rather than the rich version — a deliberate trade, not an
    oversight. Truly unrestricted code already exists, admin-only, at
    `/admin/theme`'s "Advanced: Code injection" section.
- **Per-block style** — a 🎨 button on every block except spacer/divider
  opens a small panel for a background tint, padding, and (on paragraph,
  heading, quote, and button blocks) left/center/right alignment — enough
  to make a pull-quote or a call-to-action button stand out in its own
  tinted box without needing a whole new block type per look. Background
  is a fixed set of light tints (none, river, brick, grey) rather than a
  raw colour picker, same reasoning as `/admin/theme`'s restricted
  palette: no way to end up with unreadable text-on-background. The tints
  are the site's actual `--color-brick`/`--color-river` theme colours at
  low opacity, not hardcoded hex — pick a new accent colour in
  `/admin/theme` and every block using a tint follows automatically. See
  `lib/blockStyle.js` (the shared option list + class logic) and its use
  in both `components/admin/BlockEditor.jsx` (the canvas) and
  `components/BlockContent.jsx` (the live page) — same "true visual
  canvas" principle as everything else here: what you pick is what ships.
  - Building this surfaced a real, pre-existing bug: Tailwind can only
    apply an opacity modifier (`bg-brick/[0.1]`) to a colour it can
    decompose into RGB channels, and brick/river were defined as raw
    hex-valued CSS variable strings — undecomposable — so every
    `/`-modified brick/river utility across the *entire* admin UI (the
    sidebar's active-link tint, status badges, and more — 17 files' worth)
    was silently generating no CSS at all, not just in this new feature.
    Fixed by having `components/ThemeVars.jsx` also write
    `--color-brick-rgb`/`--color-river-rgb` (the same colours as
    space-separated RGB channel numbers — see `lib/color.js`) and
    redefining `brick`/`river` in `tailwind.config.js` as
    `rgb(var(--color-brick-rgb, ...) / <alpha-value>)`, Tailwind's
    documented pattern for opacity-modifiable CSS-variable colours. Caught
    by comparing a screenshot against the class names actually being
    applied, not just trusting that a correctly-named Tailwind class
    means the CSS exists.
- **Columns** — an eleventh block type that splits into two side-by-side
  sub-canvases, each independently editable (its own insert menu, its own
  drag-and-drop, its own style panel), for image + text and other
  side-by-side layouts without a whole separate page-builder. Nesting is
  one level deep only — a column can't itself contain a columns block.
  - Implemented by literally reusing `BlockEditor` for each column (`{
    type: "columns", columns: [[...], [...]] }`, each half just another
    blocks array — same shape as `posts.body` itself), rather than a
    second parallel editor. A `nested` flag suppresses the three things
    that only make sense once per page: publishing to the "on this page"
    outline (a column's blocks are part of the outer canvas's own single
    "Columns" outline entry, not a second page — see the `enabled` option
    `usePublishOutline` grew in `components/admin/EditorOutlineContext.jsx`
    for this), the `block-${index}` DOM id (would otherwise collide with
    the outer canvas's own), and native drag-to-reorder. That last one
    matters: nesting a second independent HTML5 drag zone inside a block
    that's itself a drag source is the same "conflicting drag events"
    problem `HeroCarouselField`'s own comment already flagged, one level
    up — so a column reorders with its arrow buttons only, verified with
    a throwaway harness that dragging/reordering a top-level block leaves
    a column's own contents untouched, and vice versa, and that no
    duplicate DOM ids or outline pollution show up anywhere on the page.
  - `components/BlockContent.jsx` mirrors this by recursing into itself
    for each column's block list, so a column gets the exact same
    rendering (and the exact same HTML sanitization) as the top level,
    not a parallel, easier-to-drift-out-of-sync implementation.
- **Per-block visibility — "Show on: All devices / Desktop only / Mobile
  only."** Part of the same 🎨 style panel as background/padding/alignment,
  but offered on *every* block, including spacer and divider (a divider
  or gap you only want on mobile is a real case, unlike a background tint
  on one — see the `containerStyleable` split in `components/admin/
  BlockEditor.jsx`, which still gates background/padding/alignment to the
  blocks they make sense on). A block set to one device shows a muted
  "Mobile only"/"Desktop only" hint in the sidebar's "on this page"
  outline, so it doesn't look like it silently vanished. `sm` (640px) —
  the same breakpoint the masthead's own nav collapse already uses — is
  the mobile/desktop line.
- **How many items a carousel shows at once, mobile vs desktop** — both
  the hero-carousel body block and the homepage's article carousel
  (configured from `/admin/layout`, on the carousel section's own ⚙
  button) get an "Auto / 1 / 2 / 3…" control for each. "Auto" is the
  default and keeps each carousel's existing peek-width look pixel-for-
  pixel; picking a number switches that carousel to exactly that many
  items per view instead. The option lists and the actual width math
  live in `lib/carouselLayout.js`, shared by both carousels — the number
  drives a CSS custom property set via inline style, not a Tailwind class
  built from the number directly (`w-[${100 / count}%]` would be a
  different literal string per instance, and Tailwind's JIT only
  generates CSS for class strings that appear literally in source, the
  same reasoning behind the `--color-brick-rgb` fix elsewhere in this
  README) — `w-[var(--carousel-item-w-mobile)]` is the fixed, scannable
  literal; only the variable's value varies per carousel.
  - Wiring the homepage carousel's count settings up for live preview
    inside `/admin/layout` needed one structural change: every other
    section's real content is a Server Component, pre-rendered by the
    server page and handed to `LayoutCanvas` (a Client Component) as an
    already-built element, since a Client Component can't render a Server
    Component itself. `ArticleCarousel` has no server-only dependencies
    though — just `articles`, already-fetched data — so `LayoutCanvas`
    now imports and renders it directly, with that section's own live
    `mobileCount`/`desktopCount` from state, rather than a static
    pre-rendered element that couldn't reflect an in-progress edit.
- **Drag-and-drop** — reorder blocks by dragging the ⠿ handle that
  appears on hover, and drop image files straight from the desktop onto
  the cover image or an image block instead of hunting for a file picker
  (see `ImageDropzone` in `components/admin/BlockEditor.jsx`)
- **A sticky action bar** — Save draft / Publish / Preview stay visible
  at the top of the screen no matter how far down you've scrolled
- **Autosaves** about 1.5 seconds after you stop typing, once a post has
  been created — there's no "did I remember to save?" moment
- **Preview** — every post has a "Preview" link that shows exactly how
  it'll look on the actual site, before it's published, with a **Mobile /
  Tablet / Desktop switcher** at the top. This uses a real iframe sized to
  each device's width (the same trick browser dev tools use), so the
  mobile nav wrapping and other responsive behaviour genuinely kick in —
  not just a narrower window showing the desktop layout.
- **Delete** — a plain-language confirmation before anything is removed
- Friendly error messages instead of raw database errors

**What's deliberately not built yet:** the public-facing pages
(`app/page.jsx`, `app/archive`, `app/article/[slug]`) still read from the
mock data in `lib/articles.js`, not from Supabase — wiring them to real
data, and upgrading the block editor to support inline video/podcast
embeds (step 10 of the build order), are the natural next steps.

## Next steps (from the tech plan)

1. ~~Static design shell~~ ← done
2. ~~Supabase schema~~ ← done (`supabase/schema.sql`)
3. ~~`/admin` editing flow~~ ← done, plain block editor (no embeds yet)
4. Wire the public pages (homepage, archive, article) to read real post *content* from Supabase instead of `lib/articles.js` — note the homepage's section *order* is already real (`page_layouts`, via the layout builder); it's just the articles inside those sections that are still mock data
5. Newsletter signup + subscriber storage
6. Email sending pipeline (Resend)
7. Crossword widget
8. Guess-the-spot game
9. Video support (`/watch/[slug]`)
10. Podcast support (`/listen/[slug]` + `/feed.xml` RSS)
11. Inline embeds in the article editor, once 9–10 exist to embed
