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
