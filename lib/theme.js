export const DEFAULT_SITE_SETTINGS = {
  brick_color: "#9C6B42",
  river_color: "#2B4C73",
  display_font: "Zilla Slab",
  body_font: "Source Serif 4",
  custom_css: "",
  custom_js: "",
};

// Curated lists rather than free text — keeps every option something
// that's actually a real Google Font and actually looks right in this
// layout, instead of an admin typing a font name that doesn't exist.
export const DISPLAY_FONT_OPTIONS = [
  "Zilla Slab",
  "Playfair Display",
  "Libre Baskerville",
  "DM Serif Display",
  "Bitter",
];
export const BODY_FONT_OPTIONS = [
  "Source Serif 4",
  "Lora",
  "PT Serif",
  "Merriweather",
  "Newsreader",
];

export async function getSiteSettings(supabase) {
  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", true)
    .maybeSingle();
  if (error) throw error;
  return data ? { ...DEFAULT_SITE_SETTINGS, ...data } : DEFAULT_SITE_SETTINGS;
}

// Same as above, but never throws — used on public pages, since a
// broken/missing Supabase connection there should silently fall back to
// the coded-in defaults rather than take the whole page down.
export async function getSiteSettingsSafe(supabase) {
  try {
    return await getSiteSettings(supabase);
  } catch {
    return DEFAULT_SITE_SETTINGS;
  }
}

export async function saveSiteSettings(supabase, updates) {
  const { error } = await supabase.from("site_settings").update(updates).eq("id", true);
  if (error) throw error;
}
