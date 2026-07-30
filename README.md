# The Bermondsey Review — step 1: design shell

This is the static front end from the tech plan's step 1: homepage, archive,
and individual article pages, styled and laid out, with mock data instead
of a real database. No Supabase, no auth, no email — that's step 2 onward.

## What's here

- `app/page.jsx` — homepage (featured article, "from this issue" extras, article list, newsletter band)
- `app/archive/page.jsx` — full archive, reverse-chronological, filterable by category
- `app/article/[slug]/page.jsx` — individual article page
- `app/crossword`, `app/geoguesser` — stub pages, built out in phase 2
- `components/Masthead.jsx` — header with the illustrated skyline banner and nav
- `components/CoverArt.jsx` — placeholder line-illustration "covers" per category, swap for real images later
- `lib/articles.js` — mock article data, shaped to match the future `articles` table so swapping in real data is mostly a search-and-replace

## Design system

- **Colours:** paper `#FFFFFF`, ink `#1C1B17`, brick `#9C6B42` (warm warehouse brick/tan brown), river `#2B4C73` (dockside/Thames blue), mustard `#D3A121` (defined but currently unused), steel `#6E6C63` — a brown-and-blue duo drawn from the local warehouse brick and "Blue Bermondsey" shopping-area colours, rather than a generic template palette.
- **Type:** Zilla Slab for headlines (a free, commercially-usable slab serif in the same family as the DK Southwark reference you linked, which is personal-use-only), Source Serif 4 for article body copy, Inter for nav/captions/UI.
- **Signature element:** the hand-drawn skyline strip in the masthead (crane, warehouse, the Shard, river) — this is the one illustrated flourish; everything else stays quiet and newspaper-like on purpose.

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
  rendering the public site ever picks up admin chrome.
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
  (`/archive`, `/admin`, etc.).
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
    icons and inline styles (the masthead skyline, the cover-art
    placeholders, the puzzle cards, the drop-cap letter). All of that
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
  not offering one. A separate "Preview on mobile/tablet" link covers
  the device-size check the old split-pane used to handle inline — same
  pattern as the post/page editors' own Preview links. Autosaves to the
  same real `page_layouts` table as before. See
  `components/admin/LayoutCanvas.jsx`.
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
  mobile hamburger menu and other responsive behaviour genuinely kick in —
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
