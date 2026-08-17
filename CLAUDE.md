# The Bermondsey Review of Books

## Design direction — read this before changing anything visual

The two style references for this site, always:

- **The New York Review of Architecture (NYRA)**
- **The Fence**

Both are printed-paper-first magazines, and the site is meant to read like
one. In practice that means:

- **Black, white and grey carries the page.** One accent colour (`river`,
  a saturated blue) spent sparingly and at full strength — category
  labels, drop caps, quote rules, buttons, Subscribe. `brick` is a brick
  red and is *only* ever functional: errors, alerts, a wrong crossword
  letter. Never decorative. There are no pale background washes of colour
  anywhere; if something needs to sit apart from the page, it gets a faint
  grey or a hairline, not a tint.
- **Type leads, not imagery.** Headlines are the design. Where a block
  needs to hold space, the answer is bigger, tighter type before it's a
  bigger picture.
- **Structure comes from rules and alignment.** Hairlines, left-aligned
  section headers sitting under a full-width rule, square corners. No
  rounded cards, drop shadows, gradients, or pill buttons.
- **Restraint over decoration.** If a colour, border or flourish isn't
  carrying information, it shouldn't be there.

Apple's homepage was a reference for one specific thing only — the
*structure* of the homepage article tiles (a headline leading, artwork
holding the rest of a large square). Everything about how it looks is
NYRA/The Fence, not Apple.

## Illustrations

The per-category line drawings in `components/CoverArt.jsx` are
placeholders. Real per-article illustrations are coming but aren't ready
yet — the homepage tiles are deliberately sized to show them off properly
when they land. Don't design around the placeholder artwork's limitations
(there are only five of them, so two pieces in the same category
currently share one), and don't treat "the artwork is weak" as a problem
to solve in layout.

## Working notes

- `README.md` carries a running, newest-first log of design decisions
  under `## Design system`. Add to it rather than replacing entries — the
  reasoning behind a past decision is often why a change is or isn't safe.
- Theme colours are admin-editable and stored in Supabase
  (`site_settings`), so changing the defaults in `lib/theme.js` does not
  change a live site on its own; it also has to be set in `/admin/theme`.
