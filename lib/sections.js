export const SECTION_REGISTRY = {
  featured: {
    label: "Featured Article",
    description: "The latest issue's lead piece, top of the page",
  },
  puzzles: {
    label: "Puzzles & Games",
    description: "The crossword and Bermy on the Map cards",
  },
  // Key stays "carousel" — it's what saved page_layouts rows already
  // store as this section's type, and renaming it would orphan every
  // existing layout. Only the rendering changed (a horizontal scroll
  // rail became a grid of large squares), so only the label did too.
  carousel: {
    label: "More Articles",
    description: "Grid of large square tiles, two per row on desktop",
  },
  cartoons: {
    label: "Cartoons",
    description: "Recent cartoons, shown large — not mixed into the article list",
  },
  // No "newsletter" entry any more — it used to be a toggleable,
  // fixed-position homepage section (a full-width signup band); it's a
  // global drawer now, opened from the Subscribe button that's already
  // unconditional masthead chrome on every page (see Newsletter.jsx/
  // NewsletterDrawer.jsx), so there's nothing left here for an admin to
  // show/hide as a homepage section.
};

// The default title + description shown by each section's
// SectionHeader (components/SectionHeader.jsx) — Featured has no
// header at all (see the reasoning in HomePageBody.jsx), so it's the
// only one absent here.
// A section's `headerTitle`/`headerDescription` (edited via the gear
// icon in the homepage layout builder — see PuzzleCardFields'
// sibling, SectionHeaderFields, in components/admin/LayoutCanvas.jsx)
// fall back to these when blank, same "blank means default" pattern as
// PUZZLE_DEFAULTS in components/PuzzlesSection.jsx.
export const SECTION_HEADER_DEFAULTS = {
  carousel: { title: "Reviews", description: "More from this issue, and a few from before it." },
  puzzles: { title: "Puzzles & games", description: "" },
  cartoons: { title: "Cartoons", description: "This fortnight's drawings." },
};
