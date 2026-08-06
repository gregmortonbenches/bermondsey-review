export const DEFAULT_SITE_SETTINGS = {
  brick_color: "#9C6B42",
  river_color: "#2B4C73",
  display_font: "Zilla Slab",
  body_font: "Source Serif 4",
  custom_css: "",
  custom_js: "",
  site_title: "The Worm",
  site_tagline: "Free, fortnightly, from SE16 & thereabouts",
  logo_url: "",
  nav_links: [
    { label: "The Latest", href: "/latest-article" },
    { label: "Reviews", href: "/latest" },
    { label: "Puzzles", href: "/#puzzles" },
    { label: "Cartoons", href: "/#cartoons" },
  ],
  social_links: { twitter: "", instagram: "", facebook: "" },
  footer_text: "",
  // The heading + one-line description shown at the top of standalone
  // pages that aren't a `posts`/`pages` row — Archive, Guess the Spot,
  // and (once built) the Crossword — so that copy is admin-editable
  // from /admin/layout instead of hardcoded in each page's own JSX.
  // Keyed by page slug rather than one shared shape, so adding a new
  // page's copy later is just a new key here, no schema change.
  page_copy: {
    archive: {
      title: "Articles",
      description: "Every issue of the Review, newest first.",
    },
    geoguesser: {
      title: "Bermy on the Map, SE1",
      description: "A photo from around SE16 — click the map where you think it was taken.",
    },
  },
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
