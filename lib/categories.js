// One flat "ink" per category — a printer's-spot-colour system, not a
// decorative palette. Used only as a thin rule or a kicker label, never
// as a fill or background, so it stays inside the site's "no washes,
// one accent" rule while giving a reader back the ability to sort
// articles by colour at a glance on the homepage — lost when
// ArticleGrid's tiles dropped their category label text (colour still
// drove the illustration's tint back then; now nothing on that tile
// varies by category at all). Five categories, five inks — matches
// CoverArt.jsx's five placeholder icons one for one.
//
// Books keeps the site's one standing accent (river) rather than being
// handed a sixth hue: it's this paper's flagship category, and there
// was no reason to invent a new colour for it when the existing accent
// already fits.
export const CATEGORY_INK = {
  Books: "#1D4ED8",
  Bermondsey: "#96731B",
  Film: "#1B6E63",
  Culture: "#6B3FA0",
  Cartoon: "#2E6B3D",
};

export function categoryInk(category) {
  return CATEGORY_INK[category] || "#1C1B17"; // an unrecognised category falls back to plain ink
}
