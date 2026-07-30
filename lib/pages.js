// Shared page queries — same "takes a supabase client" shape as
// lib/posts.js, so this works from both server and client components.

// A page with one of these slugs would just be shadowed by the matching
// static route (Next.js always prefers a specific route over the `[slug]`
// catch-all) rather than erroring, which is a confusing way to discover
// it — so the editor blocks these slugs outright instead.
export const RESERVED_SLUGS = ["admin", "article", "archive", "crossword", "geoguesser", "forms"];

export async function listPagesForAdmin(supabase) {
  const { data, error } = await supabase
    .from("pages")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getPageById(supabase, id) {
  const { data, error } = await supabase.from("pages").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getPublishedPageBySlug(supabase, slug) {
  const { data, error } = await supabase
    .from("pages")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getAllPublishedPages(supabase) {
  const { data, error } = await supabase.from("pages").select("*").eq("published", true);
  if (error) throw error;
  return data;
}

// Published pages checked "Show in navigation" — appended to the
// masthead/footer nav after the manually-curated links. See
// components/Masthead.jsx and components/Footer.jsx.
export async function getNavPages(supabase) {
  const { data, error } = await supabase
    .from("pages")
    .select("title, slug")
    .eq("published", true)
    .eq("show_in_nav", true)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

// Combines the manually-curated nav_links from site_settings with any
// published, nav-eligible pages — the closest thing here to Squarespace's
// "Pages" panel doubling as the nav editor. Never throws: falls back to
// just the manual links (or the hardcoded defaults) if the pages query
// fails, since a broken nav shouldn't take down the masthead/footer.
export async function getSiteNavLinks(supabase, navLinks) {
  try {
    const pages = await getNavPages(supabase);
    return [...navLinks, ...pages.map((p) => ({ label: p.title, href: `/${p.slug}` }))];
  } catch {
    return navLinks;
  }
}

export async function createPage(supabase, page) {
  const { data, error } = await supabase.from("pages").insert(page).select().single();
  if (error) throw error;
  return data;
}

export async function updatePage(supabase, id, updates) {
  // Same courtesy as updatePost in lib/posts.js: if the slug is changing,
  // leave a redirect behind from the old address to the new one.
  if (updates.slug) {
    try {
      const { data: existing } = await supabase
        .from("pages")
        .select("slug")
        .eq("id", id)
        .maybeSingle();
      if (existing?.slug && existing.slug !== updates.slug) {
        await supabase.from("redirects").upsert(
          { from_path: `/${existing.slug}`, to_path: `/${updates.slug}` },
          { onConflict: "from_path" }
        );
      }
    } catch {
      // Not fatal — worst case, the old URL 404s instead of redirecting.
    }
  }

  const { data, error } = await supabase
    .from("pages")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePage(supabase, id) {
  const { error } = await supabase.from("pages").delete().eq("id", id);
  if (error) throw error;
}
