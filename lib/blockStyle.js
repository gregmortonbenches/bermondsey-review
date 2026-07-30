// Per-block background/padding/alignment/visibility options, and the
// class list they translate to — shared by the admin canvas
// (components/admin/BlockEditor.jsx) and the public renderer
// (components/BlockContent.jsx), so a choice made in the editor is
// exactly what ships, the same "true visual canvas" principle as
// everything else in the block editor.
//
// Backgrounds are theme-aware tints (--color-river/--color-brick, the same
// variables components/ThemeVars.jsx writes) rather than a raw colour
// picker — so a block's background always tracks the site's actual accent
// colours instead of drifting into a hardcoded hex that clashes the moment
// someone changes the theme in /admin/theme. Kept deliberately light-tint-only
// (no solid dark option) so there's no way to pick a combination that makes
// the block's own text unreadable, the same reasoning behind /admin/theme's
// restricted palette.
export const BACKGROUND_OPTIONS = [
  { id: "none", label: "None", class: "" },
  { id: "tint-river", label: "River tint", class: "bg-river/[0.08]" },
  { id: "tint-brick", label: "Brick tint", class: "bg-brick/[0.08]" },
  { id: "tint-steel", label: "Grey tint", class: "bg-steel/[0.08]" },
];

export const PADDING_OPTIONS = [
  { id: "none", label: "None", class: "" },
  { id: "small", label: "Small", class: "p-3" },
  { id: "medium", label: "Medium", class: "p-6" },
  { id: "large", label: "Large", class: "p-10" },
];

export const ALIGN_OPTIONS = [
  { id: "left", label: "Left", class: "text-left" },
  { id: "center", label: "Center", class: "text-center" },
  { id: "right", label: "Right", class: "text-right" },
];

// Which devices a block shows on — "on this device only" (e.g. a simpler
// mobile-only call-to-action, or a wide image that only makes sense on
// desktop) rather than every block having to look right everywhere.
// `sm` (640px) matches the breakpoint the rest of the site already treats
// as the mobile/desktop line (e.g. the masthead's own nav collapse).
export const VISIBILITY_OPTIONS = [
  { id: "all", label: "All devices", class: "" },
  { id: "desktop", label: "Desktop only", class: "hidden sm:block" },
  { id: "mobile", label: "Mobile only", class: "sm:hidden" },
];

// Block types where left/center/right actually changes anything — the
// style panel hides the control for the rest rather than offering a
// no-op. A stray `align` value on a non-alignable block (e.g. from
// switching a block's type after setting one) is harmless: the class it
// produces just has nothing to act on.
export const ALIGNABLE_BLOCK_TYPES = ["paragraph", "heading", "quote", "button"];

// Spacer and divider are themselves spacing/rule elements, not content —
// a background or padding "container" around one doesn't mean anything,
// so the style panel doesn't offer those two controls for them. Visibility
// still applies (a divider or gap you only want on mobile is a real,
// common case), so these aren't excluded from the style panel entirely —
// see the `containerStyleable` distinction in BlockEditor.jsx.
export const UNSTYLABLE_BLOCK_TYPES = ["spacer", "divider"];

function classFor(options, id, fallbackId) {
  const opt = options.find((o) => o.id === id) || options.find((o) => o.id === fallbackId);
  return opt?.class || "";
}

// `blockType` gates background/padding/alignment (meaningless on a
// spacer/divider) but never gates visibility, which applies to every
// block type uniformly.
export function blockStyleClasses(style, blockType) {
  if (!style) return "";
  const includeContainer = !UNSTYLABLE_BLOCK_TYPES.includes(blockType);
  const background = includeContainer ? classFor(BACKGROUND_OPTIONS, style.background, "none") : "";
  const classes = [
    background,
    includeContainer ? classFor(PADDING_OPTIONS, style.padding, "none") : "",
    includeContainer ? classFor(ALIGN_OPTIONS, style.align, "left") : "",
    style.visibility && style.visibility !== "all" ? classFor(VISIBILITY_OPTIONS, style.visibility, "all") : "",
  ];
  if (background) classes.push("rounded-sm");
  return classes.filter(Boolean).join(" ");
}
