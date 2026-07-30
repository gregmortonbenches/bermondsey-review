// Falls back to this if Supabase isn't configured yet, or a page_layouts
// row doesn't exist — matches the order the homepage originally shipped
// with, so nothing breaks for anyone who hasn't set up the database.
export const DEFAULT_HOME_SECTIONS = [
  { id: "featured", type: "featured", enabled: true },
  { id: "puzzles", type: "puzzles", enabled: true },
  { id: "carousel", type: "carousel", enabled: true },
  { id: "newsletter", type: "newsletter", enabled: true },
];

export async function getPageLayout(supabase, pageKey) {
  const { data, error } = await supabase
    .from("page_layouts")
    .select("sections")
    .eq("page_key", pageKey)
    .maybeSingle();
  if (error) throw error;
  return data?.sections?.length ? data.sections : DEFAULT_HOME_SECTIONS;
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
