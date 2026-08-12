export const SECTION_REGISTRY = {
  featured: {
    label: "Featured Article",
    description: "The latest issue's lead piece, top of the page",
  },
  puzzles: {
    label: "Puzzles & Games",
    description: "The crossword and Bermy on the Map cards",
  },
  carousel: {
    label: "Article Carousel",
    description: "Horizontally scrolling row of more articles",
  },
  cartoons: {
    label: "Cartoons",
    description: "Recent cartoons, shown large — not mixed into the article list",
  },
  newsletter: {
    label: "Newsletter Signup",
    description: "Full-width email signup band",
  },
};

// The default title + description shown by each section's
// SectionHeader (components/SectionHeader.jsx) — Featured has no
// header at all (see the reasoning in HomePageBody.jsx) and Newsletter
// is a full-bleed band with its own heading, so neither appears here.
// A section's `headerTitle`/`headerDescription` (edited via the gear
// icon in the homepage layout builder — see PuzzleCardFields'
// sibling, SectionHeaderFields, in components/admin/LayoutCanvas.jsx)
// fall back to these when blank, same "blank means default" pattern as
// PUZZLE_DEFAULTS in components/PuzzlesSection.jsx.
export const SECTION_HEADER_DEFAULTS = {
  carousel: { title: "Latest reviews", description: "More from this issue, and a few from before it." },
  puzzles: { title: "Puzzles & games", description: "" },
  cartoons: { title: "Cartoons", description: "This fortnight's drawings." },
};
