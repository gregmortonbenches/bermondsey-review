// Falls back to this if Supabase isn't configured yet, or a page_layouts
// row doesn't exist — matches the order the homepage originally shipped
// with, so nothing breaks for anyone who hasn't set up the database.
export const DEFAULT_HOME_SECTIONS = [
  { id: "featured", type: "featured", enabled: true },
  { id: "puzzles", type: "puzzles", enabled: true },
  { id: "carousel", type: "carousel", enabled: true },
  { id: "cartoons", type: "cartoons", enabled: true },
  { id: "newsletter", type: "newsletter", enabled: true },
];

// A site whose layout was saved before the Cartoons section existed has
// a `sections` array with no such entry — injecting it here (right
// before Newsletter, same as DEFAULT_HOME_SECTIONS above) means an
// already-live site gets it automatically instead of an admin needing
// to somehow know to go add it back via the layout builder.
function withCartoonsSection(sections) {
  if (sections.some((s) => s.type === "cartoons")) return sections;
  const cartoonsSection = { id: "cartoons", type: "cartoons", enabled: true };
  const newsletterIndex = sections.findIndex((s) => s.type === "newsletter");
  if (newsletterIndex === -1) return [...sections, cartoonsSection];
  return [...sections.slice(0, newsletterIndex), cartoonsSection, ...sections.slice(newsletterIndex)];
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
