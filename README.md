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
  - `ThemeVars` is included only in public-facing pages (the homepage,
    archive, article, etc.), never in `/admin`'s own dashboard pages —
    so admin chrome always stays on the fixed default design system, the
    same way Squarespace's own editor UI doesn't reskin itself based on
    your site's custom theme.
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
- **Six block types** — paragraph, image, heading, quote, button, and
  divider, so a piece can be more than a wall of paragraphs (a pull quote,
  a call-to-action button linking to a form, a section break) without
  needing a full page-builder.
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
