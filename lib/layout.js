// Falls back to this if Supabase isn't configured yet, or a page_layouts
// row doesn't exist — matches the order the homepage originally shipped
// with, so nothing breaks for anyone who hasn't set up the database.
//
// No "newsletter" entry any more — it used to be the last, fixed
// (non-reorderable) entry here; it's a global drawer now, mounted by
// Masthead.jsx on every page rather than a homepage section at all (see
// lib/sections.js and components/Newsletter.jsx for the rest of that
// change). An already-saved page_layouts row from before this can still
// have a stale "newsletter" entry in its stored `sections` array —
// harmless, since nothing here or in HomePageBody.jsx/LayoutCanvas.jsx
// still knows what to do with that type any more, so it's just ignored.
export const DEFAULT_HOME_SECTIONS = [
  { id: "featured", type: "featured", enabled: true },
  { id: "puzzles", type: "puzzles", enabled: true },
  { id: "carousel", type: "carousel", enabled: true },
  { id: "cartoons", type: "cartoons", enabled: true },
];

// A site whose layout was saved before the Cartoons section existed has
// a `sections` array with no such entry — injecting it here means an
// already-live site gets it automatically instead of an admin needing
// to somehow know to go add it back via the layout builder. Appended at
// the end: this used to insert right before the newsletter entry (the
// one section that always had to stay last), but that entry doesn't
// exist any more (see DEFAULT_HOME_SECTIONS's own comment above) — a
// legacy saved layout that still happens to have a stale one just ends
// up with Cartoons appended after it, which is harmless since that
// stale entry no longer renders anything anyway.
function withCartoonsSection(sections) {
  if (sections.some((s) => s.type === "cartoons")) return sections;
  return [...sections, { id: "cartoons", type: "cartoons", enabled: true }];
}

export async function getPageLayout(supabase, pageKey) {
  const { data, error } = await supabase
    .from("page_layouts")
    .select("sections")
    .eq("page_key", pageKey)
    .maybeSingle();
  if (error) throw error;
  const sections = data?.sections?.length ? data.sections : DEFAULT_HOME_SECTIONS;
  return withCartoonsSection(sections);
}

// Same as above, but never throws — used on the public homepage, since a
// broken/missing Supabase connection there should silently fall back to
// the default order rather than take the whole page down.
export async function getPageLayoutSafe(supabase, pageKey) {
  try {
    return await getPageLayout(supabase, pageKey);
  } catch {
    return DEFAULT_HOME_SECTIONS;
  }
}

export async function savePageLayout(supabase, pageKey, sections) {
  const { error } = await supabase
    .from("page_layouts")
    .upsert({ page_key: pageKey, sections }, { onConflict: "page_key" });
  if (error) throw error;
}
