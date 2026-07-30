// Per-block background/padding/alignment options, and the class list they
// translate to — shared by the admin canvas (components/admin/BlockEditor.jsx)
// and the public renderer (components/BlockContent.jsx), so a choice made in
// the editor is exactly what ships, the same "true visual canvas" principle
// as everything else in the block editor.
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

// Block types where left/center/right actually changes anything — the
// style panel hides the control for the rest rather than offering a
// no-op. A stray `align` value on a non-alignable block (e.g. from
// switching a block's type after setting one) is harmless: the class it
// produces just has nothing to act on.
export const ALIGNABLE_BLOCK_TYPES = ["paragraph", "heading", "quote", "button"];

// Spacer and divider are themselves spacing/rule elements, not content —
// a background or padding "container" around one doesn't mean anything,
// so the style panel isn't offered for them at all.
export const UNSTYLABLE_BLOCK_TYPES = ["spacer", "divider"];

function classFor(options, id, fallbackId) {
  const opt = options.find((o) => o.id === id) || options.find((o) => o.id === fallbackId);
  return opt?.class || "";
}

export function blockStyleClasses(style) {
  if (!style) return "";
  const background = classFor(BACKGROUND_OPTIONS, style.background, "none");
  const classes = [background, classFor(PADDING_OPTIONS, style.padding, "none"), classFor(ALIGN_OPTIONS, style.align, "left")];
  if (background) classes.push("rounded-sm");
  return classes.filter(Boolean).join(" ");
}
