// Two colours, doing two different jobs — not two decorative accents any
// more. `river` is *the* accent: one saturated blue, spent sparingly and
// at full strength (category labels, links, the drop cap, Subscribe, the
// newsletter drawer, selected states). `brick` is now purely functional —
// errors, alerts, required-field markers, a wrong crossword letter — and
// so is a brick red rather than the bright yellow it used to be, which
// read as decoration wherever it appeared and was poor at signalling a
// problem. Everything else on the page is black, white and grey.
//
// Both stay admin-editable in /admin/theme. A site whose site_settings
// row already has the old values keeps them until someone updates it
// there — changing these defaults only moves what a fresh install gets.
export const DEFAULT_SITE_SETTINGS = {
  brick_color: "#A63D2F",
  river_color: "#1D4ED8",
  display_font: "Libre Baskerville",
  body_font: "Source Serif 4",
  custom_css: "",
  custom_js: "",
  site_title: "The Bermondsey Review of Books",
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
      title: "Bermy on the map, SE1",
      description: "A photo from around SE16 — click the map where you think it was taken.",
    },
    submissions: {
      title: "Submit to the Review",
      description: "Reviews, essays and cartoons from writers and artists in and around SE16 — here's how to send us something.",
      // Four fixed questions, editable answers — not one free-text
      // blob. The section titles themselves aren't admin-editable (see
      // components/SubmissionsBody.jsx): they're the one bit of
      // structure worth keeping fixed, since "what/who/how/what next"
      // is what makes this scannable as guidance rather than a wall of
      // text, and an admin changing the words shouldn't risk losing
      // that shape by accident. Paragraph breaks are a blank line, same
      // convention as everywhere else in this admin that takes more
      // than one paragraph of plain text.
      whatWereLookingFor:
        "Book reviews, essays, and the odd piece of local reporting — anything that would sit comfortably between our covers every fortnight. Cartoons too: one panel, one joke, a Bermondsey twist. We're not precious about length; a review can be 400 words or 2,000 if it earns it.",
      whoFrom:
        "Anyone. We print first-time writers as often as established ones, and we'd rather read something a bit rough that says something real than something polished that doesn't. You don't need to live in SE16 — you just need something worth saying about it, or about a book.",
      howToSend:
        "Email it to us — a pasted draft or an attachment, either is fine. Include a one-line pitch at the top (what it is, roughly how long), your name as you'd like it to appear, and a way to reach you. No submission portal, no login: just an inbox someone actually reads.",
      whatHappensNext:
        "We read everything that comes in. If it's right for an upcoming issue we'll say so within a fortnight; if it isn't, we'll try to tell you that too rather than leave you wondering. First-publication rights only — whatever you send us stays yours.",
      // Placeholder — an admin should replace this with the Review's
      // real inbox from /admin/layout's Submissions tab.
      email: "submissions@bermondseyreview.co.uk",
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
