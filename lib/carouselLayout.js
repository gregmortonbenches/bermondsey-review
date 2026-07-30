// Shared "how many items show at once, mobile vs desktop" logic for both
// scroll-snap carousels — the homepage's ArticleCarousel and the
// hero-carousel body block. "Auto" (the default, unset) keeps each
// carousel's own existing peek-width look untouched; picking an explicit
// count switches to a plain `100 / count`% width instead.
//
// The count drives an inline CSS custom property rather than a Tailwind
// class built from the number directly — `w-[${100 / count}%]` would be a
// different literal string per block/section, and Tailwind's JIT only
// generates CSS for class strings that appear literally in source, not
// ones assembled at runtime (the same reason `bg-brick/[0.1]` needed a
// CSS-variable-based colour, not a computed one, elsewhere in this
// codebase). `w-[var(--carousel-item-w-mobile)]` is a fixed literal
// Tailwind can see; only the variable's *value* varies per instance, via
// inline style.
export const MOBILE_ITEM_COUNT_OPTIONS = [
  { value: null, label: "Auto" },
  { value: 1, label: "1" },
  { value: 2, label: "2" },
  { value: 3, label: "3" },
];

export const DESKTOP_ITEM_COUNT_OPTIONS = [
  { value: null, label: "Auto" },
  { value: 2, label: "2" },
  { value: 3, label: "3" },
  { value: 4, label: "4" },
  { value: 5, label: "5" },
];

// Returns the two CSS custom properties to set on a carousel's outer
// element, or null when neither count is configured — callers keep their
// own hardcoded default classes in that case, so an untouched carousel
// looks pixel-identical to before this setting existed.
export function carouselWidthVars(mobileCount, desktopCount, { defaultMobile, defaultDesktop }) {
  if (!mobileCount && !desktopCount) return null;
  return {
    "--carousel-item-w-mobile": mobileCount ? `${100 / mobileCount}%` : defaultMobile,
    "--carousel-item-w-desktop": desktopCount ? `${100 / desktopCount}%` : defaultDesktop,
  };
}
