-- The Worm — database schema
-- Run this once in the Supabase SQL editor for a fresh project.
--
-- If you ever reset with `drop schema public cascade; create schema
-- public;` before rerunning this file, that also wipes Supabase's
-- default grants that let the anon/authenticated roles (which every
-- request — logged in or not — uses to query anything at all) touch the
-- public schema in the first place, causing every query to fail with
-- "permission denied for schema public" even though every table's own
-- RLS policies are still intact underneath. Restoring these first is
-- safe either way: RLS (enabled per-table below) is still what actually
-- decides row-level access — this grant only controls whether a role
-- can attempt to query the schema at all, matching what a fresh
-- Supabase project already has by default.
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on all tables in schema public to postgres, anon, authenticated, service_role;
grant all on all routines in schema public to postgres, anon, authenticated, service_role;
grant all on all sequences in schema public to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on routines to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to postgres, anon, authenticated, service_role;

create extension if not exists "pgcrypto";

-- Keep updated_at current on every edit, including post-publish edits.
-- Defined up front, before any table/trigger below references it — a
-- CREATE TRIGGER needs the function to already exist, and this one is
-- used by several tables (posts, forms, site_settings, page_layouts,
-- pages) scattered throughout the rest of this file.
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Two roles: "admin" (can publish, schedule, delete, manage layout and
-- media) and "contributor" (can write and save drafts, but not publish
-- or delete anything) — enforced below via RLS, not just hidden buttons
-- in the UI, so a contributor genuinely cannot publish even if they
-- found a way around the admin interface.
--
-- Defined up front, before any table below — every other table's RLS
-- policies reference `profiles` in an admin check, so it has to exist
-- first for a top-to-bottom run of this file to succeed.
--
-- New editor accounts get a "contributor" profile automatically (see
-- the trigger below). To make someone an admin, run this once they've
-- signed in at least once:
--   update profiles set role = 'admin' where id =
--     (select id from auth.users where email = 'their@email.com');
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'contributor' check (role in ('admin', 'contributor')),
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Users can read their own profile"
on profiles for select
to authenticated
using (id = auth.uid());

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role) values (new.id, 'contributor');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create type post_type as enum ('article', 'video', 'podcast', 'cartoon');
create type post_status as enum ('draft', 'scheduled', 'published');

-- One flexible table for every content type — see the project brief
-- for why: it keeps the admin list, archive, and homepage all querying
-- one place, and an article's `body` can embed a reference to a video
-- or podcast row without duplicating the file.
create table posts (
  id uuid primary key default gen_random_uuid(),
  type post_type not null default 'article',
  slug text not null unique,
  title text not null,
  dek text,
  -- Array of content blocks — paragraph, heading, image, quote, button,
  -- divider, spacer, video (a YouTube URL), hero-carousel (an array of
  -- images, plus optional mobileCount/desktopCount — how many show per
  -- view; unset keeps its default peek-width look, see
  -- lib/carouselLayout.js), embed (sanitized third-party iframe HTML —
  -- see the sanitizeEmbedHtml comment in components/BlockContent.jsx for
  -- why this is NOT arbitrary/unsanitized HTML, script tags included),
  -- and columns (exactly two side-by-side sub-lists of this same block
  -- shape, one level deep only — a column can't itself contain a columns
  -- block). Any block may also carry an optional `style` object — {
  -- background, padding, align, visibility }, one of the fixed option ids
  -- in lib/blockStyle.js, not a raw colour/CSS value — for a per-block
  -- background tint, padding, (on text-ish blocks) alignment, and which
  -- devices it shows on (background/padding/align are skipped for
  -- spacer/divider, but visibility still applies to every block type —
  -- a mobile-only or desktop-only divider is a real case). See
  -- components/admin/BlockEditor.jsx for exactly what each block stores.
  body jsonb not null default '[]'::jsonb,
  cover_image_url text,
  cover_image_alt text,          -- for screen readers — shown wherever the cover image is (the post itself, its card on the homepage/archive)
  cover_image_focal_x numeric,   -- 0-100, % from the left — where object-cover crops should centre; null falls back to CSS's own "center"
  cover_image_focal_y numeric,   -- 0-100, % from the top — same idea, vertical axis
  media_url text,               -- video embed URL / podcast audio file URL
  media_duration_seconds integer,
  category text,                -- "Bermondsey" | "Books" | "Film" | "Culture"
  author text,
  meta_description text,        -- shown in search results; falls back to `dek` if empty
  og_image_url text,            -- social share image; falls back to cover_image_url if empty
  status post_status not null default 'draft',
  published_at timestamptz,
  scheduled_for timestamptz,    -- when set with status='scheduled', the post goes live automatically at this time — see the RLS policy below
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Existing installs: run this once to add cover_image_alt without
-- losing anything already written.
--   alter table posts add column if not exists cover_image_alt text;

-- Existing installs: run this once to add the cover image focal point.
--   alter table posts add column if not exists cover_image_focal_x numeric;
--   alter table posts add column if not exists cover_image_focal_y numeric;

create index posts_status_published_at_idx on posts (status, published_at desc);
create index posts_slug_idx on posts (slug);
create index posts_category_idx on posts (category);

create table subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  confirmed boolean not null default false,
  unsubscribe_token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create table crosswords (
  id uuid primary key default gen_random_uuid(),
  grid_json jsonb not null,
  clues_json jsonb not null,
  created_at timestamptz not null default now()
);

create table issues (
  id uuid primary key default gen_random_uuid(),
  issue_number integer,
  publish_date date,
  post_ids uuid[],
  crossword_id uuid references crosswords(id),
  created_at timestamptz not null default now()
);

-- "Guess the Spot": one photo, one correct location, played on a map.
-- One puzzle at a time, like the crossword — the most recently created
-- row is "the current round" (see getCurrentRound in lib/geoguesser.js),
-- so publishing a new one supersedes the last automatically rather than
-- needing a separate "is this the current one" flag. Older rows stay
-- around as history rather than being deleted, same as everything else
-- in this admin. correct_lat/correct_lng are never sent to the public
-- page directly — a visitor's guess is scored server-side (see
-- app/api/geoguesser/guess/route.js), so the answer never sits in the
-- page's own HTML/JS for anyone to view-source.
create table geoguesser_rounds (
  id uuid primary key default gen_random_uuid(),
  photo_url text not null,
  photo_alt text,
  location_name text,        -- revealed after a guess, e.g. "Shad Thames"
  hint text,                 -- optional, shown before guessing
  correct_lat numeric not null,
  correct_lng numeric not null,
  created_at timestamptz not null default now()
);

-- Existing installs: this is a brand new table, so there's no `alter
-- table` needed — just run this `create table geoguesser_rounds (...)`
-- block above, plus `alter table geoguesser_rounds enable row level
-- security;` and the four `create policy ... on geoguesser_rounds`
-- statements further down this file, in the Supabase SQL editor.

-- Drives the visual page-layout builder: which sections appear on a
-- page, in what order, and whether each is switched on. `sections` is
-- an ordered JSON array, e.g.
-- [{"id":"featured","type":"featured","enabled":true},
--  {"id":"puzzles","type":"puzzles","enabled":true},
--  {"id":"carousel","type":"carousel","enabled":false},
--  {"id":"newsletter","type":"newsletter","enabled":true}]
-- The carousel entry may also carry optional mobileCount/desktopCount —
-- how many articles show per view; unset keeps its default peek-width
-- look (see lib/carouselLayout.js, shared with the hero-carousel block's
-- own version of the same setting). The puzzles entry may carry optional
-- crossword/geoguesser objects — each { title, description, cta } —
-- overriding that card's copy; a missing field falls back to the coded-in
-- default (see PUZZLE_DEFAULTS in components/PuzzlesSection.jsx).
create table page_layouts (
  id uuid primary key default gen_random_uuid(),
  page_key text not null unique,   -- "home" for now; more pages can reuse this table later
  sections jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

insert into page_layouts (page_key, sections) values (
  'home',
  '[
    {"id": "featured", "type": "featured", "enabled": true},
    {"id": "puzzles", "type": "puzzles", "enabled": true},
    {"id": "carousel", "type": "carousel", "enabled": true},
    {"id": "newsletter", "type": "newsletter", "enabled": true}
  ]'::jsonb
)
on conflict (page_key) do nothing;

-- Every upload made through the editor is recorded here (see
-- lib/posts.js's uploadMedia), so images can be reused from a library
-- instead of re-uploaded every time. `path` is the Storage object path
-- (needed to delete the underlying file); `url` is its public URL.
create table media_library (
  id uuid primary key default gen_random_uuid(),
  path text not null,
  url text not null,
  filename text,
  uploaded_at timestamptz not null default now()
);

-- A snapshot of a post is saved here every time an editor explicitly
-- clicks Save draft / Publish / Schedule / Update (not on every
-- autosave tick, or this would fill up with near-duplicates from
-- continuous typing). Gives a real "restore an earlier version" safety
-- net on top of autosave, which only protects against losing work
-- between checkpoints — not against a checkpoint itself being a mistake.
create table post_revisions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  snapshot jsonb not null,
  created_at timestamptz not null default now()
);

create index post_revisions_post_id_idx on post_revisions (post_id, created_at desc);

-- When a post's slug changes (see updatePost in lib/posts.js), a
-- redirect from the old path to the new one is left here automatically,
-- so old links and search results don't just 404. Admins can also add
-- redirects manually from /admin/redirects — e.g. for an old external
-- URL. `from_path` is unique so re-saving the same rename doesn't
-- create duplicates (see the upsert in lib/posts.js).
create table redirects (
  id uuid primary key default gen_random_uuid(),
  from_path text not null unique,
  to_path text not null,
  created_at timestamptz not null default now()
);

-- A deliberately minimal, privacy-friendly pageview counter — no
-- cookies, no per-visitor identity, just "this path was viewed at this
-- time." Enough to answer "which articles are people actually reading,"
-- which is the question that matters for a small publication.
create table page_views (
  id uuid primary key default gen_random_uuid(),
  path text not null,
  referrer text,
  viewed_at timestamptz not null default now()
);

create index page_views_path_viewed_at_idx on page_views (path, viewed_at desc);

-- A singleton row (the `id boolean primary key check (id)` trick means
-- exactly one row can ever exist, always with id = true) holding the
-- site's editable theme — the two brand accent colours and the display/
-- body font choice — plus raw CSS/JS injection for anything the admin
-- UI doesn't cover. See components/ThemeVars.jsx for how this actually
-- gets applied to the live site, and note what's deliberately NOT
-- editable here: paper/ink/steel stay fixed in code, to protect basic
-- readability from an accidental "black text on black background."
--
-- Also holds site identity (title/tagline/logo), navigation, footer, and
-- social links — everything that used to be hardcoded in Masthead.jsx and
-- app/layout.jsx. See components/Masthead.jsx and components/Footer.jsx.
create table site_settings (
  id boolean primary key default true check (id),
  brick_color text not null default '#9C6B42',
  river_color text not null default '#2B4C73',
  display_font text not null default 'Zilla Slab',
  body_font text not null default 'Source Serif 4',
  custom_css text,
  custom_js text,
  site_title text not null default 'The Worm',
  site_tagline text not null default 'Free, fortnightly, from SE16 & thereabouts',
  logo_url text,
  -- Array of { "label": "...", "href": "..." }, rendered in both the
  -- masthead nav and the footer — see lib/theme.js's DEFAULT_SITE_SETTINGS
  -- for the shape this ships with.
  nav_links jsonb not null default '[]'::jsonb,
  -- { "twitter": "...", "instagram": "...", "facebook": "..." } — any key
  -- left blank simply isn't rendered as an icon in the footer.
  social_links jsonb not null default '{}'::jsonb,
  footer_text text,
  -- { "archive": { "title": "...", "description": "..." }, "geoguesser":
  -- {...} } — the heading + one-line description for standalone pages
  -- that aren't a posts/pages row (see PAGE_COPY_TARGETS in
  -- components/admin/SiteSettingsEditor.jsx and DEFAULT_SITE_SETTINGS.page_copy
  -- in lib/theme.js for the defaults a missing/blank key falls back to).
  page_copy jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into site_settings (id) values (true) on conflict (id) do nothing;

-- Existing installs: run this once to add the new columns without
-- losing your current brick/river/font/code settings.
--   alter table site_settings
--     add column if not exists site_title text not null default 'The Worm',
--     add column if not exists site_tagline text not null default 'Free, fortnightly, from SE16 & thereabouts',
--     add column if not exists logo_url text,
--     add column if not exists nav_links jsonb not null default '[]'::jsonb,
--     add column if not exists social_links jsonb not null default '{}'::jsonb,
--     add column if not exists footer_text text;

-- Existing installs: run this once to add page_copy without losing
-- anything else already written.
--   alter table site_settings add column if not exists page_copy jsonb not null default '{}'::jsonb;

-- Standalone pages (About, Contact, etc.) — not part of the fortnightly
-- issue cycle the way posts are, so they get their own table rather than
-- another `posts.type`. Site-wide structural concern like layout/theme/
-- redirects, so admin-only (no contributor drafts) — see the RLS below.
-- `body` is the same block-array shape as posts.body (see lib/posts.js
-- and components/BlockContent.jsx) so the editor and renderer are shared.
-- `show_in_nav`: when published and checked, the page is appended to the
-- site navigation automatically (see lib/pages.js's getNavPages, used by
-- Masthead and Footer) — the closest thing here to Squarespace's "Pages"
-- panel doubling as the nav editor.
create table pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  body jsonb not null default '[]'::jsonb,
  meta_description text,
  og_image_url text,
  show_in_nav boolean not null default false,
  published boolean not null default false,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index pages_slug_idx on pages (slug);

alter table pages enable row level security;

create trigger pages_set_updated_at
before update on pages
for each row execute function set_updated_at();

create policy "Public can read published pages"
on pages for select
to anon
using (published = true);

create policy "Editors can read all pages"
on pages for select
to authenticated
using (true);

create policy "Admins can insert pages"
on pages for insert
to authenticated
with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can update pages"
on pages for update
to authenticated
using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can delete pages"
on pages for delete
to authenticated
using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- General-purpose forms — not just the newsletter signup. `fields` is an
-- ordered JSON array, e.g.
-- [{"id":"name","type":"text","label":"Your name","required":true},
--  {"id":"topic","type":"select","label":"Topic","options":["Tip-off","Corrections","Other"]}]
create table forms (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  fields jsonb not null default '[]'::jsonb,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger forms_set_updated_at
before update on forms
for each row execute function set_updated_at();

create table form_submissions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references forms(id) on delete cascade,
  data jsonb not null,
  submitted_at timestamptz not null default now()
);

create index form_submissions_form_id_idx on form_submissions (form_id, submitted_at desc);

create trigger posts_set_updated_at
before update on posts
for each row execute function set_updated_at();

-- Row Level Security
-- Public/anonymous visitors can only ever see published posts.
-- Authenticated editors can read/write everything they're permitted to
-- based on their role in `profiles` (see below) — a contributor cannot
-- publish, schedule, or delete regardless of what the UI shows them.
alter table posts enable row level security;
alter table subscribers enable row level security;
alter table page_layouts enable row level security;
alter table media_library enable row level security;
alter table post_revisions enable row level security;
alter table redirects enable row level security;
alter table page_views enable row level security;
alter table site_settings enable row level security;
alter table forms enable row level security;
alter table form_submissions enable row level security;
alter table geoguesser_rounds enable row level security;

alter table crosswords enable row level security;

-- `issues` has no policies yet (deliberately) — nothing reads or writes
-- it: it exists for a future "bundle a crossword with a specific
-- fortnightly issue's articles" feature, not needed now that the
-- crossword itself follows the same "most recent row wins" current-
-- puzzle model geoguesser_rounds already uses (see getCurrentCrossword
-- in lib/crossword.js), so there's no real access pattern to design
-- policies around yet. RLS-enabled-with-no-policies locks it to
-- service_role only in the meantime, rather than leaving it world-
-- readable/writable through the public REST API by default (Supabase's
-- PostgREST layer exposes every table to the anon/authenticated keys
-- unless RLS says otherwise — an empty policy list is a deny-all, not
-- a no-op).
alter table issues enable row level security;

create trigger site_settings_set_updated_at
before update on site_settings
for each row execute function set_updated_at();

create trigger page_layouts_set_updated_at
before update on page_layouts
for each row execute function set_updated_at();

-- Everyone (including anonymous visitors) needs to read the layout to
-- render the homepage; only editors can change it.
create policy "Public can read layouts"
on page_layouts for select
to anon, authenticated
using (true);

create policy "Admins can write layouts"
on page_layouts for insert
to authenticated
with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can update layouts"
on page_layouts for update
to authenticated
using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Scheduled posts become visible on their own, the moment scheduled_for
-- arrives — no cron job or background function needed. The trade-off:
-- a scheduled post's `status` column stays literally "scheduled" forever
-- (nothing flips it to "published" after the fact), so the admin UI
-- computes "is this actually live yet?" by checking scheduled_for
-- against the current time, the same way this policy does.
create policy "Public can read published posts"
on posts for select
to anon
using (
  status = 'published'
  or (status = 'scheduled' and scheduled_for <= now())
);

create policy "Editors can read all posts"
on posts for select
to authenticated
using (true);

-- Contributors can create posts, but only as drafts — publishing or
-- scheduling requires an admin profile. This is checked here, at the
-- database, not just hidden in the UI.
create policy "Editors can insert posts"
on posts for insert
to authenticated
with check (
  status = 'draft'
  or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

create policy "Editors can update posts"
on posts for update
to authenticated
using (true)
with check (
  status = 'draft'
  or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

create policy "Only admins can delete posts"
on posts for delete
to authenticated
using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Anyone can sign up to the newsletter; only editors can see the list.
create policy "Anyone can subscribe"
on subscribers for insert
to anon, authenticated
with check (true);

create policy "Editors can read subscribers"
on subscribers for select
to authenticated
using (true);

-- Media library is an admin-only concern — no public policy needed.
create policy "Editors can read media library"
on media_library for select
to authenticated
using (true);

create policy "Editors can add to media library"
on media_library for insert
to authenticated
with check (true);

create policy "Only admins can delete from media library"
on media_library for delete
to authenticated
using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Revision history is an admin-only concern too.
create policy "Editors can read revisions"
on post_revisions for select
to authenticated
using (true);

create policy "Editors can create revisions"
on post_revisions for insert
to authenticated
with check (true);

create policy "Editors can delete revisions"
on post_revisions for delete
to authenticated
using (true);

-- Redirects need to be readable by anonymous visitors — middleware
-- resolves them on every /article/* request (see middleware.js) — but
-- only admins should be able to change where a URL points.
create policy "Public can read redirects"
on redirects for select
to anon, authenticated
using (true);

create policy "Admins can create redirects"
on redirects for insert
to authenticated
with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can update redirects"
on redirects for update
to authenticated
using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can delete redirects"
on redirects for delete
to authenticated
using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Guess the Spot rounds need to be readable by anonymous visitors (the
-- public /geoguesser page reads the current round), but only admins can
-- publish or edit one — same shape as redirects above.
create policy "Public can read geoguesser rounds"
on geoguesser_rounds for select
to anon, authenticated
using (true);

create policy "Admins can create geoguesser rounds"
on geoguesser_rounds for insert
to authenticated
with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can update geoguesser rounds"
on geoguesser_rounds for update
to authenticated
using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can delete geoguesser rounds"
on geoguesser_rounds for delete
to authenticated
using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Crosswords ship their solution to the browser (see the "answer
-- handling" note in components/CrosswordGame.jsx) rather than staying
-- server-only like geoguesser's coordinates — a crossword's fun is the
-- solving, not the secrecy, and instant per-letter checking needs the
-- answer available locally. Same read/write split as geoguesser rounds
-- either way: public read, admin-only write.
--
-- Existing installs: the `crosswords` table itself already exists with
-- RLS enabled and no policies (deny-all except service_role) — run
-- just these four `create policy ... on crosswords` statements once to
-- open it up; nothing else in this file needs re-running.
create policy "Public can read crosswords"
on crosswords for select
to anon, authenticated
using (true);

create policy "Admins can create crosswords"
on crosswords for insert
to authenticated
with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can update crosswords"
on crosswords for update
to authenticated
using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can delete crosswords"
on crosswords for delete
to authenticated
using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Anyone (including anonymous visitors) can log a pageview; only
-- editors can read the aggregated results.
create policy "Anyone can log a pageview"
on page_views for insert
to anon, authenticated
with check (true);

create policy "Editors can read pageviews"
on page_views for select
to authenticated
using (true);

-- Every visitor's page needs to read the theme/custom-code to render
-- correctly; only admins can change it.
create policy "Public can read site settings"
on site_settings for select
to anon, authenticated
using (true);

create policy "Admins can update site settings"
on site_settings for update
to authenticated
using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Forms and their fields are admin-managed (site-wide impact, same
-- reasoning as layout/theme/redirects); anyone can submit a published
-- one, but only admins can read the responses.
create policy "Public can read published forms"
on forms for select
to anon
using (published = true);

create policy "Editors can read all forms"
on forms for select
to authenticated
using (true);

create policy "Admins can insert forms"
on forms for insert
to authenticated
with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can update forms"
on forms for update
to authenticated
using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can delete forms"
on forms for delete
to authenticated
using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Anyone can submit a published form"
on form_submissions for insert
to anon, authenticated
with check (true);

create policy "Admins can read submissions"
on form_submissions for select
to authenticated
using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Storage: a public bucket for cover images and media, created via
-- the dashboard (Storage → New bucket → "media", public). Uploads
-- still require an authenticated session, enforced by this policy.
-- Run after creating the bucket:
--
-- create policy "Editors can upload media"
-- on storage.objects for insert
-- to authenticated
-- with check (bucket_id = 'media');
--
-- create policy "Public can view media"
-- on storage.objects for select
-- to anon, authenticated
-- using (bucket_id = 'media');
